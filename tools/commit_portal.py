"""Commit an owner-approved UI import without adding a bot to main authors."""
import subprocess,os
def main():
    if os.environ.get('GITHUB_ACTOR')!='Qiuhan99':raise ValueError('owner-initiated source import required')
    def git(*args):return subprocess.check_output(['git',*args])
    lines=git('log','--format=%an%x00%ae').decode().splitlines()
    name,email=next(x.split('\0') for x in lines if 'github-actions[bot]' not in x)
    git('config','user.name',name);git('config','user.email',email)
    git('add','site','src','tests','tools','PUBLIC_EXPORT_V2.json','PORTAL_RELEASE.json')
    if subprocess.run(['git','diff','--cached','--quiet']).returncode==0:return
    git('commit','-m','Restore full research portal and actual map comparisons','-m','Owner-approved automated import; private research materials remain excluded.')
    git('push','origin','HEAD:main')
if __name__=='__main__':main()
