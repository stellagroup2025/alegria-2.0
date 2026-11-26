"""Servidor local para revisar la web sin caché (siempre sirve la última versión).

Uso: python3 tools/serve.py [puerto]   (por defecto 8126, sirve la carpeta web/)
Acepta PUT bajo assets/img/ para que tools/render-copas.html guarde los renders.
"""
import functools
import http.server
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # Solo en local: las herramientas de tools/ guardan aquí sus renders (PUT /assets/img/...).
    def do_PUT(self):
        target = (ROOT / self.path.lstrip("/")).resolve()
        if not str(target).startswith(str(ROOT / "assets" / "img")):
            self.send_error(403); return
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(self.rfile.read(int(self.headers["Content-Length"])))
        self.send_response(201); self.end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8126
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    http.server.ThreadingHTTPServer(("", port), handler).serve_forever()
