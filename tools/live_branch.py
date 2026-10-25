"""Keep public live JSON across ephemeral Actions runs without raw archives."""
from pathlib import Path
import subprocess,argparse,tempfile,json,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from cyclone_tfm_live.publication import merge_live
FILES=['champi-operations.json','champi-operations-health.json']


def git(*args,check=True,input=None):
    return subprocess.run(['git',*args],input=input,check=check,capture_output=True)


def main():
    ap=argparse.ArgumentParser();ap.add_argument('command',choices=['restore','save']);args=ap.parse_args()
    result=git('ls-remote','--exit-code','--heads','origin','live-data',check=False)
    if result.returncode not in [0,2]:raise RuntimeError('cannot inspect live-data branch')
    exists=result.returncode==0
    if exists:git('fetch','--depth=1','origin','live-data')
    if args.command=='restore':
        if not exists:return
        # Verify both JSON files before replacing either file.
        data={n:git('show','FETCH_HEAD:'+n).stdout for n in FILES}
        for value in data.values():json.loads(value)
        for n,value in data.items():(Path('site/assets')/n).write_bytes(value)
        return
    # Separate temporary index/tree; never commit the checkout or private data.
    target=Path('site/assets/champi-operations.json');candidate=json.loads(target.read_text())
    if exists:
        current=json.loads(git('show','FETCH_HEAD:champi-operations.json').stdout)
        candidate=merge_live(current,candidate)
    target.write_text(json.dumps(candidate,ensure_ascii=False,indent=2,allow_nan=False))
    import os
    with tempfile.TemporaryDirectory() as temp:
        env=dict(os.environ,GIT_INDEX_FILE=str(Path(temp)/'index'))
        subprocess.run(['git','read-tree','--empty'],env=env,check=True)
        for name in FILES:
            digest=git('hash-object','-w','site/assets/'+name).stdout.decode().strip()
            subprocess.run(['git','update-index','--add','--cacheinfo',f'100644,{digest},{name}'],env=env,check=True)
        # Retain the public workflow so an SSH model update triggers Pages.
        digest=git('hash-object','-w','.github/workflows/pages.yml').stdout.decode().strip()
        subprocess.run(['git','update-index','--add','--cacheinfo',f'100644,{digest},.github/workflows/pages.yml'],env=env,check=True)
        tree=subprocess.check_output(['git','write-tree'],env=env).decode().strip()
    if exists and git('rev-parse','FETCH_HEAD^{tree}').stdout.decode().strip()==tree:return
    git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
    parents=['-p','FETCH_HEAD'] if exists else []
    commit=git('commit-tree',tree,*parents,input=b'Update public typhoon data\n').stdout.decode().strip()
    git('push','origin',commit+':refs/heads/live-data')


if __name__=='__main__':main()
