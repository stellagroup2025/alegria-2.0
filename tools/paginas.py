# Genera las páginas interiores de Alegría 2.0 con la misma cabecera, menú y pie.
# Uso: python3 tools/paginas.py   (desde alegria-2-0/)
#
# DEMO = True: la web es una demo para el cliente. Las páginas interiores no se publican: en su
# lugar sale «Próximamente» con el mismo diseño (para que no parezca que una web se hace en un día).
# El diseño completo sigue aquí; con DEMO = False se vuelven a generar las páginas de verdad.
# Copia de las páginas terminadas en paginas-terminadas/ (fuera de web/, no se publica).
DEMO = True
# PROXIMAMENTE = True vuelve a tapar las páginas interiores con «Próximamente» (solo con DEMO).
# Desde el 26-11-2026 están publicadas: la clienta quiere enseñarlas ya, aunque la web siga en demo.
PROXIMAMENTE = False
# SECCION_QR = True vuelve a poner en la home la sección «Vuestro QR de mesa» (era para enseñársela al
# cliente; se guarda aquí abajo, en QR_DEMO, para usarla más adelante).
SECCION_QR = False
# PAGINA_CARTA = True vuelve a publicar la página Carta y sus enlaces (el local no tiene carta: 26-11-2026).
# La página sigue aquí y hay copia en paginas-terminadas/carta.html.
PAGINA_CARTA = False
import pathlib, re

FONTS_OLD = '''  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Shrikhand&family=Tilt+Neon&family=Unbounded:wght@400;500;600&display=swap" rel="stylesheet">'''
FONTS_NEW = '''  <link rel="preload" href="assets/fonts/shrikhand-latin-486ff6.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/fonts/fonts.css">'''
WEB = pathlib.Path(__file__).resolve().parent.parent / "web"
NAV = [("experiencias.html", "Experiencias")] + ([("carta.html", "Carta")] if PAGINA_CARTA else []) + [("ambiente.html", "Ambiente"), ("celebraciones.html", "Celebraciones")]
GRAD = '<div class="neon-gradient" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'

def header(brand=True):
    # el sello del local (marca/logo) hace de logo en todas las páginas, también en la portada
    left = '<a class="nav-seal" href="./" aria-label="Alegría 2.0, inicio"><img src="assets/icons/sello.svg" width="1588" height="1610" alt=""></a>\n        ' + \
        '<a class="hero-pill is-home" href="./">Inicio</a>\n        ' + \
        "\n        ".join(f'<a class="hero-pill" href="{h}">{t}</a>' for h, t in NAV)
    menu = "\n    ".join(f'<a href="{h}">{t}</a>' for h, t in [("./", "Inicio")] + NAV + [("contacto.html", "Contacto")])
    return f'''  <header class="site-header">
    <nav class="hero-nav" aria-label="Principal">
      <div class="hero-nav-left">
        {left}
      </div>
      <div class="hero-nav-right-group">
        <button class="hero-pill menu-toggle" type="button" aria-expanded="false" aria-controls="menu"><i aria-hidden="true"></i><span>Menú</span></button>
        <a class="hero-pill hero-nav-right" href="contacto.html">Contacto</a>
      </div>
    </nav>
  </header>
  <nav class="menu-overlay" id="menu" aria-label="Menú">
    {menu}
    <p class="menu-meta">C. del Puerto de Pajares, 3 · Vallecas<br>Martes a domingo desde las 20:00<br>Karaoke de 20:00 a 23:00</p>
  </nav>
'''

ICONS = '''  <link rel="icon" href="assets/icons/favicon.ico" sizes="48x48">
  <link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
'''

FOOTER = f'''  <footer class="site-footer">
    {GRAD}
    <img class="footer-seal" src="assets/icons/sello.svg" width="1588" height="1610" alt="Alegría 2.0 · Disco Pub · Madrid" loading="lazy">
    <div class="footer-logo" aria-hidden="true">Alegría</div>
    <nav class="footer-nav" aria-label="Pie">
      <a class="hero-pill" href="./">Inicio</a>
      <a class="hero-pill" href="experiencias.html">Experiencias</a>
{'      <a class="hero-pill" href="carta.html">Carta</a>' + chr(10) if PAGINA_CARTA else ''}      <a class="hero-pill" href="ambiente.html">Ambiente</a>
      <a class="hero-pill" href="celebraciones.html">Celebraciones</a>
      <a class="hero-pill" href="contacto.html">Contacto</a>
      <a class="hero-pill" data-href="canal" target="_blank" rel="noopener">Canal de WhatsApp</a>
      <a class="hero-pill" data-href="instagram" target="_blank" rel="noopener">Instagram</a>
    </nav>
    <div class="footer-legal">
      <p>Alegría 2.0 · C. del Puerto de Pajares, 3, Puente de Vallecas, 28053 Madrid · 625 92 44 29</p>
      <p>Solo mayores de 18 años. Bebe con responsabilidad.</p>
      <p>© 2026 Alegría 2.0 · <a href="aviso-legal.html">Aviso legal</a> · <a href="privacidad.html">Privacidad</a> · <a href="cookies.html">Cookies</a></p>
      <p class="footer-credit">Diseñado por <span class="credit">Stella Studio</span></p>
    </div>
  </footer>
'''

def cta(title, left="karaoke", right="dj"):
    return f'''    <section class="contact">
      <div class="contact-frame">
        <div class="contact-panel neon-gradient-host">
          {GRAD}
          <div class="contact-content" data-reveal>
            <h2 class="contact-heading">{title}</h2>
            <div class="contact-actions">
              <a class="contact-pill is-solid" data-href="whatsapp" target="_blank" rel="noopener">WhatsApp <span class="contact-pill-arrow" aria-hidden="true">→</span></a>
              <a class="contact-pill" data-href="tel">Llamar</a>
              <a class="contact-pill" href="contacto.html#mapa">Cómo llegar <span class="contact-pill-arrow" aria-hidden="true">→</span></a>
            </div>
            <p class="contact-meta"><span class="nw">C. del Puerto de Pajares, 3</span> · <span class="nw">Puente de Vallecas</span> · <span class="nw">28053 Madrid</span><br><span class="nw">Martes a jueves 20:00–05:00</span> · <span class="nw">Viernes a domingo 20:00–05:30</span> · <span class="nw">Lunes cerrado</span><br>Karaoke de martes a domingo, <span class="nw">de 20:00 a 23:00</span></p>
          </div>
        </div>
        <img class="cta-glass is-left" src="assets/img/copas/{left}.webp" alt="" aria-hidden="true" data-float>
        <img class="cta-glass is-right" src="assets/img/copas/{right}.webp" alt="" aria-hidden="true" data-float>
      </div>
    </section>
'''

# Palabras clave del H1 (no se ven: el rótulo de neón sigue siendo una sola palabra)
H1_SEO = {
    "Experiencias": " · karaoke, DJ, Viejotecas y pista latina en Vallecas, Madrid",
    "Ambiente": " · fotos del disco pub latino Alegría 2.0 en Vallecas",
    "Celebra": " tu cumpleaños, despedida o quedada en Alegría 2.0, disco pub latino en Vallecas",
    "Contacto": ": horario, teléfono y cómo llegar a Alegría 2.0 en Puente de Vallecas",
    "Carta": " de Alegría 2.0, disco pub latino en Vallecas",
}

def hero(kicker, title, lead, actions="", media=None, glass=None, glow=None):
    m = f'<div class="page-hero-media"><img src="assets/img/{media}-1400.jpg" srcset="assets/img/{media}-800.jpg 800w, assets/img/{media}-1400.jpg 1400w, assets/img/{media}.jpg 2000w" sizes="100vw" alt="" fetchpriority="high"></div>' if media else GRAD
    g = f'\n      <div class="page-hero-glass" aria-hidden="true"><img src="assets/img/copas/{glass}.webp" alt=""></div>' if glass else ""
    st = f' style="--glow:{glow}"' if glow else ""
    return f'''    <section class="page-hero">
      {m}{g}
      <div class="page-hero-inner">
        <p class="page-kicker">{kicker}</p>
        <h1 class="page-h1"><span class="neon-sign"{st}>{title}</span>{f'<span class="sr-only">{H1_SEO[title]}</span>' if title in H1_SEO else ""}</h1>
        <p class="page-lead">{lead}</p>
        {f'<div class="page-hero-actions">{actions}</div>' if actions else ""}
      </div>
    </section>
'''

def marquee(words):
    return '    <div class="marquee" aria-hidden="true"><div class="marquee-track">' + "".join(f"<span>{w}</span><span>✦</span>" for w in words) + "</div></div>\n"

WA = '<a class="btn is-solid" data-href="whatsapp" target="_blank" rel="noopener">Reservar por WhatsApp <span aria-hidden="true">→</span></a>'

SOON_LABEL = {"experiencias": "Experiencias", "carta": "La carta", "ambiente": "Ambiente", "celebraciones": "Celebraciones",
              "contacto": "Contacto", "aviso-legal": "Aviso legal", "privacidad": "Privacidad", "cookies": "Cookies"}

def soon(slug):
    bars = "".join(f'<i style="--k:{k}"></i>' for k in range(9))
    return f'''    <section class="page-hero soon">
      {GRAD}
      <div class="page-hero-inner">
        <p class="page-kicker">{SOON_LABEL[slug]} · en preparación</p>
        <h1 class="neon-sign">Próximamente</h1>
        <p class="page-lead">Estamos montando esta parte de la noche: luces, sonido y cada detalle en su sitio. Muy pronto, aquí.</p>
        <div class="soon-eq" aria-hidden="true"><span class="soon-bars">{bars}</span><span>Afinando el sonido…</span></div>
        <div class="page-hero-actions"><a class="btn is-solid" href="./">Volver al inicio <span aria-hidden="true">→</span></a><a class="btn" data-href="canal" target="_blank" rel="noopener">Únete al canal de WhatsApp</a></div>
      </div>
    </section>
'''

def page(slug, title, desc, body, og="escenas/escena-2"):
    robots, data_page = "", slug
    if DEMO:
        robots = '\n  <meta name="robots" content="noindex">'
    if DEMO and PROXIMAMENTE:
        data_page = "proximamente"  # page.js no busca el contenido de la página de verdad
        title, body = f"{SOON_LABEL[slug]} · Próximamente | Alegría 2.0", soon(slug)
        robots = '\n  <meta name="robots" content="noindex">'
    html = f'''<!doctype html>
<html lang="es"{' class="is-demo"' if DEMO else ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#0a0610">{robots}
  <link rel="canonical" href="https://alegria2punto0.es/{slug}.html">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="assets/img/{og}.jpg">
{ICONS}  <link rel="preload" href="assets/fonts/shrikhand-latin-486ff6.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/fonts/fonts.css">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="pages.css">
</head>
<body data-page="{data_page}">
{header()}
  <main>
{body}  </main>

{FOOTER}
  <script src="assets/vendor/gsap.min.js"></script>
  <script src="assets/vendor/ScrollTrigger.min.js"></script>
  <script src="assets/vendor/lenis.min.js"></script>
  <script type="module" src="js/page.js"></script>
</body>
</html>
'''
    (WEB / f"{slug}.html").write_text(html)


# ---------------- CARTA: una sola fuente ----------------
# La carta de la web y la de la página QR de mesa (qr/carta.html) salen de qr/carta.json, con los
# campos de la carta de Qronnect. Es de ejemplo: cuando el cliente la pase, se cambia solo ahí.
import json, html as _html
CARTA = json.loads((WEB / "qr" / "carta.json").read_text())["categorias"]
CAT = {c["id"]: c for c in CARTA}
esc = _html.escape
EXP_COLOR = {"karaoke": "#ff2fb3", "dj": "#19e6ff", "salsa": "#ff3d3d", "viejoteca": "#39ff88", "cumple": "#ffd23f"}  # = NOCHES de js/data.js
EXP_FOR = {"karaoke": "Para el karaoke", "dj": "Para cuando pincha el DJ", "salsa": "Para la pista", "viejoteca": "Para la Viejoteca", "cumple": "Para el brindis"}

def signature():
    out = []
    for p in CAT["cocteles"]["platos"]:
        e = p["id"].removeprefix("coctel-")
        out.append(f'''          <article class="drink" style="--c:{EXP_COLOR[e]}" data-reveal>
            <div class="drink-glass"><img src="{p["imagen_url"].lstrip("/")}" alt="{esc(p["nombre"])}" loading="lazy"></div>
            <div class="drink-body"><p class="drink-night">{EXP_FOR[e]}</p><h3 class="drink-name">{esc(p["nombre"])}</h3><p>{esc(p["descripcion"])}</p></div></article>''')
    return '        <div class="signature">\n' + "\n".join(out) + "\n        </div>\n"

def bar_menu():
    groups = [("cubos", "var(--gold)"), ("copas", "var(--magenta)"), ("chupitos", "var(--green)"), ("sin-alcohol", "var(--cyan)")]
    rows = lambda c: "".join(f'<li><span>{esc(p["nombre"])}</span><span>{esc(p["descripcion"] or "")}</span></li>' for p in c["platos"] if p["disponible"])
    return '        <div class="bar-menu">\n' + "".join(f'''          <div class="bar-group" style="--c:{col}" data-reveal>
            <h3>{esc(CAT[g]["nombre"])}</h3>
            <ul>{rows(CAT[g])}</ul>
          </div>
''' for g, col in groups) + "        </div>\n"

# ---------------- EXPERIENCIAS ----------------
# Experiencias, no noches: no se ata ninguna a un día concreto (solo el horario está confirmado).
page("experiencias", "Experiencias · Karaoke, DJ y fiesta latina en Vallecas | Alegría 2.0",
     "Vive Alegría 2.0 a tu manera: karaoke, DJ en cabina, pista latina con vallenato y cumbia, Viejotecas y cumpleaños en Puente de Vallecas. Martes a domingo desde las 20:00.",
     hero("Martes a domingo · desde las 20:00", "Experiencias",
          "No hace falta elegir día ni plan: cada noche en Alegría se vive a tu manera. Cantar, bailar, celebrar o todo a la vez. Tú decides.",
          WA + '<a class="btn" href="#elige">Elige la tuya <span aria-hidden="true">↓</span></a>', glass="karaoke") +
     '''    <section class="block" id="elige">
      <div class="block-inner">
        <div class="block-head" data-reveal>
          <p class="eyebrow">Cinco maneras de vivir Alegría</p>
          <h2 class="neon-small">La noche es tuya: vívela como quieras</h2>
          <p>Aquí no hay noche de esto o noche de lo otro. Vienes, y la noche va saliendo: un rato de micro, otro de pista, un brindis por quien cumple años… Elige por dónde empezar.</p>
        </div>
        <div class="exp-chips" data-reveal></div>
      </div>
    </section>
''' + marquee(["Karaoke", "Vallenato", "Cumbia", "DJ", "Música popular", "Viejoteca"]) +
     '''    <section class="block">
      <div class="nights"></div>
    </section>
    <section class="block">
      <div class="block-inner">
        <div class="block-head is-center" data-reveal>
          <p class="eyebrow" style="--c:var(--gold)">Fechas especiales</p>
          <h2 class="neon-small">Viejotecas, Halloween y fiestas temáticas</h2>
          <p>Artistas invitados, rifas y comida colombiana en las fiestas grandes. Las anunciamos primero en Instagram: síguenos para no perderte ninguna.</p>
          <a class="btn" data-href="instagram" target="_blank" rel="noopener">@laalegria_2.0 en Instagram <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
''' + cta("¿Cómo te apetece vivirla hoy? Escríbenos y te guardamos sitio", "salsa", "viejoteca"), og="escenas/escena-2")

# ---------------- CARTA ----------------
if PAGINA_CARTA: page("carta", "Carta · Cócteles, cubos y chupitos | Alegría 2.0",
     "La carta de Alegría 2.0 en Vallecas: cócteles de la casa, cubos de cerveza para el grupo, copas, chupitos y aguardiente.",
     hero("Cócteles · cubos · copas · chupitos", "Carta",
          "Un cóctel para cada experiencia, cubos para el grupo y chupitos para el brindis. Pide, canta y repite.",
          '<a class="btn is-solid" href="#cocteles">Ver los cócteles <span aria-hidden="true">↓</span></a>', media="escenas/arco-5", glow="var(--cyan)") +
     '''    <section class="block" id="cocteles">
      <div class="block-inner">
        <div class="block-head" data-reveal>
          <p class="eyebrow">Cócteles de la casa</p>
          <h2 class="neon-small">Una copa para cada experiencia</h2>
          <p>Para cantar, para bailar o para brindar: cada experiencia tiene su copa. Pregunta en barra.</p>
        </div>
''' + signature() + '''      </div>
    </section>
''' + marquee(["Mojito", "Cosmopolitan", "Gin-tonic", "Daiquiri", "Cava", "Aguardiente"]) +
     '''    <section class="block">
      <div class="block-inner">
        <div class="block-head is-center" data-reveal>
          <p class="eyebrow" style="--c:var(--gold)">En la barra</p>
          <h2 class="neon-small">Para el grupo, para brindar y para seguir</h2>
        </div>
''' + bar_menu() + '''        <p class="bar-note" data-reveal>En las fiestas especiales hay empanada colombiana, chorizo con arepa y papa rellena.<br>Precios en barra. Solo servimos alcohol a mayores de 18 años.</p>
      </div>
    </section>
''' + cta("¿Venís en grupo? Te preparamos la mesa y el cubo", "viejoteca", "salsa"), og="escenas/arco-5")

# ---------------- AMBIENTE ----------------
page("ambiente", "Ambiente · Fotos del local | Alegría 2.0",
     "Así es una noche en Alegría 2.0: karaoke, pista de baile, barra y la mejor gente de Vallecas. Galería de fotos del disco pub latino.",
     hero("Así es una noche en Alegría", "Ambiente",
          "Luces de colores, una pista que no se vacía y un micro que pasa de mano en mano. Mira cómo se vive una noche aquí antes de venir.",
          '<a class="btn is-solid" href="#galeria">Ver la galería <span aria-hidden="true">↓</span></a>', media="escenas/arco-3", glow="var(--violet)") +
     '''    <section class="reel reel-pin">
      <div class="block-head" data-reveal>
        <p class="eyebrow">Una noche cualquiera</p>
        <h2 class="neon-small">Del primer brindis a la última canción</h2>
      </div>
      <div class="reel-track"></div>
    </section>
    <section class="block">
      <div class="block-inner">
        <div class="stats">
          <div class="stat" style="--c:var(--magenta)" data-reveal><b>6</b><span>noches a la semana, de martes a domingo</span></div>
          <div class="stat" style="--c:var(--cyan)" data-reveal><b>5:30</b><span>hasta esa hora los viernes, sábados y domingos</span></div>
          <div class="stat" style="--c:var(--green)" data-reveal><b>100%</b><span>música latina y karaoke toda la noche</span></div>
        </div>
      </div>
    </section>
    <section class="block" id="galeria">
      <div class="block-inner">
        <div class="block-head is-center" data-reveal>
          <p class="eyebrow">Galería</p>
          <h2 class="neon-small">Fotos de la casa</h2>
        </div>
        <div class="filters" role="group" aria-label="Filtrar fotos">
          <button type="button" data-cat="todo" aria-pressed="true">Todo</button>
          <button type="button" data-cat="karaoke" aria-pressed="false">Karaoke</button>
          <button type="button" data-cat="pista" aria-pressed="false">Pista</button>
          <button type="button" data-cat="barra" aria-pressed="false">Barra</button>
          <button type="button" data-cat="gente" aria-pressed="false">Gente</button>
        </div>
        <div class="gallery"></div>
      </div>
    </section>
    <div class="lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada">
      <button class="lb-prev" type="button" aria-label="Foto anterior">←</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-next" type="button" aria-label="Foto siguiente">→</button>
      <button class="lightbox-close" type="button" aria-label="Cerrar">✕</button>
    </div>
''' + cta("Ven a verlo en persona. Esta noche te esperamos", "karaoke", "cumple"), og="escenas/arco-3")

# ---------------- CELEBRACIONES ----------------
page("celebraciones", "Celebraciones · Cumpleaños y grupos | Alegría 2.0",
     "Celebra tu cumpleaños, despedida o quedada de grupo en Alegría 2.0, disco pub latino con karaoke en Vallecas. Reserva por WhatsApp.",
     hero("Cumpleaños · despedidas · grupos", "Celebra",
          "¿Cumples años, te despides de soltero o se junta la cuadrilla? Avísanos y te guardamos sitio para que la noche salga redonda.",
          '<a class="btn is-solid" href="#reserva">Pedir sitio <span aria-hidden="true">↓</span></a>', media="escenas/escena-1", glow="var(--gold)") +
     '''    <section class="block">
      <div class="block-inner">
        <div class="block-head" data-reveal>
          <p class="eyebrow" style="--c:var(--gold)">Qué celebramos</p>
          <h2 class="neon-small">Si hay motivo, aquí se celebra</h2>
        </div>
        <div class="occasions">
          <article class="occasion" style="--c:var(--gold)" data-reveal><img src="assets/img/escenas/escena-1-800.jpg" srcset="assets/img/escenas/escena-1-800.jpg 800w, assets/img/escenas/escena-1-1400.jpg 1400w, assets/img/escenas/escena-1.jpg 2000w" sizes="(max-width: 767px) 92vw, 40vw" alt="Cumpleaños en Alegría 2.0" loading="lazy"><h3>Cumpleaños</h3><p>Te guardamos sitio para el grupo y el bar entero canta contigo. Cuéntanos qué tienes pensado y lo preparamos.</p></article>
          <article class="occasion" style="--c:var(--magenta)" data-reveal><img src="assets/img/escenas/arco-2-800.jpg" srcset="assets/img/escenas/arco-2-800.jpg 800w, assets/img/escenas/arco-2-1400.jpg 1400w, assets/img/escenas/arco-2.jpg 2000w" sizes="(max-width: 767px) 92vw, 40vw" alt="Despedida con karaoke" loading="lazy"><h3>Despedidas</h3><p>Micro para la novia o el novio, canciones dedicadas y una pista para darlo todo antes del gran día.</p></article>
          <article class="occasion" style="--c:var(--cyan)" data-reveal><img src="assets/img/escenas/arco-1-800.jpg" srcset="assets/img/escenas/arco-1-800.jpg 800w, assets/img/escenas/arco-1-1400.jpg 1400w, assets/img/escenas/arco-1.jpg 2000w" sizes="(max-width: 767px) 92vw, 40vw" alt="Grupo de amigos brindando" loading="lazy"><h3>Grupos</h3><p>Reencuentros, quedadas de trabajo o del equipo. Mesa juntos, cubos para compartir y música para todos.</p></article>
        </div>
      </div>
    </section>
    <section class="block">
      <div class="block-inner">
        <div class="steps">
          <div class="step" style="--c:var(--magenta)" data-reveal><h3>Escríbenos</h3><p>Rellena el formulario o mándanos un WhatsApp con el día y cuántos sois.</p></div>
          <div class="step" style="--c:var(--cyan)" data-reveal><h3>Te guardamos sitio</h3><p>Te confirmamos por WhatsApp y te contamos lo que podemos preparar.</p></div>
          <div class="step" style="--c:var(--green)" data-reveal><h3>A celebrar</h3><p>Llegáis, os sentáis juntos y la noche es vuestra. Del resto nos encargamos.</p></div>
        </div>
      </div>
    </section>
    <section class="block" id="reserva">
      <div class="block-inner booking">
        <div class="booking-photo" data-reveal="img"><img src="assets/img/escenas/arco-4-800.jpg" srcset="assets/img/escenas/arco-4-800.jpg 800w, assets/img/escenas/arco-4-1400.jpg 1400w, assets/img/escenas/arco-4.jpg 2000w" sizes="(max-width: 767px) 92vw, 40vw" alt="Grupo celebrando en Alegría 2.0" loading="lazy"></div>
        <form class="form" data-reveal>
          <h2 class="neon-small">Pide tu sitio</h2>
          <div class="field"><label for="f-nombre">Tu nombre</label><input id="f-nombre" name="nombre" required autocomplete="name" autocapitalize="words" maxlength="80"></div>
          <div class="field"><label for="f-telefono">Tu WhatsApp</label><input id="f-telefono" name="telefono" type="tel" required autocomplete="tel" inputmode="tel" placeholder="612 345 678"></div>
          <div class="field"><label for="f-tipo">Qué celebráis</label><select id="f-tipo" name="tipo"><option>Un cumpleaños</option><option>Una despedida</option><option>Una quedada de grupo</option><option>Otra cosa</option></select></div>
          <div class="field"><label for="f-personas">Cuántos sois</label><input id="f-personas" name="personas" type="number" min="2" max="80" value="8" required inputmode="numeric"></div>
          <div class="field"><label for="f-fecha">Día</label><input id="f-fecha" name="fecha" type="date" required></div>
          <div class="field"><label for="f-hora">Hora aproximada</label><select id="f-hora" name="hora"><option>20:00 – 22:00</option><option selected>22:00 – 00:00</option><option>Más tarde</option><option>Aún no lo sé</option></select></div>
          <div class="field is-wide"><label for="f-email">Tu email (opcional)</label><input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="tu@email.com"></div>
          <div class="field is-wide"><label for="f-mensaje">Algo más (opcional)</label><textarea id="f-mensaje" name="mensaje" maxlength="1000" placeholder="Si traéis tarta, canciones que no pueden faltar, alguna sorpresa…"></textarea></div>
          <label class="form-check is-wide"><input type="checkbox" name="privacidad" required><span>He leído la <a href="privacidad.html#reservas">política de privacidad</a> y acepto que Alegría 2.0 guarde mi petición para gestionarla.</span></label>
          <label class="form-check is-wide"><input type="checkbox" name="promos"><span><b>Avisadme de fiestas y promociones</b> por WhatsApp o email. Te das de baja cuando quieras.</span></label>
          <p class="form-error is-wide" role="alert"></p>
          <div class="form-actions">
            <button class="btn is-solid" type="submit">Enviar por WhatsApp <span aria-hidden="true">→</span></button>
            <p class="form-note">Se abre WhatsApp con tu mensaje listo: dale a enviar y te contestamos.<br>Guardamos una copia de tu petición para no perderla.</p>
          </div>
        </form>
      </div>
    </section>
''' + cta("¿Prefieres llamar? Te atendemos de martes a domingo desde las 20:00", "cumple", "karaoke"), og="escenas/escena-1")

# ---------------- CONTACTO ----------------
page("contacto", "Contacto · Horario y cómo llegar | Alegría 2.0",
     "Alegría 2.0 está en C. del Puerto de Pajares, 3, Puente de Vallecas (28053 Madrid). Horario, teléfono, WhatsApp 625 92 44 29, mapa y preguntas frecuentes.",
     hero("C. del Puerto de Pajares, 3 · Vallecas", "Contacto",
          "Estamos en Puente de Vallecas, abiertos de martes a domingo desde las 20:00. Escríbenos, llámanos o ven directamente.",
          '<a class="btn is-solid" data-href="whatsapp" target="_blank" rel="noopener">WhatsApp <span aria-hidden="true">→</span></a><a class="btn" data-href="tel">Llamar al 625 92 44 29</a>', glass="dj", glow="var(--cyan)") +
     '''    <section class="block">
      <div class="block-inner contact-grid">
        <div class="card card-map" id="mapa" data-reveal data-map="https://www.google.com/maps?q=Calle+del+Puerto+de+Pajares+3,+28053+Madrid&amp;output=embed">
          <div class="map-cover">
            <span class="map-pin" aria-hidden="true"></span>
            <p><b>C. del Puerto de Pajares, 3</b><br>Puente de Vallecas · Madrid</p>
            <button class="btn is-solid" type="button">Ver el mapa aquí</button>
            <p class="map-note">El mapa lo sirve Google y puede usar sus cookies. <a href="cookies.html">Más info</a></p>
          </div>
        </div>
        <div class="card card-hours" style="--c:var(--green)" data-reveal>
          <h2>Horario</h2>
          <p class="open-now">Consultando…</p>
          <table class="hours"></table>
        </div>
        <div class="card card-phone" style="--c:var(--magenta)" data-reveal>
          <h2>WhatsApp y teléfono</h2>
          <p>625 92 44 29. Para reservar, preguntar qué noches hay DJ o cuándo es la próxima Viejoteca, o avisar de que venís en grupo.</p>
          <a class="btn is-solid" data-href="canal" target="_blank" rel="noopener">Únete al canal de WhatsApp <span aria-hidden="true">→</span></a>
          <a class="btn" data-href="whatsapp" target="_blank" rel="noopener">Reservar por WhatsApp</a>
        </div>
        <div class="card card-address" style="--c:var(--cyan)" data-reveal>
          <h2>Dirección</h2>
          <p>C. del Puerto de Pajares, 3<br>Puente de Vallecas · 28053 Madrid</p>
          <a class="btn" data-href="maps" target="_blank" rel="noopener">Abrir en Google Maps <span aria-hidden="true">→</span></a>
        </div>
        <div class="card card-insta" style="--c:var(--violet)" data-reveal>
          <h2>Instagram</h2>
          <p>Fechas de Viejotecas, fiestas especiales y fotos de cada noche en @laalegria_2.0.</p>
          <a class="btn" data-href="instagram" target="_blank" rel="noopener">Seguir en Instagram <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
    <section class="faq" id="preguntas">
      <h2 class="faq-heading" data-reveal>Lo que nos preguntáis siempre</h2>
      <div class="faq-list"></div>
    </section>
''' + cta("Te esperamos esta noche en Vallecas", "martini" if False else "karaoke", "salsa"), og="escenas/escena-4")

# ---------------- PÁGINAS LEGALES ----------------
# Lo marcado con <mark class="todo"> son datos del titular que hay que pedir al cliente.
TODO = lambda t: f'<mark class="todo">[{t}]</mark>'
TITULAR, NIF, DOMICILIO, EMAIL = TODO("Nombre o razón social del titular"), TODO("NIF/CIF"), TODO("Domicilio del titular"), TODO("Email de contacto")

def legal(slug, title, h1, desc, body):
    page(slug, f"{title} | Alegría 2.0", desc, f'''    <section class="page-hero is-compact">
      {GRAD}
      <div class="page-hero-inner">
        <p class="page-kicker">Última actualización: noviembre de 2026</p>
        <h1 class="neon-sign" style="--glow:var(--violet)">{h1}</h1>
      </div>
    </section>
    <section class="block">
      <div class="block-inner legal">
{body}
        <nav class="legal-nav" aria-label="Textos legales"><a class="btn" href="aviso-legal.html">Aviso legal</a><a class="btn" href="privacidad.html">Privacidad</a><a class="btn" href="cookies.html">Cookies</a></nav>
      </div>
    </section>
''')

legal("aviso-legal", "Aviso legal", "Aviso legal",
      "Aviso legal de la web de Alegría 2.0: titular, condiciones de uso, propiedad intelectual y responsabilidad.", f'''
        <h2>1. Titular de la web</h2>
        <p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de esta web:</p>
        <ul>
          <li><b>Titular:</b> {TITULAR}</li>
          <li><b>NIF/CIF:</b> {NIF}</li>
          <li><b>Domicilio:</b> {DOMICILIO}</li>
          <li><b>Establecimiento:</b> Alegría 2.0 · C. del Puerto de Pajares, 3, Puente de Vallecas, 28053 Madrid</li>
          <li><b>Teléfono:</b> 625 92 44 29</li>
          <li><b>Email:</b> {EMAIL}</li>
          <li><b>Actividad:</b> bar y disco pub con música y karaoke</li>
        </ul>
        <h2>2. Objeto y condiciones de uso</h2>
        <p>Esta web informa sobre el local, su horario, su programación y la forma de contactar o reservar. Al navegar por ella aceptas usarla de forma lícita, sin dañar su funcionamiento ni el de terceros.</p>
        <p>La información sobre programación y horarios es orientativa y puede cambiar sin previo aviso. Ante cualquier duda, confírmala por WhatsApp o por teléfono.</p>
        <h2>3. Mayores de edad</h2>
        <p>El acceso al local y el consumo de alcohol están reservados a mayores de 18 años. Bebe con responsabilidad.</p>
        <h2>4. Propiedad intelectual</h2>
        <p>Los textos, el diseño, el logotipo y el resto de contenidos de esta web pertenecen al titular o se usan con permiso. No se pueden copiar ni reutilizar con fines comerciales sin autorización.</p>
        <h2>5. Enlaces a otras webs</h2>
        <p>Esta web enlaza con servicios de terceros (WhatsApp, Instagram y Google Maps). El titular no responde de sus contenidos ni de sus condiciones, que se rigen por sus propias políticas.</p>
        <h2>6. Responsabilidad</h2>
        <p>El titular procura que la web funcione correctamente y que su información sea exacta, pero no garantiza la ausencia de errores o interrupciones y no responde de los daños que pudieran derivarse de ellos.</p>
        <h2>7. Legislación aplicable</h2>
        <p>Estas condiciones se rigen por la legislación española. Para cualquier controversia serán competentes los juzgados y tribunales que correspondan según la normativa de consumidores y usuarios.</p>
''')

# lo que dice la privacidad del QR depende de si la tarjeta de sellos está activa (SELLOS en qr_mesa.py)
SELLOS_ON = bool(re.search(r"^SELLOS = True", (pathlib.Path(__file__).resolve().parent / "qr_mesa.py").read_text(), re.M))
CLUB_NOMBRE = "Tarjeta de sellos" if SELLOS_ON else "Familia Alegría"
CLUB_INTRO = ("la <b>tarjeta de sellos</b> (la pantalla a la que lleva el QR de las mesas), y solo si te das de alta" if SELLOS_ON
              else "el formulario <b>«Únete a la familia Alegría»</b> (la pantalla a la que lleva el QR de las mesas), y solo si lo envías")
CLUB_DATOS = ("nombre, teléfono, y si nos los das, email y fecha de nacimiento. También guardamos tus visitas (la fecha de cada sello) y tus premios." if SELLOS_ON
              else "nombre, teléfono (WhatsApp) y, si nos los das, email y fecha de nacimiento, junto con las casillas que marcaste y cuándo.")
CLUB_FIN = ("gestionar tu tarjeta (sellos y premios) e identificarte si cambias de móvil." if SELLOS_ON
            else "tenerte en nuestra lista de clientes del local.")
CLUB_BAJA = ("Puedes borrarla tú cuando quieras con «Borrar mi tarjeta y mis datos»: se elimina al momento." if SELLOS_ON
             else "Puedes pedir que te borremos cuando quieras escribiéndonos por WhatsApp.")
CLUB_PREF = "desde «Mis datos y avisos» en tu tarjeta o escribiéndonos" if SELLOS_ON else "escribiéndonos por WhatsApp"
CLUB_MOVIL = ("          <li><b>En tu móvil:</b> el navegador guarda un código de tu tarjeta para abrirla sin volver a registrarte. No es una cookie de seguimiento y lo puedes borrar desde tu navegador.</li>\n" if SELLOS_ON else "")
COOKIES_CLUB = ('\n        <p>Si te das de alta en la <a href="privacidad.html#club">tarjeta de sellos</a>, tu navegador guarda el código de tu tarjeta (almacenamiento local, no una cookie) para abrirla sin volver a registrarte. Es imprescindible para el servicio que has pedido, no sirve para seguirte y se borra si borras los datos del navegador o tu tarjeta.</p>' if SELLOS_ON
                else '\n        <p>Si rellenas el formulario del QR o el de reserva, tu navegador recuerda tu nombre, teléfono y, si los diste, email y cumpleaños (almacenamiento local en tu propio móvil, no una cookie), para que la próxima vez te salgan ya puestos y no tengas que escribirlos de nuevo. También recuerda que ya te uniste. No nos llega nada por esto, no sirve para seguirte y se borra si borras los datos del navegador.</p>')
legal("privacidad", "Política de privacidad", "Privacidad",
      "Política de privacidad de Alegría 2.0: qué datos tratamos, para qué, durante cuánto tiempo y cómo ejercer tus derechos.", f'''
        <h2>1. Responsable del tratamiento</h2>
        <ul>
          <li><b>Responsable:</b> {TITULAR} · NIF/CIF {NIF}</li>
          <li><b>Dirección:</b> {DOMICILIO}</li>
          <li><b>Contacto:</b> {EMAIL} · 625 92 44 29</li>
        </ul>
        <h2>2. Qué datos recoge esta web</h2>
        <p>No hay analítica ni publicidad. Solo guardamos datos en dos sitios, y solo si los envías: {CLUB_INTRO.replace(", y solo si lo envías", "").replace(", y solo si te das de alta", "")}, y el formulario de reserva de la página <a href="celebraciones.html">Celebraciones</a>.</p>
        <h2>3. Qué datos tratamos y para qué</h2>
        <h3 id="club">3.1 {CLUB_NOMBRE}</h3>
        <ul>
          <li><b>Datos:</b> {CLUB_DATOS}</li>
          <li><b>Para qué:</b> {CLUB_FIN} Solo si marcas las casillas correspondientes: avisarte de fiestas y promociones por WhatsApp o email, y felicitarte por tu cumpleaños. Entrar en el canal de WhatsApp es aparte: lo haces tú en WhatsApp y puedes salir cuando quieras.</li>
          <li><b>Base legal:</b> tu consentimiento (art. 6.1.a del RGPD), que puedes retirar en cualquier momento {CLUB_PREF}.</li>
          <li><b>Conservación:</b> mientras sigas con nosotros. Si en 2 años no hay ningún contacto, borramos tus datos. {CLUB_BAJA}</li>
          <li><b>Dónde se guardan:</b> en una base de datos de Supabase alojada en la Unión Europea (París), que actúa como encargado del tratamiento. No cedemos tus datos a nadie ni los usamos para otros negocios.</li>
{CLUB_MOVIL}        </ul>
        <h3 id="reservas">3.2 Reservas y consultas</h3>
        <p>Si nos pides sitio desde el formulario de <a href="celebraciones.html">Celebraciones</a>, nos escribes por WhatsApp o nos llamas, tratamos los datos que nos des (nombre, teléfono, email si nos lo das, tipo de celebración, día, hora aproximada, número de personas y lo que nos cuentes) con una única finalidad: <b>gestionar tu reserva o responder a tu consulta</b>.</p>
        <ul>
          <li><b>Formulario de la web:</b> al enviarlo guardamos una copia de tu petición en nuestra base de datos (Supabase, alojada en la Unión Europea) y se abre WhatsApp con el mensaje listo para que nos lo mandes. La copia sirve para que ninguna petición se pierda. Si además marcas «Avisadme de fiestas y promociones», entras en nuestra lista de clientes (apartado 3.1) con ese consentimiento; si ya estabas, solo completamos los datos que faltaran.</li>
          <li><b>Base legal:</b> la aplicación de medidas precontractuales a petición tuya (art. 6.1.b del RGPD) y, para lo demás, tu consentimiento al escribirnos (art. 6.1.a).</li>
          <li><b>Conservación:</b> las peticiones del formulario se borran solas un año después del día reservado; lo que nos mandes por WhatsApp, cuando ya no haga falta para atender la reserva o la consulta, salvo que una ley obligue a guardarlo.</li>
          <li><b>Destinatarios:</b> no cedemos tus datos a nadie. Los mensajes pasan por WhatsApp (Meta), que los trata según su propia política de privacidad.</li>
        </ul>
        <h2>4. Servicios de terceros</h2>
        <ul>
          <li><b>Google Maps:</b> el mapa de la página de contacto solo se carga si pulsas «Ver el mapa aquí». A partir de ese momento Google recibe tu dirección IP y puede usar cookies, según su política de privacidad.</li>
          <li><b>Enlaces a WhatsApp, Instagram y Google Maps:</b> al pulsarlos sales de esta web y se aplican las políticas de esos servicios.</li>
          <li><b>Tipografías:</b> se sirven desde esta misma web; tu navegador no se conecta a Google para cargarlas.</li>
        </ul>
        <h2>5. Tus derechos</h2>
        <p>Puedes pedir el acceso, la rectificación o la supresión de tus datos, oponerte a su tratamiento, pedir su limitación o su portabilidad escribiendo a {EMAIL} o por WhatsApp al 625 92 44 29. Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos en <a href="https://www.aepd.es" target="_blank" rel="noopener">www.aepd.es</a>.</p>
        <h2>6. Menores</h2>
        <p>Los servicios del local están dirigidos a mayores de 18 años. No tratamos conscientemente datos de menores; el formulario del QR no admite fechas de nacimiento de menores de 16 años.</p>
''')

legal("cookies", "Política de cookies", "Cookies",
      "Política de cookies de Alegría 2.0: esta web no usa cookies propias ni de analítica o publicidad.", f'''
        <h2>1. Qué son las cookies</h2>
        <p>Son pequeños archivos que algunas webs guardan en tu navegador para recordar información sobre tu visita.</p>
        <h2>2. Cookies de esta web</h2>
        <p><b>Esta web no usa cookies propias</b>, ni de analítica, ni de publicidad, ni de redes sociales. Por eso no te mostramos un aviso de cookies al entrar.</p>{COOKIES_CLUB}
        <h2>3. Cookies de terceros</h2>
        <p>Solo hay un caso: el mapa de Google de la página de <a href="contacto.html">Contacto</a>. No se carga hasta que pulsas «Ver el mapa aquí». Si lo haces, Google puede instalar sus propias cookies (por ejemplo, para recordar preferencias o medir el uso de Maps). Puedes consultar cuáles en la <a href="https://policies.google.com/technologies/cookies?hl=es" target="_blank" rel="noopener">política de cookies de Google</a>.</p>
        <p>Si prefieres no cargarlo, puedes abrir la dirección directamente en la app de Google Maps con el botón «Cómo llegar».</p>
        <h2>4. Cómo borrarlas o bloquearlas</h2>
        <p>Puedes borrar o bloquear las cookies desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge, en el apartado de privacidad).</p>
        <h2>5. Cambios</h2>
        <p>Si en el futuro añadimos analítica u otros servicios que usen cookies, actualizaremos esta política y te pediremos permiso antes de activarlos.</p>
''')

# ---------------- PORTADA: menú y pie apuntan a las páginas ----------------
idx = (WEB / "index.html").read_text()
a = idx.index('  <header class="site-header">'); b = idx.index("  </header>") + len("  </header>\n")
# también los menús móviles de ejecuciones anteriores (antes se acumulaban)
while idx[b:].startswith('  <nav class="menu-overlay"'): b = idx.index("  </nav>\n", b) + len("  </nav>\n")
idx = idx[:a] + header(brand=False) + idx[b:]
a = idx.index('  <footer class="site-footer">'); b = idx.index("  </footer>") + len("  </footer>\n")
idx = idx[:a] + FOOTER + idx[b:]
idx = idx.replace(FONTS_OLD, FONTS_NEW)
idx = re.sub(r'<html lang="es"[^>]*>', '<html lang="es" class="is-demo">' if DEMO else '<html lang="es">', idx, count=1)
# Sección de los QR: solo en la demo, para enseñárselos al cliente. Con DEMO = False se quita sola.
QR_DEMO = """    <!-- demo:qr · se quita al desplegar (tools/paginas.py, DEMO = False) -->
    <section class="qr-demo" id="qr">
      <p class="qr-kicker">Extra para el local</p>
      <h2 class="qr-heading">Vuestro QR de mesa, con el sello del bar</h2>
      <p class="qr-lead">El logo convertido en código: el micro y las maracas son el propio QR. Uno solo para las mesas, que abre la página de Alegría con la carta, la tarjeta de sellos y las reseñas de Google.</p>
      <div class="qr-grid is-single">
        <figure class="qr-card">
          <img src="assets/qr/qr-sello-mesa.svg" width="1000" height="1000" alt="Código QR con el sello de Alegría 2.0 que abre la página de mesa" loading="lazy">
          <figcaption><b>Carta, sellos y reseñas</b>Para cada mesa y la barra: el cliente lo escanea y elige ver la carta, sumar un sello o dejaros su reseña.</figcaption>
        </figure>
      </div>
      <p class="qr-tip">Escanéalo con la cámara del móvil · impreso, desde 4 cm</p>
      <div class="qr-mesa-link"><a class="btn is-solid" href="qr/">Abrir la página QR de mesa <span aria-hidden="true">→</span></a></div>
    </section>
    <!-- /demo:qr -->
"""
idx = re.sub(r"    <!-- demo:qr .*?<!-- /demo:qr -->\n", "", idx, flags=re.S)
if DEMO and SECCION_QR:
    idx = idx.replace("  </main>", QR_DEMO + "  </main>", 1)
# en la demo la portada tampoco se indexa (el prototipo publicado no debe competir con la web real)
idx = idx.replace('  <meta name="robots" content="noindex">\n', '')
if DEMO:
    idx = idx.replace('  <meta name="theme-color" content="#0a0610">\n', '  <meta name="theme-color" content="#0a0610">\n  <meta name="robots" content="noindex">\n', 1)
if "assets/icons/favicon" not in idx:
    idx = idx.replace('  <link rel="preload" href="assets/fonts/', ICONS + '  <link rel="preload" href="assets/fonts/', 1)
if "pages.css" not in idx:
    idx = idx.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="styles.css">\n  <link rel="stylesheet" href="pages.css">')
if not PAGINA_CARTA:
    idx = idx.replace('<a class="section-link" href="carta.html">Ver la carta <span aria-hidden="true">→</span></a>',
                      '<a class="section-link" href="contacto.html">Horario y cómo llegar <span aria-hidden="true">→</span></a>')
    (WEB / "carta.html").unlink(missing_ok=True)
(WEB / "index.html").write_text(idx)
print("ok")

# Página QR de mesa (maqueta de Qronnect): qr/index.html, qr/carta.html, qr/sellos.html. Siempre noindex.
import runpy
runpy.run_path(str(pathlib.Path(__file__).resolve().parent / "qr_mesa.py"), run_name="__main__")

# SEO, GEO y AEO (bloque de cabecera, JSON-LD, robots.txt, sitemap.xml y llms.txt): tools/seo.py
import runpy
runpy.run_path(str(pathlib.Path(__file__).resolve().parent / "seo.py"), run_name="__main__")
