from pathlib import Path
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer


def main():
    parser=argparse.ArgumentParser(prog='cyclone-live')
    sub=parser.add_subparsers(dest='command',required=True)
    serve=sub.add_parser('serve');serve.add_argument('--site',type=Path,default=Path('site'));serve.add_argument('--port',type=int,default=8766)
    refresh=sub.add_parser('refresh');refresh.add_argument('--site',type=Path,default=Path('site'));refresh.add_argument('--cache',type=Path,default=Path('.runtime'))
    refresh.add_argument('--tfm-payload',type=Path,help='trusted actual inference payload exported by private model service')
    args=parser.parse_args()
    if args.command=='serve':
        if not (args.site/'index.html').is_file():parser.error('site/index.html not found; use --site to select checkout')
        class Handler(SimpleHTTPRequestHandler):
            extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.md':'text/plain; charset=utf-8'}
            def list_directory(self,path):self.send_error(403);return None
            def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
        with ThreadingHTTPServer(('127.0.0.1',args.port),partial(Handler,directory=str(args.site.resolve()))) as server:
            print(f'http://127.0.0.1:{args.port}/',flush=True)
            try:server.serve_forever()
            except KeyboardInterrupt:pass
    else:
        from .refresh import refresh
        refresh(args.site,args.cache,args.tfm_payload)


if __name__=='__main__':main()
