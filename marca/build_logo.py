# Construye los conceptos de logo de Alegría 2.0 como trazados (sin texto vivo).
# Letras: Shrikhand y Unbounded (SIL Open Font License, uso en logos permitido), convertidas a curvas
# desde web/assets/fonts. Uso: <python con fonttools y brotli> marca/build_logo.py
# (primera ronda de conceptos, descartada por no decir «bar»: conceptos/v1/)
import math, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = pathlib.Path(__file__).resolve().parent
FONTS = ROOT.parent / "web/assets/fonts"
OUT = ROOT / "conceptos"
OUT.mkdir(exist_ok=True)
INK = "#000"


class Face:
    def __init__(self, file, wght=None):
        f = TTFont(FONTS / file)
        if wght and "fvar" in f: f = instantiateVariableFont(f, {"wght": wght})
        self.gs, self.cmap, self.hmtx = f.getGlyphSet(), f.getBestCmap(), f["hmtx"]

    def text(self, s, x, y, size, track=0.0):
        """Trazado de s con la línea base en y. Devuelve d, ancho y caja total (x0, y0, x1, y1)."""
        k, d, cx, box = size / 1000, [], x, [1e9, 1e9, -1e9, -1e9]
        for ch in s:
            name = self.cmap[ord(ch)]
            pen = SVGPathPen(self.gs)
            self.gs[name].draw(TransformPen(pen, (k, 0, 0, -k, cx, y)))
            bp = BoundsPen(self.gs); self.gs[name].draw(bp)
            if bp.bounds:
                a, b, c, e = bp.bounds
                box = [min(box[0], cx + a * k), min(box[1], y - e * k), max(box[2], cx + c * k), max(box[3], y - b * k)]
            d.append(pen.getCommands())
            cx += self.hmtx[name][0] * k + track * size
        return " ".join(d), cx - x - track * size, box

    def centered(self, s, cx, cy, size, track=0.0):
        _, _, b = self.text(s, 0, 0, size, track)
        return self.text(s, cx - (b[0] + b[2]) / 2, cy - (b[1] + b[3]) / 2, size, track)


SHRIKHAND = Face("shrikhand-latin-486ff6.woff2")
UNBOUNDED = Face("unbounded-latin-37e641.woff2", wght=600)


def sparkle(cx, cy, r, waist=0.16):
    """Destello de cuatro puntas (el «clin» del brindis, el brillo del neón)."""
    w = r * waist
    return (f"M{cx:.2f},{cy - r:.2f} C{cx + w:.2f},{cy - w:.2f} {cx + w:.2f},{cy - w:.2f} {cx + r:.2f},{cy:.2f} "
            f"C{cx + w:.2f},{cy + w:.2f} {cx + w:.2f},{cy + w:.2f} {cx:.2f},{cy + r:.2f} "
            f"C{cx - w:.2f},{cy + w:.2f} {cx - w:.2f},{cy + w:.2f} {cx - r:.2f},{cy:.2f} "
            f"C{cx - w:.2f},{cy - w:.2f} {cx - w:.2f},{cy - w:.2f} {cx:.2f},{cy - r:.2f} Z")


def svg(name, w, h, body, title):
    (OUT / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{title}">'
                            f'<title>{title}</title>{body}</svg>\n')


def wordmark(x, base, size):
    """«Alegría» con «2.0» volado. Devuelve el cuerpo SVG y el borde derecho."""
    d, w, box = SHRIKHAND.text("Alegría", x, base, size, track=-0.01)
    d2, w2, _ = SHRIKHAND.text("2.0", x + w + size * 0.03, box[1] + size * 0.34, size * 0.36)
    return f'<path d="{d}"/><path d="{d2}"/>', x + w + size * 0.03 + w2


def rot(pts, ox, oy, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return [(ox + x * c - y * s, oy + x * s + y * c) for x, y in pts]


# ---------- A · El letrero (emblema) ----------
# El propio cartel de neón del local: marco de tubo redondeado, «DISCO PUB» arriba, «Alegría» en
# tubo (solo el contorno de la letra, como el rótulo de la web) y «2.0» abajo a la derecha.
TUBE = 7
def sign(w, h):
    r, m = 34, TUBE / 2 + 2
    frame = f'<rect x="{m}" y="{m}" width="{w - 2 * m}" height="{h - 2 * m}" rx="{r}" fill="none" stroke="{INK}" stroke-width="{TUBE}"/>'
    dp, _, bp = UNBOUNDED.centered("DISCO PUB", w / 2, 44, 22, track=0.28)
    da, _, ba = SHRIKHAND.centered("Alegría", w / 2 - 34, h / 2 + 14, 112, track=-0.01)
    d2, _, b2 = SHRIKHAND.text("2.0", ba[2] + 10, ba[1] + 44, 46)
    tube = f'fill="none" stroke="{INK}" stroke-width="{TUBE * 0.62:.1f}" stroke-linejoin="round"'
    # líneas a los lados de DISCO PUB, como los cortes del tubo en un rótulo
    lines = (f'<path d="M{bp[0] - 46},{44} H{bp[0] - 14} M{bp[2] + 14},{44} H{bp[2] + 46}" stroke="{INK}" stroke-width="{TUBE * 0.62:.1f}" stroke-linecap="round"/>')
    return frame + f'<path d="{dp}" fill="{INK}"/>' + lines + f'<path d="{da}" {tube}/><path d="{d2}" {tube}/>'
svg("a-lockup.svg", 600, 256, sign(600, 256), "Alegría 2.0 · Disco pub")
# símbolo: la A en tubo dentro del marco del letrero
dA, _, _ = SHRIKHAND.centered("A", 124, 136, 170)
svg("a-symbol.svg", 256, 256,
    f'<rect x="5.5" y="5.5" width="245" height="245" rx="46" fill="none" stroke="{INK}" stroke-width="{TUBE + 2}"/>'
    f'<path d="{dA}" fill="none" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
    f'<path d="{sparkle(196, 70, 22)}" fill="{INK}"/>', "Alegría 2.0 · símbolo")

# ---------- B · El brindis (símbolo) ----------
# Dos copas de cava que brindan inclinadas: sus cálices se tocan arriba y dibujan una A. El líquido
# hace de travesaño y el destello es el «¡clin!».
def flute(fx, fy, deg):
    # copa vertical en coordenadas locales: pie en (0,0), boca a 172 de altura
    p = lambda x, y: rot([(x, y)], fx, fy, deg)[0]
    f = lambda *xy: " ".join(f"{a:.2f},{b:.2f}" for a, b in (p(xy[i], xy[i + 1]) for i in range(0, len(xy), 2)))
    glass = (f"M{f(-17, -172)} L{f(17, -172)} C{f(17, -118, 13, -88, 0, -80)} C{f(-13, -88, -17, -118, -17, -172)} Z")
    liquid = (f"M{f(-14.5, -128)} L{f(14.5, -128)} C{f(13.5, -104, 9, -90, 0, -85)} C{f(-9, -90, -13.5, -104, -14.5, -128)} Z")
    stem = f"M{f(-3, -82)} L{f(3, -82)} L{f(3, -10)} L{f(-3, -10)} Z"
    foot = f"M{f(-26, 0)} C{f(-20, -9, -8, -11, 0, -11)} C{f(8, -11, 20, -9, 26, 0)} Z"
    return glass, liquid, stem, foot
def brindis():
    body = ""
    for fx, deg in [(64, 14), (192, -14)]:
        glass, liquid, stem, foot = flute(fx, 228, deg)
        body += (f'<path d="{glass}" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
                 f'<path d="{liquid} {stem} {foot}" fill="{INK}"/>')
    return body + f'<path d="{sparkle(128, 34, 24)}" fill="{INK}"/>'
svg("b-symbol.svg", 256, 256, brindis(), "Alegría 2.0 · símbolo")
wb, right = wordmark(262, 172, 108)
svg("b-lockup.svg", right + 20, 256, f'<g>{brindis()}</g><g fill="{INK}">{wb}</g>', "Alegría 2.0")

# ---------- C · La copa disco (símbolo) ----------
# Una copa de cóctel cuya aceituna es una bola de discoteca: bar de copas y pista de baile en una
# sola forma, el «disco pub» literal pero dicho con gracia. El destello es el reflejo de la bola.
def copa_micro():
    rim_l, rim_r, rim_y, tip = 30, 198, 70, (114, 150)
    glass = f"M{rim_l},{rim_y} H{rim_r} L{tip[0] + 4},{tip[1] - 2} Q{tip[0]},{tip[1] + 3} {tip[0] - 4},{tip[1] - 2} Z"
    level = 92  # cóctel hasta aquí; por encima, vidrio (solo el borde)
    k = (level - rim_y) / (tip[1] - rim_y)
    ll, lr = rim_l + (tip[0] - rim_l) * k, rim_r + (tip[0] - rim_r) * k
    liquid = f"M{ll:.1f},{level} H{lr:.1f} L{tip[0] + 4},{tip[1] - 2} Q{tip[0]},{tip[1] + 3} {tip[0] - 4},{tip[1] - 2} Z"
    stem = f"M{tip[0] - 4},{tip[1] - 4} H{tip[0] + 4} V212 H{tip[0] - 4} Z"
    foot = f"M{tip[0] - 46},224 C{tip[0] - 38},213 {tip[0] - 16},210 {tip[0]},210 C{tip[0] + 16},210 {tip[0] + 38},213 {tip[0] + 46},224 Z"
    # bola de discoteca apoyada en el borde derecho, con palillo
    bx, by, br = 200, 40, 34  # apoyada sobre el borde, no atravesada por él
    # la bola es un mosaico de espejitos: teselas cuadradas cuyo centro cae dentro del círculo
    t, g = 6.2, 2.2  # tesela y junta
    tiles = []
    n = int(br // (t + g)) + 1
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            cx, cy = bx + i * (t + g), by + j * (t + g)
            if (cx - bx) ** 2 + (cy - by) ** 2 <= (br - 6.5) ** 2:
                tiles.append(f"M{cx - t / 2:.1f},{cy - t / 2:.1f} h{t} v{t} h{-t} Z")
    ring = f"M{bx},{by - br} A{br},{br} 0 1 1 {bx - 0.01},{by - br} Z M{bx},{by - br + 4} A{br - 4},{br - 4} 0 1 0 {bx + 0.01},{by - br + 4} Z"
    ball = ring + " " + " ".join(tiles)  # aro exterior: la silueta queda redonda aunque el mosaico sea de cuadros
    pick = "M148,106 L176,82 L180,86 L152,110 Z"
    return (f'<path d="{glass}" fill="none" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>'
            f'<path d="{liquid} {stem} {foot} {pick}" fill="{INK}"/>'
            f'<path d="{ball}" fill="{INK}"/>'
            f'<path d="{sparkle(242, 12, 13)}" fill="{INK}"/>')
svg("c-symbol.svg", 256, 256, copa_micro(), "Alegría 2.0 · símbolo")
wc, right = wordmark(262, 172, 108)
svg("c-lockup.svg", right + 20, 256, f'<g>{copa_micro()}</g><g fill="{INK}">{wc}</g>', "Alegría 2.0")
print("ok", sorted(p.name for p in OUT.glob("*.svg")))
