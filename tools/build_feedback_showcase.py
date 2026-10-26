"""Export the previously declared illustrations; never reselect by outcomes."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]

def build(site=ROOT/'site'):
    assets=Path(site)/'assets'
    def read(name):return json.loads((assets/name).read_text())
    selection=read('selected-cases.json');atlas=read('research-atlas.json');endpoint=read('endpoint24-selected.json')
    ids={c['storm_id'] for c in selection['cases']};storms=[s for s in atlas['storms'] if s['id'] in ids]
    if len(storms)!=4 or sum(len(s['origins']) for s in storms)!=44:raise ValueError('declared selected cohort changed')
    sources={name:hashlib.sha256((assets/name).read_bytes()).hexdigest() for name in ['selected-cases.json','research-atlas.json','endpoint24-selected.json']}
    payload=dict(schema=1,purpose='PREVIOUSLY_OUTCOME_SELECTED_ILLUSTRATIONS_NOT_INDEPENDENT_VALIDATION',
        source_sha256=sources,selection={k:selection[k] for k in ['cases','summary','selection']},endpoint=endpoint,atlas=dict(storms=storms))
    dest=assets/'feedback-showcase.json';dest.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'),allow_nan=False))
    print('Selected showcase:',len(storms),'storms / 44 origins;',dest.stat().st_size,'bytes; original full archive retained')

if __name__=='__main__':build()
