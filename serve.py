from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent / 'dist' / 'client'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def list_directory(self, path):
        self.send_error(404)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    print('随它转已启动：http://localhost:8765/ （保持电脑开机）', flush=True)
    ThreadingHTTPServer(('0.0.0.0', 8765), Handler).serve_forever()
