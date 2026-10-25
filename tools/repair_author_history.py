"""Owner-approved bot metadata repair, preserving every commit's file tree.

No permissions are created here. --apply requires the exact expected main HEAD
and uses force-with-lease. Old history is bundled before any ref update.
"""
from pathlib import Path
import argparse,json,subprocess,os


def repair(expected,apply=False):
    def git(*args,input=None):return subprocess.check_output(['git',*args],input=input)
    head=git('rev-parse','HEAD').decode().strip()
    if head!=expected:raise ValueError('HEAD changed; abort rather than overwrite user work')
    cache=Path('.runtime');cache.mkdir(exist_ok=True)
    git('bundle','create',str(cache/'before-author-repair.bundle'),'--all')
    commits=git('rev-list','--reverse',head).decode().splitlines();owner=None
    for oid in commits:
        headers=git('cat-file','commit',oid).split(b'\n\n',1)[0]
        if b'github-actions[bot]' not in headers:
            owner=next(x[7:] for x in headers.splitlines() if x.startswith(b'author ')).rsplit(b'> ',1)[0]+b'>';break
    if owner is None:raise ValueError('no existing owner identity')
    mapping={};count=0
    for oid in commits:
        raw=git('cat-file','commit',oid);headers,message=raw.split(b'\n\n',1);lines=[];modified=False;bot=False
        for line in headers.splitlines():
            if line.startswith(b'parent '):
                old=line[7:].decode();new=mapping.get(old,old);modified|=new!=old;line=b'parent '+new.encode()
            if line.startswith((b'author ',b'committer ')) and b'github-actions[bot]' in line:
                field,value=line.split(b' ',1);line=field+b' '+owner+b' '+value.rsplit(b'> ',1)[1];modified=True;bot=True
            lines.append(line)
        if modified:
            clean=[];skip=False
            for line in lines:
                if line.startswith(b'gpgsig '):skip=True;continue
                if skip and line.startswith(b' '):continue
                skip=False;clean.append(line)
            if bot:message=message.rstrip()+b'\n\nAutomation: GitHub Actions import performed for repository owner.\n';count+=1
            new=git('hash-object','-t','commit','-w','--stdin',input=b'\n'.join(clean)+b'\n\n'+message).decode().strip()
        else:new=oid
        mapping[oid]=new
    candidate=mapping[head]
    if git('rev-parse',head+'^{tree}')!=git('rev-parse',candidate+'^{tree}'):raise ValueError('file tree changed; abort')
    plan=dict(original=head,candidate=candidate,bot_commits=count,identical_file_tree=True,applied=False)
    if apply and count:
        if os.environ.get('GITHUB_ACTOR')!='Qiuhan99':raise ValueError('owner-initiated run required')
        git('push','--force-with-lease=refs/heads/main:'+head,'origin',candidate+':refs/heads/main')
        git('update-ref','HEAD',candidate,head);plan['applied']=True
    (cache/'author-repair.json').write_text(json.dumps(plan,indent=2));print(json.dumps(plan));return plan


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--expected-head',required=True);p.add_argument('--apply',action='store_true');a=p.parse_args();repair(a.expected_head,a.apply)
