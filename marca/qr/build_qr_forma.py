# QR con la forma del logo: el sello conserva su anillo de texto y el centro (micro y maracas) está
# dibujado con los puntos del propio código. Los puntos que caen dentro del micro o las maracas toman
# su color (rosa, cian oscuros) y son baldosas macizas; el resto son puntos color noche.
# Polaridad normal (módulos oscuros sobre disco claro) y 2 módulos de margen limpio: la versión en
# negativo (v2) la leía el detector de Apple sobre la imagen, pero no la cámara del móvil.
# Uso: <python con segno y pillow> marca/qr/build_qr_forma.py [url] [nombre]
#      (antes: python3 marca/build_kit.py y renderizar parte-simbolo.svg a parte-simbolo.png 1588×1610)
import sys, os, math, pathlib, re, segno
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent
URL = sys.argv[1] if len(sys.argv) > 1 else "https://www.instagram.com/laalegria_2.0/"
NAME = sys.argv[2] if len(sys.argv) > 2 else "qr-sello-instagram"
PINK, CYAN, WHITE, NIGHT = "#ff2fb3", "#19e6ff", "#ffffff", "#0a0610"
DPINK, DTEAL, PAPER = "#cf0079", "#00788e", "#fff6fb"  # versiones oscuras para los módulos, disco claro
DTEAL = os.environ.get("REJILLA", DTEAL)    # color de la rejilla del micro (probado: el dorado falla con foto borrosa)
VX, VY, VW, VH = 230, 210, 1588, 1610      # marco del sello (logo/sello-color.svg)
CX, CY, R_RING, R_IN = 1027, 1068, 880, 562  # centro y radio del hueco libre dentro del anillo de texto (medidos sobre parte-anillo), borde exterior
SHADE = float(os.environ.get("SHADE", 0.2))                               # opacidad de la silueta de fondo (queda clara: no resta contraste)
GAP = 2                                     # margen limpio alrededor del código

# corrección H por defecto; con URLs largas (reseñas de Google) ECC=m mantiene el código en versión 5 y con
# módulos gruesos. Aquí nada tapa el código (el dibujo son los propios módulos), así que M basta.
qr = segno.make(URL, error=os.environ.get("ECC", "h"), boost_error=False, mask=int(os.environ["MASK"]) if "MASK" in os.environ else None)
M = [[bool(v) for v in row] for row in qr.matrix]
n = len(M)
m = 2 * R_IN * 0.98 / math.sqrt(2) / (n + 2 * GAP)  # el código y su margen caben en el disco claro
x0, y0 = CX - n * m / 2, CY - n * m / 2

sym = Image.open(HERE / "parte-simbolo.png").convert("RGBA")
def paint(x, y):
    """Color del símbolo bajo el punto (None si cae fuera del micro y las maracas)."""
    px, py = int(x - VX), int(y - VY)
    if not (0 <= px < sym.width and 0 <= py < sym.height): return None
    r, g, b, a = sym.getpixel((px, py))
    if a < 128: return None
    if b > 200 and g > 180 and r < 120: return DTEAL
    if r > 200 and g < 120: return DPINK
    return WHITE

def finder(r, c):
    return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)

# Tres capas de lectura: dentro del micro y las maracas los módulos son baldosas macizas que se tocan
# (el dibujo se ve sólido); fuera, puntos noche (la textura del QR); y alrededor del código
# solo se rellena la silueta, sin ruido decorativo, para que el contorno quede limpio.
dots = []
k = int(R_IN / m) + 2
for r in range(-k, n + k):
    for c in range(-k, n + k):
        x, y = x0 + (c + .5) * m, y0 + (r + .5) * m
        p = paint(x, y)
        if 0 <= r < n and 0 <= c < n:
            if not M[r][c] or finder(r, c): continue
        else:
            if not p or p == WHITE or (-GAP <= r < n + GAP and -GAP <= c < n + GAP): continue
            if math.hypot(x - CX, y - CY) > R_IN - m * .7: continue
        dots.append((x, y, p))

DOT_R = float(os.environ.get("DOT_R", .47))   # radio de los puntos (0.5 = se tocan); "SQ" = cuadrados
EYE_RX = float(os.environ.get("EYE_RX", 0))     # redondeo de los ojos: 0 (cuadrados). Redondeados, OpenCV deja de encontrarlos
def tile(x, y, f):
    if f in (None, WHITE):
        if os.environ.get("SQ"): return f'<rect x="{x - m / 2:.1f}" y="{y - m / 2:.1f}" width="{m:.1f}" height="{m:.1f}" fill="{NIGHT}"/>'
        return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{m * DOT_R:.1f}" fill="{NIGHT}"/>'
    s = m * .96
    return f'<rect x="{x - s / 2:.1f}" y="{y - s / 2:.1f}" width="{s:.1f}" height="{s:.1f}" rx="{m * .28:.1f}" fill="{f}"/>'

out = [f'<circle cx="{CX}" cy="{CY}" r="{R_RING}" fill="{NIGHT}"/>', f'<circle cx="{CX}" cy="{CY}" r="{R_IN}" fill="{PAPER}"/>']
# la silueta del micro y las maracas, muy tenue detrás de los puntos: da la forma sin restar contraste
shape = (HERE / "parte-simbolo.svg").read_text()
shape = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', shape.strip()).replace('id="m"', 'id="sm"').replace("url(#m)", "url(#sm)")
out.append(f'<g opacity="{SHADE}">{re.sub(r"<title>.*?</title>", "", shape)}</g>')
out += [tile(*d) for d in dots]
for r, c in [(0, 0), (0, n - 7), (n - 7, 0)]:                    # ojos: aro noche y pupila rosa oscuro
    x, y = x0 + c * m, y0 + r * m
    out.append(f'<rect x="{x + m / 2:.1f}" y="{y + m / 2:.1f}" width="{6 * m:.1f}" height="{6 * m:.1f}" rx="{2 * m * EYE_RX:.1f}" fill="none" stroke="{NIGHT}" stroke-width="{m:.1f}"/>')
    out.append(f'<rect x="{x + 2 * m:.1f}" y="{y + 2 * m:.1f}" width="{3 * m:.1f}" height="{3 * m:.1f}" rx="{m * EYE_RX:.1f}" fill="{DPINK}"/>')
ring = (HERE / "parte-anillo.svg").read_text()
ring = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', ring.strip()).replace('<title>Alegría 2.0 · Disco Pub</title>', '')
out.append(ring)
pad = 30
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{CX - R_RING - pad} {CY - R_RING - pad} {2 * (R_RING + pad)} {2 * (R_RING + pad)}" '
       f'role="img" aria-label="QR de Alegría 2.0"><title>Alegría 2.0 · QR</title>{"".join(out)}</svg>\n')
(HERE / f"{NAME}.svg").write_text(svg)
print(NAME, "versión", qr.version, "módulos", n, "módulo", round(m, 1))
