# Kit del logo elegido (el sello: micro de karaoke y maracas dentro de «ALEGRÍA 2.0 · DISCO PUB · MADRID»).
# Parte del SVG generado con Recraft (conceptos/v3/r2.svg): quita fondo y metadatos, convierte los
# huecos de las letras (pintados en color noche) en huecos reales con una máscara y saca las versiones.
# Uso: python3 marca/build_kit.py
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
SRC, OUT = ROOT / "conceptos/v3/r2.svg", ROOT / "logo"
OUT.mkdir(exist_ok=True)

PINK, CYAN, WHITE, NIGHT = "#ff2fb3", "#19e6ff", "#ffffff", "#0a0610"
ROLE = {"rgb(255,47,179)": "pink", "rgb(25,230,255)": "cyan", "rgb(255,255,255)": "white", "rgb(10,6,16)": "hole"}
SYMBOL = {1, 2, 3, 4, 5, 6, 7, 34, 35, 45, 46, 49, 50}  # micro, maracas (con mangos) y destellos
DOT = 48  # el punto entre PUB y MADRID: blanco en color, pero es tinta, no hueco

paths = []
for k, m in enumerate(re.finditer(r'<path [^>]*>', SRC.read_text())):
    d, fill = re.search(r' d="([^"]*)"', m.group(0))[1], re.search(r'fill="([^"]*)"', m.group(0))[1]
    if k == 0 or fill not in ROLE: continue  # fondo y un píxel de antialias suelto
    paths.append((k, ROLE[fill], d))

def build(name, colors, only=None, box=(0, 0, 2048, 2048), title="Alegría 2.0 · Disco Pub", bg=None):
    """colors: rol → color; un rol a None se recorta (hueco). Los huecos de letra siempre se recortan."""
    sel = [p for p in paths if only is None or p[0] in only]
    role = lambda k, r: (r if colors.get("white") else "cyan") if k == DOT else r
    cut = "".join(f'<path d="{d}" fill="#000"/>' for k, r, d in sel if r == "hole" or colors.get(role(k, r)) is None)
    ink = "".join(f'<path d="{d}" fill="{colors[role(k, r)]}"/>' for k, r, d in sel if r != "hole" and colors.get(role(k, r)))
    x, y, w, h = box
    back = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w * .22:.0f}" fill="{bg}"/>' if bg else ""
    (OUT / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" role="img" aria-label="{title}"><title>{title}</title>'
        f'<defs><mask id="m" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{w}" height="{h}">'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fff"/>{cut}</mask></defs>'
        f'{back}<g mask="url(#m)">{ink}</g></svg>\n')

FULL = (230, 210, 1588, 1610)          # sello con aire
SYM = (470, 508, 1120, 1120)           # micro y maracas, cuadrado
color = {"pink": PINK, "cyan": CYAN, "white": WHITE}
build("sello-color.svg", color, box=FULL)                                    # principal, sobre fondo oscuro
build("sello-color-claro.svg", {"pink": PINK, "cyan": NIGHT, "white": None}, box=FULL)  # sobre fondo claro
build("sello-blanco.svg", {"pink": WHITE, "cyan": WHITE, "white": None}, box=FULL)
build("sello-negro.svg", {"pink": NIGHT, "cyan": NIGHT, "white": None}, box=FULL)
build("sello-rosa.svg", {"pink": PINK, "cyan": PINK, "white": None}, box=FULL)
build("simbolo-color.svg", color, SYMBOL, SYM, "Alegría 2.0 · símbolo")
build("simbolo-blanco.svg", {"pink": WHITE, "cyan": WHITE, "white": None}, SYMBOL, SYM, "Alegría 2.0 · símbolo")
build("simbolo-negro.svg", {"pink": NIGHT, "cyan": NIGHT, "white": None}, SYMBOL, SYM, "Alegría 2.0 · símbolo")
build("icono-app.svg", color, SYMBOL, (400, 448, 1260, 1260), "Alegría 2.0", bg=NIGHT)
print("ok", sorted(p.name for p in OUT.glob("*.svg")))
# versión pequeña (favicon): sin destellos, que a 16 px son ruido, y con menos margen
build("favicon.svg", color, SYMBOL - {45, 46, 49, 50}, (470, 508, 1120, 1120), "Alegría 2.0", bg=NIGHT)
# para el QR con forma de logo (marca/qr): el símbolo y el anillo de texto por separado, en el marco del sello
build("parte-simbolo.svg", color, SYMBOL, FULL)
build("parte-anillo.svg", color, {p[0] for p in paths} - SYMBOL, FULL)
