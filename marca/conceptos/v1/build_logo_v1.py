# Construye los conceptos de logo de Alegría 2.0 como trazados (sin texto vivo).
# Letras: Shrikhand (SIL Open Font License, uso en logos permitido), convertidas a curvas desde
# web/assets/fonts. Uso: <python con fonttools y brotli> marca/build_logo.py
import math, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = pathlib.Path(__file__).resolve().parent
FONT = TTFont(ROOT.parent / "web/assets/fonts/shrikhand-latin-486ff6.woff2")
GS, CMAP, HMTX = FONT.getGlyphSet(), FONT.getBestCmap(), FONT["hmtx"]
OUT = ROOT / "conceptos"
OUT.mkdir(exist_ok=True)
INK = "#000"


def glyphs(text, x, y, size, track=0.0, swap=None):
    """Trazado del texto con la línea base en y. swap: {carácter: nombre de glifo}. Devuelve d, ancho y cajas por letra."""
    k, d, boxes, cx = size / 1000, [], [], x
    for ch in text:
        name = (swap or {}).get(ch) or CMAP[ord(ch)]
        pen = SVGPathPen(GS)
        GS[name].draw(TransformPen(pen, (k, 0, 0, -k, cx, y)))
        bp = BoundsPen(GS); GS[name].draw(bp)
        if bp.bounds:
            x0, y0, x1, y1 = bp.bounds
            boxes.append((ch, cx + x0 * k, y - y1 * k, cx + x1 * k, y - y0 * k))
        d.append(pen.getCommands())
        cx += HMTX[name][0] * k + track * size
    return " ".join(d), cx - x, boxes


def sparkle(cx, cy, r, waist=0.16):
    """Destello de cuatro puntas (la «chispa» de Alegría): curvas cóncavas entre las puntas."""
    w = r * waist
    return (f"M{cx:.2f},{cy - r:.2f} C{cx + w:.2f},{cy - w:.2f} {cx + w:.2f},{cy - w:.2f} {cx + r:.2f},{cy:.2f} "
            f"C{cx + w:.2f},{cy + w:.2f} {cx + w:.2f},{cy + w:.2f} {cx:.2f},{cy + r:.2f} "
            f"C{cx - w:.2f},{cy + w:.2f} {cx - w:.2f},{cy + w:.2f} {cx - r:.2f},{cy:.2f} "
            f"C{cx - w:.2f},{cy - w:.2f} {cx - w:.2f},{cy - w:.2f} {cx:.2f},{cy - r:.2f} Z")


def svg(name, w, h, body, title):
    (OUT / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{title}">'
                            f'<title>{title}</title>{body}</svg>\n')


def wordmark(x, base, size, with_two=True):
    """«Alegría» con la tilde convertida en chispa y «2.0» volado a la derecha. Devuelve cuerpo, ancho, alto."""
    d, wdt, boxes = glyphs("Alegrıa", x, base, size, track=-0.01)
    dot_i = [b for b in boxes if b[0] == "ı"][0]
    top = min(b[2] for b in boxes)
    sx = (dot_i[1] + dot_i[3]) / 2 + size * 0.06  # la tilde va inclinada a la derecha, como en la cursiva
    body = f'<path d="{d}"/><path d="{sparkle(sx, top - size * 0.04, size * 0.22)}"/>'
    right = x + wdt
    if with_two:
        d2, w2, _ = glyphs("2.0", right + size * 0.02, top + size * 0.30, size * 0.36, track=0.0)
        body += f'<path d="{d2}"/>'
        right += size * 0.02 + w2
    return body, right, top - size * 0.2


def letter_a(size, cx, cy):
    """La A de Shrikhand centrada en (cx, cy). Devuelve trazado y caja (x0, y0, x1, y1)."""
    _, _, (box,) = glyphs("A", 0, 0, size)
    ox, oy = cx - (box[1] + box[3]) / 2, cy - (box[2] + box[4]) / 2
    d, _, (box,) = glyphs("A", ox, oy, size)
    return d, box[1:]


# ---------- A · Rótulo con chispa (logotipo) ----------
b, right, top = wordmark(20, 190, 150)
svg("a-lockup.svg", right + 20, 256, f'<g fill="{INK}">{b}</g>', "Alegría 2.0")
dA, (ax0, ay0, ax1, ay1) = letter_a(190, 112, 142)
svg("a-symbol.svg", 256, 256, f'<g fill="{INK}"><path d="{dA}"/><path d="{sparkle(ax1 + 24, ay0 - 2, 32)}"/></g>', "Alegría 2.0 · símbolo")

# ---------- B · Bocadillo de canción (emblema) ----------
# Bocadillo redondeado con cola a la izquierda (cantar, hablar, cotillear) y la A recortada en negativo.
def bubble(x, y, w, h, r, tail):
    return (f"M{x + r},{y} H{x + w - r} A{r},{r} 0 0 1 {x + w},{y + r} V{y + h - r} A{r},{r} 0 0 1 {x + w - r},{y + h} "
            f"H{x + tail * 2.2} L{x + 4},{y + h + tail} L{x + tail * 0.9},{y + h - 2} "
            f"A{r},{r} 0 0 1 {x},{y + h - r} V{y + r} A{r},{r} 0 0 1 {x + r},{y} Z")
bb = bubble(28, 26, 200, 176, 52, 30)
dB, (bx0, by0, bx1, by1) = letter_a(128, 118, 120)
spB = sparkle(bx1 + 18, by0 + 4, 22)
svg("b-symbol.svg", 256, 256, f'<path fill="{INK}" fill-rule="evenodd" d="{bb} {dB} {spB}"/>', "Alegría 2.0 · símbolo")
wb, right, _ = wordmark(250, 168, 104)
svg("b-lockup.svg", right + 20, 256, f'<g fill="{INK}"><path fill-rule="evenodd" d="{bb} {dB} {spB}"/>{wb}</g>', "Alegría 2.0")

# ---------- C · La sonrisa con chispa (símbolo) ----------
# Una sonrisa gruesa (alegría) con el destello de la marca en la comisura, como un guiño de luz.
def ring_arc(cx, cy, r_out, r_in, a0, a1):
    p = lambda r, a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
    o0, o1, i1, i0 = p(r_out, a0), p(r_out, a1), p(r_in, a1), p(r_in, a0)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    cap = (r_out - r_in) / 2
    return (f"M{o0[0]:.2f},{o0[1]:.2f} A{r_out},{r_out} 0 {large} 1 {o1[0]:.2f},{o1[1]:.2f} "
            f"A{cap},{cap} 0 0 1 {i1[0]:.2f},{i1[1]:.2f} "
            f"A{r_in},{r_in} 0 {large} 0 {i0[0]:.2f},{i0[1]:.2f} A{cap},{cap} 0 0 1 {o0[0]:.2f},{o0[1]:.2f} Z")
smile = ring_arc(118, 96, 96, 64, 22, 158)
glint = sparkle(214, 62, 36)
svg("c-symbol.svg", 256, 256, f'<path fill="{INK}" d="{smile} {glint}"/>', "Alegría 2.0 · símbolo")
wc, right, _ = wordmark(270, 168, 104)
svg("c-lockup.svg", right + 20, 256, f'<g fill="{INK}"><path d="{smile} {glint}"/>{wc}</g>', "Alegría 2.0")
print("ok", sorted(p.name for p in OUT.iterdir()))
