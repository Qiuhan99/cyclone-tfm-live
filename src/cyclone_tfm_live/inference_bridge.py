"""Private inference orchestration; publishing requires an explicit opt-in.

The algorithm, weights and contexts remain in the private research checkout.
This bridge never implements a substitute model or invents predictions.
"""
from pathlib import Path
from datetime import datetime,timezone
import argparse,copy,hashlib,json,os,re,subprocess,time
from .refresh import validate_tfm,atomic
from .publication import merge_live
from .verification import advance
from .agency_forecast import attach


def checked_payload(value):
    validate_tfm(value)
    if value.get('storm_id')!='CHAMPI_2026':raise ValueError('unsupported storm identity')
    own=[p for p in value['model']['paths'] if not p.get('model_raw_aid')]
    if {p['model_id'] for p in own}!={'TabPFN CV-F2','TabPFN CV-F2 + C0','TabPFN CV-F2 + C1'}:raise ValueError('missing real Base/C0/C1')
    issues={p['issue_time_utc'] for p in own}
    if len(issues)!=1:raise ValueError('Base/C0/C1 must share the same origin')
    now=datetime.now(timezone.utc)
    for p in own:
        for field in ['issue_time_utc','generated_at_utc']:
            stamp=datetime.fromisoformat(p[field].replace('Z','+00:00'))
            if stamp.tzinfo is None or stamp>now:raise ValueError('unverified or future model timestamp')
        if not re.fullmatch('[0-9a-f]{64}',p['raw_file_sha256']):raise ValueError('invalid raw source hash')
        for q in p['points']:
            if not -90<=q['lat_deg']<=90 or not -180<=q['lon_deg']<=180:raise ValueError('invalid model coordinates')
    # Do not leak a private machine path in the public transfer file.
    text=json.dumps(value,ensure_ascii=False,allow_nan=False)
    if '/Users/' in text or 'PRIVATE KEY' in text:raise ValueError('private material in transfer payload')
    return copy.deepcopy(value)


def run_inference(research,python):
    script=research/'scripts/refresh_champi_operations.py'
    if not script.is_file():raise ValueError('private research runner not found')
    subprocess.run([str(python),str(script)],cwd=research,check=True,timeout=1200)


def publish(payload,cache):
    """Optional Git transfer to live-data using separately configured credentials.

    No token is requested, printed, created or embedded. This function is never
    called unless the operator explicitly passes --publish.
    """
    repo=cache/'publisher.git';repo.mkdir(parents=True,exist_ok=True)
    env=dict(os.environ,GIT_TERMINAL_PROMPT='0')
    def git(*args,input=None,check=True):
        return subprocess.run(['git','--git-dir',str(repo),*args],input=input,capture_output=True,env=env,check=check,timeout=120)
    if not (repo/'HEAD').exists():git('init','--bare')
    remote=os.environ.get('CYCLONE_GIT_REMOTE','https://github.com/Qiuhan99/cyclone-tfm-live.git')
    if remote not in ['https://github.com/Qiuhan99/cyclone-tfm-live.git','ssh://git@ssh.github.com:443/Qiuhan99/cyclone-tfm-live.git']:
        raise ValueError('only the intended repository is allowed')
    if git('remote','get-url','origin',check=False).returncode:git('remote','add','origin',remote)
    else:git('remote','set-url','origin',remote)
    # Two public caches and the already-public main deployment workflow only.
    # A data branch needs its own workflow file for a push to trigger Actions.
    git('fetch','origin','main')
    workflow=git('show','FETCH_HEAD:.github/workflows/model-update.yml').stdout
    workflow_blob=git('hash-object','-w','--stdin',input=workflow).stdout.decode().strip()
    workflows_tree=git('mktree',input=f'100644 blob {workflow_blob}\tmodel-update.yml\n'.encode()).stdout.decode().strip()
    github_tree=git('mktree',input=f'040000 tree {workflows_tree}\tworkflows\n'.encode()).stdout.decode().strip()
    git('config','user.name','Qiuhan99');git('config','user.email','Qiuhan99@users.noreply.github.com')
    for attempt in range(3):
        git('fetch','origin','live-data');parent=git('rev-parse','FETCH_HEAD').stdout.decode().strip()
        previous=json.loads(git('show',parent+':champi-operations.json').stdout)
        merged=merge_live(previous,payload)
        merged['verification']=advance(previous,merged)
        entries=[f'040000 tree {github_tree}\t.github\n']
        files={'champi-operations.json':merged,'champi-operations-health.json':dict(checked_at_utc=merged['last_checked_at_utc'],ok=all(s['ok'] for s in merged['fetch_status'].values()),model_transfer=True)}
        for name,value in files.items():
            content=json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False).encode()
            oid=git('hash-object','-w','--stdin',input=content).stdout.decode().strip();entries.append(f'100644 blob {oid}\t{name}\n')
        tree=git('mktree',input=''.join(entries).encode()).stdout.decode().strip()
        if tree==git('rev-parse',parent+'^{tree}').stdout.decode().strip():return False
        commit=git('commit-tree',tree,'-p',parent,input=b'Publish actual private model inference; original times retained\n').stdout.decode().strip()
        pushed=git('push','origin',commit+':refs/heads/live-data',check=False)
        if pushed.returncode==0:
            atomic(cache/'last-transfer.json',dict(commit=commit,model_origin=merged['model']['input_last_valid_utc'],model_generated_at_utc=merged['generated_at_utc'],completed_at_utc=datetime.now(timezone.utc).isoformat()))
            return True
        # Retry only concurrent branch updates; authentication errors fail promptly.
        if b'rejected' not in pushed.stderr and b'cannot lock ref' not in pushed.stderr:raise RuntimeError('model upload failed; inspect Git/SSH access')
    raise RuntimeError('live-data moved during three non-force upload attempts')


def once(research,python,cache,*,infer=False,allow_publish=False):
    cache.mkdir(parents=True,exist_ok=True)
    if infer:run_inference(research,python)
    path=research/'web/dist/assets/champi-operations.json'
    value=checked_payload(json.loads(path.read_text()))
    if allow_publish:
        attach(value,datetime.now(timezone.utc).isoformat())
        value['publication']=dict(mode='mac_auto',transfer_prepared_at_utc=datetime.now(timezone.utc).isoformat(),poll_interval_seconds=900,
                                  model_source='private local TabPFN-3.5 + frozen C0/C1; actual version times retained')
    output=cache/'ready/champi-operations.json';atomic(output,value)
    status=dict(checked_at_utc=datetime.now(timezone.utc).isoformat(),model_origin=value['model']['input_last_valid_utc'],
        model_generated_at_utc=value['generated_at_utc'],payload_sha256=hashlib.sha256(output.read_bytes()).hexdigest(),
        inference_requested=infer,publish_enabled=allow_publish,published=False,
        state='validated_for_transfer' if allow_publish else 'ready_local_only; publishing not enabled')
    if allow_publish:
        status['published']=publish(value,cache)
        status['state']='uploaded; website deployment pending' if status['published'] else 'no new transfer; current model version retained'
    atomic(cache/'status.json',status)
    print(json.dumps(status,ensure_ascii=False));return status


def main():
    ap=argparse.ArgumentParser();ap.add_argument('command',choices=['once','watch']);ap.add_argument('--research-root',type=Path,required=True)
    ap.add_argument('--python',type=Path,required=True);ap.add_argument('--cache',type=Path,default=Path('.runtime/private-bridge'))
    ap.add_argument('--run-inference',action='store_true');ap.add_argument('--publish',action='store_true');ap.add_argument('--interval',type=int,default=900);args=ap.parse_args()
    if args.interval<900:ap.error('minimum inference interval is900seconds')
    # fcntl prevents concurrent bridge instances. It does not claim to lock an
    # independently launched legacy watcher: use either watcher or --run-inference.
    import fcntl
    args.cache.mkdir(parents=True,exist_ok=True)
    with (args.cache/'worker.lock').open('w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        while True:
            try:once(args.research_root,args.python,args.cache,infer=args.run_inference,allow_publish=args.publish)
            except Exception:
                atomic(args.cache/'status.json',dict(checked_at_utc=datetime.now(timezone.utc).isoformat(),ok=False,state='failed; public cache retained'))
                if args.command=='once':raise
            if args.command=='once':break
            time.sleep(args.interval)


if __name__=='__main__':main()
