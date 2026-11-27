"""SEO, GEO y AEO de Alegría 2.0 (adaptado de tools/seo.py de La Gloria).

En cada .html de web/ escribe entre <!-- SEO --> y <!-- /SEO --> el bloque de cabecera: robots,
canonical, Open Graph y Twitter con URL absolutas, datos geográficos y el JSON-LD (bar, web, página,
migas de pan y, en contacto, las preguntas frecuentes). Además genera robots.txt, sitemap.xml y
llms.txt (el resumen del local para buscadores con IA).

Modo demo (DEMO = True en tools/paginas.py): todo lleva noindex y no hay sitemap ni llms.txt, para
que el prototipo publicado no se indexe. Con DEMO = False se activa todo.

Solo se publican datos confirmados del local. La carta y los cócteles son de ejemplo hasta que el
cliente pase los reales: CARTA_REAL = False deja la carta fuera del JSON-LD y del llms.txt.
Las preguntas frecuentes se leen de web/js/data.js, así Google ve lo mismo que el visitante.

Uso: python3 tools/seo.py (lo llama tools/paginas.py al terminar).
"""
import datetime
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
DEMO = bool(re.search(r"^DEMO = True", (ROOT / "tools/paginas.py").read_text(), re.M))
KARAOKE_H = re.search(r'export const KARAOKE = "([^"]*)"', (WEB / "js/data.js").read_text())[1].replace("\u00a0", " ")
SITE_URL = "https://www.alegria20.es"  # dominio definitivo (pendiente de registrar)
if DEMO:  # la demo vive en Vercel: así la vista previa al compartir el enlace (WhatsApp…) sí sale
    SITE_URL = "https://alegria20.es"
CARTA_REAL = False                       # PENDIENTE: carta y precios reales del cliente
OG_IMAGE = "assets/img/og-alegria.jpg"   # 1200×630
TODAY = datetime.date.today().isoformat()

INSTAGRAM = "https://www.instagram.com/laalegria_2.0/"
MAPS = "https://www.google.com/maps?cid=18024198401705806552"  # ficha de Google del local
PLACE_ID = "ChIJl7Wl5womQg0R2IrWNvPQIvo"
REVIEW = f"https://search.google.com/local/writereview?placeid={PLACE_ID}"
LAT, LNG = 40.3951341, -3.6643586

# slug → (nombre en migas de pan, prioridad en el sitemap; None = fuera del sitemap y noindex)
PAGES = {
    "index": ("Inicio", "1.0"),
    "experiencias": ("Experiencias", "0.9"),
    "contacto": ("Contacto", "0.9"),
    "celebraciones": ("Celebraciones", "0.8"),
    "ambiente": ("Ambiente", "0.7"),
    "aviso-legal": ("Aviso legal", None),
    "privacidad": ("Privacidad", None),
    "cookies": ("Cookies", None),
}
path_of = lambda slug: "/" if slug == "index" else f"/{slug}.html"
if re.search(r"^PAGINA_CARTA = True", (ROOT / "tools/paginas.py").read_text(), re.M):
    PAGES["carta"] = ("Carta", "0.7" if CARTA_REAL else None)  # con la carta de ejemplo no se indexa
url = lambda path: SITE_URL + path
BAR_ID, WEB_ID = url("/#bar"), url("/#web")

DAYS = {"Domingo": "Sunday", "Lunes": "Monday", "Martes": "Tuesday", "Miércoles": "Wednesday", "Jueves": "Thursday", "Viernes": "Friday", "Sábado": "Saturday"}


def data_js():
    """Horario y preguntas frecuentes tal como los ve el visitante (web/js/data.js)."""
    s = (WEB / "js/data.js").read_text()
    hours = re.findall(r'\["(\w+)", "(\d\d:\d\d)", "(\d\d:\d\d)"\]', s[s.index("export const HOURS"):])
    faq_block = s[s.index("export const FAQ"):s.index("];", s.index("export const FAQ"))]
    karaoke = re.search(r'export const KARAOKE = "([^"]*)"', s)[1]
    faq = []
    for line in faq_block.splitlines():
        # cadenas normales y plantillas `…${KARAOKE}…` (el horario del karaoke vive en una sola constante)
        strings = [a or b.replace("${KARAOKE}", karaoke) for a, b in re.findall(r'"((?:[^"\\]|\\.)*)"|`([^`$]*(?:\$\{KARAOKE\}[^`$]*)*)`', line)]
        if len(strings) >= 2:  # en «¿Qué días hay DJ?» la última cadena es la respuesta sin días fijados
            faq.append((strings[0], strings[-1]))
    return hours, faq


HOURS, FAQ = data_js()


def opening_hours():
    by_slot = {}
    for day, opens, closes in HOURS:
        by_slot.setdefault((opens, closes), []).append(DAYS[day])
    return [{"@type": "OpeningHoursSpecification", "dayOfWeek": days, "opens": o, "closes": c} for (o, c), days in by_slot.items()]


BAR = {
    "@type": ["BarOrPub", "NightClub"],
    "@id": BAR_ID,
    "name": "Alegría 2.0",
    "alternateName": ["Disco Pub Alegría 2.0", "Alegria 2.0", "La Alegría 2.0"],
    "description": "Disco pub latino con karaoke y DJ en Puente de Vallecas (Madrid). Música latina —vallenato, cumbia y música popular—, karaoke con pantallas, Viejotecas con artistas invitados y celebraciones de cumpleaños. Abierto de martes a domingo desde las 20:00 hasta las 5:00 o 5:30.",
    "url": url("/"),
    "image": [url("/" + OG_IMAGE)],
    "logo": url("/assets/icons/icon-512.png"),
    "telephone": "+34625924429",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Calle del Puerto de Pajares, 3",
        "addressLocality": "Madrid",
        "addressRegion": "Comunidad de Madrid",
        "postalCode": "28053",
        "addressCountry": "ES",
    },
    "geo": {"@type": "GeoCoordinates", "latitude": LAT, "longitude": LNG},
    "hasMap": MAPS,
    "areaServed": ["Puente de Vallecas", "Vallecas", "Madrid"],
    "openingHoursSpecification": opening_hours(),
    "currenciesAccepted": "EUR",
    "acceptsReservations": True,
    "audience": {"@type": "PeopleAudience", "suggestedMinAge": 18},
    "amenityFeature": [
        {"@type": "LocationFeatureSpecification", "name": name, "value": True}
        for name in ["Karaoke", "DJ", "Pista de baile", "Música latina", "Celebraciones de cumpleaños"]
    ],
    "keywords": "disco pub latino, karaoke, vallenato, cumbia, viejoteca, DJ, cumpleaños, Puente de Vallecas, Madrid",
    "sameAs": [INSTAGRAM, MAPS],
}
if CARTA_REAL:
    BAR["hasMenu"] = url("/carta.html")

WEBSITE = {"@type": "WebSite", "@id": WEB_ID, "url": url("/"), "name": "Alegría 2.0 · Disco pub latino en Vallecas", "inLanguage": "es-ES", "publisher": {"@id": BAR_ID}}

FAQ_LD = {
    "@type": "FAQPage",
    "@id": url("/contacto.html#preguntas"),
    "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ],
}


def graph(slug, title, desc):
    page_url = url(path_of(slug))
    page = {
        "@type": "ContactPage" if slug == "contacto" else "WebPage",
        "@id": page_url + "#pagina",
        "url": page_url,
        "name": title,
        "description": desc,
        "inLanguage": "es-ES",
        "isPartOf": {"@id": WEB_ID},
        "about": {"@id": BAR_ID},
        "primaryImageOfPage": {"@type": "ImageObject", "url": url("/" + OG_IMAGE), "width": 1200, "height": 630},
        "dateModified": TODAY,
    }
    items = [WEBSITE, BAR, page]
    if slug != "index":
        page["breadcrumb"] = {"@id": page_url + "#migas"}
        items.append({"@type": "BreadcrumbList", "@id": page_url + "#migas", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": url("/")},
            {"@type": "ListItem", "position": 2, "name": PAGES[slug][0], "item": page_url},
        ]})
    if slug == "contacto" and not DEMO:  # en la demo la página de contacto es «Próximamente»: sin preguntas visibles
        items.append(FAQ_LD)
    return {"@context": "https://schema.org", "@graph": items}


def block(slug, title, desc):
    e = lambda v: html.escape(v, quote=True)
    page_url, og = url(path_of(slug)), url("/" + OG_IMAGE)
    if DEMO:
        robots = "noindex, nofollow"
    elif PAGES[slug][1] is None:
        robots = "noindex, follow"
    else:
        robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    ld = json.dumps(graph(slug, title, desc), ensure_ascii=False, indent=1).replace("</", "<\\/")
    return f"""<!-- SEO · generado por tools/seo.py, no editar a mano -->
  <meta name="robots" content="{robots}">
  <link rel="canonical" href="{page_url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Alegría 2.0 · Disco pub latino en Vallecas">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(desc)}">
  <meta property="og:url" content="{page_url}">
  <meta property="og:image" content="{og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Clientes cantando karaoke en Alegría 2.0, disco pub latino en Vallecas">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{e(title)}">
  <meta name="twitter:description" content="{e(desc)}">
  <meta name="twitter:image" content="{og}">
  <meta name="geo.region" content="ES-MD">
  <meta name="geo.placename" content="Puente de Vallecas, Madrid">
  <meta name="geo.position" content="{LAT};{LNG}">
  <meta name="ICBM" content="{LAT}, {LNG}">
  <script type="application/ld+json">
{ld}
  </script>
  <!-- /SEO -->"""


def run():
    for slug in PAGES:
        p = WEB / f"{slug}.html"
        s = p.read_text()
        title = html.unescape(re.search(r"<title>(.*?)</title>", s, re.S)[1])
        desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', s)[1])
        s = re.sub(r"\s*<!-- SEO.*?<!-- /SEO -->", "", s, flags=re.S)
        # lo que pone paginas.py (o venía en la portada) y ahora sale del bloque
        s = re.sub(r'\s*<meta name="robots"[^>]*>', "", s)
        s = re.sub(r'\s*<link rel="canonical"[^>]*>', "", s)
        s = re.sub(r'\s*<meta property="og:[^>]*>', "", s)
        s = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', "", s, flags=re.S)
        s = s.replace("</head>", "  " + block(slug, title, desc) + "\n</head>", 1)
        p.write_text(s)

    indexable = [slug for slug, (_, prio) in PAGES.items() if prio]
    if DEMO:
        (WEB / "robots.txt").write_text("# Prototipo: las páginas llevan noindex. Se deja rastrear para que los buscadores lo vean.\nUser-agent: *\nAllow: /\n")
        for f in ("sitemap.xml", "llms.txt"):
            (WEB / f).unlink(missing_ok=True)
    else:
        bots = ["Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended"]
        rules = "\n\n".join(f"User-agent: {b}\nAllow: /" for b in bots)
        (WEB / "robots.txt").write_text(f"# Todo el contenido es público, también para los buscadores y asistentes con IA\n{rules}\n\nUser-agent: *\nAllow: /\nDisallow: /tools/\n\nSitemap: {url('/sitemap.xml')}\n")
        urls = "\n".join(f"  <url>\n    <loc>{url(path_of(s))}</loc>\n    <lastmod>{TODAY}</lastmod>\n    <priority>{PAGES[s][1]}</priority>\n  </url>" for s in indexable)
        (WEB / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n')
        (WEB / "llms.txt").write_text(llms())
    print("ok seo", "DEMO (noindex)" if DEMO else "PUBLICADO", len(PAGES), "páginas,", len(FAQ), "preguntas")


def llms():
    days = "; ".join(f"{d.lower()} de {o} a {c}" for d, o, c in HOURS)
    faq = "\n".join(f"- **{q}** {a}" for q, a in FAQ)
    pages = "\n".join(f"- [{PAGES[s][0]}]({url(path_of(s))})" for s, (_, prio) in PAGES.items() if prio)
    return f"""# Alegría 2.0 (Puente de Vallecas, Madrid)

> Disco pub latino con karaoke y DJ en Puente de Vallecas (Madrid). Música latina —vallenato, cumbia y música popular—, karaoke con pantallas y letras, Viejotecas con artistas invitados y celebraciones de cumpleaños. Solo mayores de 18 años.

## Datos clave

- Nombre: Alegría 2.0 (también «Disco Pub Alegría 2.0»)
- Tipo de local: bar de copas y disco pub latino con karaoke
- Dirección: Calle del Puerto de Pajares, 3, 28053 Madrid (distrito de Puente de Vallecas)
- Coordenadas: {LAT}, {LNG}
- Teléfono y WhatsApp: +34 625 92 44 29
- Horario: {days}; lunes cerrado
- Precios: en barra; dependen de lo que tomes
- Edad mínima: 18 años
- Reservas: por WhatsApp; para venir no hace falta reservar, para grupos y cumpleaños conviene avisar
- Instagram: {INSTAGRAM} (@laalegria_2.0), donde anuncian Viejotecas y fiestas especiales
- Google Maps: {MAPS}
- Dejar una reseña en Google: {REVIEW}

## Qué se vive en Alegría 2.0

- Karaoke: de martes a domingo, {KARAOKE_H}, con pantallas y letras. Después sigue la música latina hasta el cierre.
- Pista latina: vallenato, cumbia y música popular; la pista la elige la gente.
- DJ en cabina: algunas noches (no todas); se avisan en el canal de WhatsApp del bar.
- Viejotecas: fiestas latino-colombianas con artistas invitados, empanadas, chorizo con arepa y rifas. Las fechas se anuncian en Instagram.
- Cumpleaños y grupos: se reserva sitio para el grupo escribiendo por WhatsApp con el día y el número de personas.

## Preguntas frecuentes

{faq}

## Páginas

{pages}
"""


if __name__ == "__main__":
    run()
