# QR con diseño de Alegría 2.0: código redondo con el sello en el centro.
# Uso: <python con segno> marca/qr/build_qr.py [url] [nombre] [texto arriba] [texto abajo]
# El QR va con corrección de errores H (30 %), así que el sello del centro (≈ 20 % del ancho)
# y los puntos redondos no impiden leerlo. Los puntos decorativos de fuera quedan separados por un
# margen de 2 módulos para que el lector encuentre bien los tres ojos.
import sys, math, random, pathlib, base64, re, segno
HERE = pathlib.Path(__file__).resolve().parent
URL = sys.argv[1] if len(sys.argv) > 1 else "https://www.instagram.com/laalegria_2.0/"
NAME = sys.argv[2] if len(sys.argv) > 2 else "qr-instagram"
TOP = sys.argv[3] if len(sys.argv) > 3 else "ESCANÉAME · SÍGUENOS"
BOTTOM = sys.argv[4] if len(sys.argv) > 4 else "@LAALEGRIA_2.0"
PINK, CYAN, VIOLET, NIGHT, PAPER = "#ff2fb3", "#19e6ff", "#7b2cff", "#0a0610", "#fff4fb"

qr = segno.make(URL, error="h", boost_error=False)
M = [[bool(v) for v in row] for row in qr.matrix]
n = len(M)
W, C = 1000, 500                     # lienzo y centro
R_OUT, R_PAPER = 495, 418            # aro noche (con el texto) y disco claro
m = 2 * (R_PAPER - 26) / (n + 4) / math.sqrt(2) * 1.0  # módulo: el cuadrado del QR más su margen cabe en el disco
x0 = C - n * m / 2                   # esquina del QR

def finder(r, c):                    # ¿está el módulo dentro de uno de los tres ojos?
    return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)

logo = 0.30 * n * m                  # diámetro del hueco del sello
out = []
out.append(f'<circle cx="{C}" cy="{C}" r="{R_OUT}" fill="{NIGHT}"/>')
out.append(f'<circle cx="{C}" cy="{C}" r="{R_PAPER}" fill="{PAPER}"/>')

# puntos decorativos alrededor del código, en la rejilla del QR, dentro del disco claro
rnd = random.Random(7)
k = int((R_PAPER - 10) / m) + 1
pal = [PINK, PINK, VIOLET, CYAN]
for r in range(-k, n + k):
    for c in range(-k, n + k):
        if -2 <= r < n + 2 and -2 <= c < n + 2: continue
        cx, cy = x0 + (c + .5) * m, x0 + (r + .5) * m
        d = math.hypot(cx - C, cy - C)
        if d > R_PAPER - m * 0.9 or rnd.random() > 0.5: continue
        fade = max(0.35, 1 - (d - n * m / 2) / (R_PAPER - n * m / 2) * 0.6)
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{m * .36:.1f}" fill="{rnd.choice(pal)}" opacity="{fade:.2f}"/>')

# módulos del código como puntos, salvo los ojos y el hueco del sello
for r in range(n):
    for c in range(n):
        if not M[r][c] or finder(r, c): continue
        cx, cy = x0 + (c + .5) * m, x0 + (r + .5) * m
        if math.hypot(cx - C, cy - C) < logo / 2 + m * .3: continue
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{m * .47:.1f}" fill="{NIGHT}"/>')

# ojos: aro rosa y pupila noche, cuadrados (redondeados, los lectores exigentes no los encuentran)
for r, c in [(0, 0), (0, n - 7), (n - 7, 0)]:
    x, y = x0 + c * m, x0 + r * m
    out.append(f'<rect x="{x + m / 2:.1f}" y="{y + m / 2:.1f}" width="{6 * m:.1f}" height="{6 * m:.1f}" fill="none" stroke="{PINK}" stroke-width="{m:.1f}"/>')
    out.append(f'<rect x="{x + 2 * m:.1f}" y="{y + 2 * m:.1f}" width="{3 * m:.1f}" height="{3 * m:.1f}" fill="{NIGHT}"/>')

# sello en el centro, sobre su disco noche
out.append(f'<circle cx="{C}" cy="{C}" r="{logo / 2:.1f}" fill="{NIGHT}"/>')
s = logo * 0.9
# el sello va incrustado (un <image> externo no se ve en todos los programas)
seal = (HERE.parent / "logo/sello-color.svg").read_text()
vb = re.search(r'viewBox="([^"]*)"', seal)[1]
inner = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', seal.strip()).replace('id="m"', 'id="sm"').replace("url(#m)", "url(#sm)")
out.append(f'<svg x="{C - s / 2:.1f}" y="{C - s / 2:.1f}" width="{s:.1f}" height="{s:.1f}" viewBox="{vb}">{inner}</svg>')

# texto curvo en el aro
font = "data:font/woff2;base64," + base64.b64encode((HERE.parents[1] / "web/assets/fonts/unbounded-latin-37e641.woff2").read_bytes()).decode()
rt = (R_OUT + R_PAPER) / 2
out.append(f'<defs><style>@font-face{{font-family:U;src:url({font});font-weight:200 900}}</style>'
           f'<path id="t" d="M{C - rt},{C} A{rt},{rt} 0 1 1 {C + rt},{C} A{rt},{rt} 0 1 1 {C - rt},{C}"/>'
           f'<path id="b" d="M{C - rt},{C} A{rt},{rt} 0 0 0 {C + rt},{C}"/></defs>')
txt = f'font-family="U" font-weight="700" font-size="30" letter-spacing="6" dominant-baseline="central" text-anchor="middle"'
out.append(f'<text {txt} fill="#fff"><textPath href="#t" startOffset="25%">{TOP}</textPath></text>')
out.append(f'<text {txt} fill="{CYAN}"><textPath href="#b" startOffset="50%">{BOTTOM}</textPath></text>')
for a in (180, 0):
    x = C + rt * math.cos(math.radians(a)); out.append(f'<circle cx="{x:.1f}" cy="{C}" r="6" fill="{PINK}"/>')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}" role="img" aria-label="QR Alegría 2.0">{"".join(out)}</svg>\n'
(HERE / f"{NAME}.svg").write_text(svg)
print(NAME, "versión", qr.version, "módulos", n, "URL", URL)
