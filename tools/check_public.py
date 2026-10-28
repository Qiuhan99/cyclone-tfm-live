"""Validate the allowlisted static bundle before it is made public."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,sys
ROOT=Path(__file__).resolve().parents[1]
REVIEWED_PUBLIC_IMAGES={
    'assets/champi-turn-paths-v2.png':'4e94ab803eba867723a99c586408e3371e5a1614ea71a478de07c083827a6ffb',
}


class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if key in ['src','href'] and value:self.links.append(value)


def check(root=ROOT):
    site=root/'site';errors=[]
    for page in site.glob('*.html'):
        p=Links();p.feed(page.read_text())
        for link in p.links:
            if link.startswith(('http:','https:','#','mailto:','data:')):continue
            target=link.split('#')[0].split('?')[0]
            if target and not (page.parent/target).is_file():errors.append('broken link '+page.name+': '+link)
    for module in site.glob('*.mjs'):
        for link in re.findall(r"(?:from\s*|import\s*)['\"](\./[^'\"]+)['\"]",module.read_text()):
            if not (module.parent/link.split("?")[0]).is_file():errors.append('missing module '+link)
    for path in site.rglob('*'):
        if not path.is_file():continue
        relative=str(path.relative_to(site));payload=path.read_bytes()
        if b'/Users/' in payload or re.search(rb'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----',payload):errors.append('private material '+relative)
        if path.suffix=='.png':
            if (not payload.startswith(b'\x89PNG\r\n\x1a\n') or
                REVIEWED_PUBLIC_IMAGES.get(relative)!=hashlib.sha256(payload).hexdigest()):
                errors.append('unreviewed public image '+relative)
            continue
        try:text=payload.decode('utf-8')
        except UnicodeDecodeError:
            errors.append('unsupported binary '+relative)
            continue
        if path.suffix=='.json':
            try:json.loads(text,parse_constant=lambda x:(_ for _ in ()).throw(ValueError(x)))
            except ValueError:errors.append('invalid finite JSON '+relative)
        if any(x in relative for x in ['workspace_inventory','MASTER_PROMPT','previous_project_conversation']):errors.append('nonpublic research file '+relative)
    # Do not permit adding weights or raw training data to this release surface.
    for name in ['data','artifacts','reports','src/forecasting','src/residuals']:
        if (root/name).exists():errors.append('outside authorized scope '+name)
    for path in root.rglob('*'):
        if any(x in path.parts for x in ['.git','.runtime','.venv','__pycache__','build','.openai']):continue
        if path.suffix in ['.safetensors','.ckpt','.pt','.pem','.parquet','.npz']:errors.append('excluded binary '+str(path.relative_to(root)))
    if errors:raise ValueError('\n'.join(errors))
    print('Public bundle OK: local links, module imports, finite JSON, no raw research/weights/private paths')


if __name__=='__main__':check()
