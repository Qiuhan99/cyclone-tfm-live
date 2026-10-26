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
    own = [p for p in out['model']['paths'] if not p.get('model_raw_aid')]
    external = [p for p in public['model']['paths'] if p.get('model_raw_aid')]
    out['model']['paths'] = own + copy.deepcopy(external)
    out['generated_at_utc'] = model['generated_at_utc']
    for field in ('publication', 'data_profile', 'inference_refresh'):
        if field in model:
            out[field] = copy.deepcopy(model[field])
    # Keep the most recent observed prefix, including source revisions.
    def observation_version(p):
        return (max((stamp(o['valid_time_utc']) for o in p.get('observations', [])), default=stamp(None)),
                stamp(p.get('track_source', {}).get('downloaded_at_utc')))
    observed = max((existing, candidate), key=observation_version)
    for field in ('observations', 'track_source'):
        if field in observed:
            out[field] = copy.deepcopy(observed[field])
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
