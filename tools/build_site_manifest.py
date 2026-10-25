from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
def main():
    site=ROOT/'site';dynamic={'assets/champi-operations.json','assets/champi-operations-health.json'}
    hashes={str(p.relative_to(site)):hashlib.sha256(p.read_bytes()).hexdigest() for p in site.rglob('*') if p.is_file() and p.name!='site-manifest.json' and str(p.relative_to(site)) not in dynamic}
    (site/'assets/site-manifest.json').write_text(json.dumps(dict(scope='Current public portal static assets; numerical research results retained',sha256=hashes,dynamic_assets=sorted(dynamic)),indent=2))
    print('Static manifest:',len(hashes),'files; live JSON tracked separately')
if __name__=='__main__':main()
