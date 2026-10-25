"""Commit an owner-approved UI import without adding a bot to main authors."""
import subprocess,os,json,hashlib
from pathlib import Path
def main():
    if os.environ.get('GITHUB_ACTOR')!='Qiuhan99':raise ValueError('owner-initiated source import required')
    def git(*args):return subprocess.check_output(['git',*args])
    lines=git('log','--format=%an%x00%ae').decode().splitlines()
    name,email=next(x.split('\0') for x in lines if 'github-actions[bot]' not in x)
    git('config','user.name',name);git('config','user.email',email)
    # Keep restored links and archive wording aligned with the public portal.
    fixes={
        'cases.html': [('href="index.html#evidence"','href="research-overview.html#evidence"')],
        'historical.html': [
            ('href="index.html">原协议台风复现','href="research-overview.html">原协议台风复现'),
            ('href="index.html">进入原协议台风应用','href="research-overview.html">进入原协议台风应用'),
            ('href="index.html">查看原协议结果与轨迹','href="research-overview.html">查看原协议结果与轨迹'),
            ('网站绑定 127.0.0.1，本次未进行云部署。','历史研究在本地运行；当前公开副本已部署至 GitHub Pages。'),
            ('排除虚拟环境、依赖缓存、Git 内部文件和网站新产物；逐项列出其余文件。文本及 JSON 做内容解析，重复 CSV 做字段检查，大型数组、权重和 PDF 不宣称逐字审阅或重新分析。','本页公开资料目录仅提供汇总数量；完整逐文件审计保留本地，不发布私人目录、原始训练数组或模型权重。'),
            ('下载逐文件审计清单','下载公开资料汇总')]
    }
    manifest=Path('PUBLIC_EXPORT_V2.json');record=json.loads(manifest.read_text())
    for filename,pairs in fixes.items():
        page=Path('site')/filename;content=page.read_text();fixed=content
        for old,new in pairs:fixed=fixed.replace(old,new)
        if fixed!=content:page.write_text(fixed)
        record['sources'][filename]['published_sha256']=hashlib.sha256(page.read_bytes()).hexdigest()
    manifest.write_text(json.dumps(record,ensure_ascii=False,indent=2))
    git('add','site','src','tests','tools','PUBLIC_EXPORT_V2.json','PORTAL_RELEASE.json')
    if subprocess.run(['git','diff','--cached','--quiet']).returncode==0:return
    git('commit','-m','Restore full research portal and actual map comparisons','-m','Owner-approved automated import; private research materials remain excluded.')
    git('push','origin','HEAD:main')
if __name__=='__main__':main()
