# Servidor del estudio: sirve los archivos de esta carpeta y guarda lo que la página manda con POST /save?name=archivo
import http.server, os, sys, urllib.parse, base64

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')
os.makedirs(OUT, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = os.path.basename(q.get('name', ['x.bin'])[0])
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        if body.startswith(b'data:'): body = base64.b64decode(body.split(b',', 1)[1])
        open(os.path.join(OUT, name), 'wb').write(body)
        self.send_response(200); self.send_header('Content-Type', 'text/plain'); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass

http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8771), H).serve_forever()
