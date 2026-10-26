"""Merge independent public-source and private-model updates without rollback."""
import copy
from datetime import datetime, timezone


def stamp(value):
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('publication timestamps must include timezone')
    return result


def model_version(payload):
    return (stamp(payload['model']['input_last_valid_utc']),
            stamp(payload['generated_at_utc']))


def merge_live(existing, candidate):
    """Newer observations/official checks and newer model versions are separate.

    A cloud refresh that began before a Mac upload must not erase that model.
    A Mac upload must not erase newer official/external information either.
    """
    if existing.get('storm_id') != candidate.get('storm_id'):
        raise ValueError('cannot merge different storms')
    public = max((existing, candidate), key=lambda p: stamp(p.get('last_checked_at_utc')))
    model = max((existing, candidate), key=model_version)
    out = copy.deepcopy(public)
    out['model'] = copy.deepcopy(model['model'])
    own = [p for p in out['model']['paths'] if not p.get('model_raw_aid') and p.get('model_family')!='tsfm']
    # Frozen TSFM inference has a separate version clock: adding a fresh TSFM
    # forecast must not retime or replace an unchanged TabPFN model version.
    tsfm={}
    for source in (existing,candidate):
        for path in source['model']['paths']:
            if path.get('model_family')!='tsfm':continue
            key=path['model_id'];old=tsfm.get(key)
            if old is None or (stamp(path['issue_time_utc']),stamp(path.get('generated_at_utc')))>(stamp(old['issue_time_utc']),stamp(old.get('generated_at_utc'))):tsfm[key]=copy.deepcopy(path)
    components=[p['model']['tsfm'] for p in (existing,candidate) if p['model'].get('tsfm')]
    if components:out['model']['tsfm']=copy.deepcopy(max(components,key=lambda v:stamp(v.get('checked_at_utc'))))
    external = [p for p in public['model']['paths'] if p.get('model_raw_aid')]
    out['model']['paths'] = own + list(tsfm.values()) + copy.deepcopy(external)
    out['generated_at_utc'] = model['generated_at_utc']
    for field in ('publication', 'data_profile', 'inference_refresh'):
        if field in model:
            out[field] = copy.deepcopy(model[field])
    publications=[(p['publication'],p) for p in (existing,candidate) if p.get('publication') and model_version(p)==model_version(model)]
    if publications:out['publication']=copy.deepcopy(max(publications,key=lambda pair:stamp(pair[0].get('transfer_prepared_at_utc') or pair[1].get('generated_at_utc')))[0])
    # Keep the most recent observed prefix, including source revisions.
    def observation_version(p):
        return (max((stamp(o['valid_time_utc']) for o in p.get('observations', [])), default=stamp(None)),
                stamp(p.get('track_source', {}).get('downloaded_at_utc')))
    observed = max((existing, candidate), key=observation_version)
    for field in ('observations', 'track_source'):
        if field in observed:
            out[field] = copy.deepcopy(observed[field])
    # This is derived, not an immutable forecast. Rebuild after merging paths,
    # so a late cloud refresh cannot leave analysis from a different model set.
    if any('forecast_analysis' in p for p in (existing,candidate)):
        from pathlib import Path
        import json
        coast_path=Path(__file__).resolve().parents[2]/'site/assets/coastline.json'
        if coast_path.exists():
            from .official import Coast
            from .forecast_analysis import build_analysis
            out['forecast_analysis']=build_analysis(out,Coast(json.loads(coast_path.read_text())['rings']))
    # Agency retrieval and the public verification ledger have their own clocks.
    for field, clock in [('agency_forecasts', 'checked_at_utc'), ('verification', 'updated_at_utc')]:
        choices = [p[field] for p in (existing, candidate) if field in p]
        if choices:
            out[field] = copy.deepcopy(max(choices, key=lambda v: stamp(v.get('last_attempt_at_utc',v.get(clock)) if field=='agency_forecasts' else v.get(clock))))
    # Retrieval recency must not revive an older warning after cancellation.
    for kind in ('center','warning'):
        choices=[p.get('official',{}).get(kind) for p in (public,existing,candidate)]
        choices=[v for v in choices if v]
        if choices:
            out.setdefault('official',{})[kind]=copy.deepcopy(max(choices,key=lambda v:
                (stamp(v.get('issued_at_utc',v.get('valid_time_utc'))),stamp(v.get('retrieved_at_utc')))))
    return out
