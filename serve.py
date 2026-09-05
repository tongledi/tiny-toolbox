"""Serve only the built toolbox. Run with Python 3; no third-party packages."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

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
    if not (ROOT / 'index.html').is_file():
        raise SystemExit('尚未构建网页，请先运行 npm ci 和 npm run build。')
    try:
        server = ThreadingHTTPServer(('0.0.0.0', 8765), Handler)
    except OSError as error:
        raise SystemExit(f'无法启动 8765 端口，请确认没有其他服务正在使用：{error}')
    print('随手工具箱：http://localhost:8765/ （局域网访问时保持电脑开机）', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
