# Página QR de mesa (maqueta de Qronnect con el diseño de Alegría 2.0): qr/index.html (los tres
# botones), qr/carta.html (la carta, de qr/carta.json) y qr/sellos.html (alta y tarjeta simuladas).
# El alta y los sellos son reales: van a la base de datos común de clientes (Supabase, proyecto
# zbcjhcvjnpigesvfyibe, un negocio por slug) mediante funciones RPC; el móvil solo guarda su código y su
# token. qr/barra.html es la pantalla del personal (clave en .claves-personal.txt, fuera de git). Estructura, orden, textos y estados copiados de sistema-qr/Qronnect/frontend:
#   components/tres-vias/PaginaTresVias.tsx · app/carta/page.tsx · components/registro-form-v2.tsx ·
#   components/cliente/sellos/TarjetaSelloCard.tsx · app/[slug]/mi-qr/page.tsx
# Se ejecuta al final de tools/paginas.py. Siempre con noindex y fuera del sitemap y de llms.txt.
import json, pathlib, segno

WEB = pathlib.Path(__file__).resolve().parent.parent / "web"
QR = WEB / "qr"
NOMBRE = "Alegría 2.0"
REVIEW = "https://search.google.com/local/writereview?placeid=ChIJl7Wl5womQg0R2IrWNvPQIvo"
# Programa de sellos de la demo (propuesto, no confirmado con el cliente)
PROGRAMA = {"nombre": "Tarjeta Alegría", "descripcion": "Un sello por cada visita.", "objetivo": 8,
            "premio": "Un cóctel de la casa", "instrucciones": "Enséñalo en la barra y te ponemos tu cóctel."}
# Base de datos común de clientes. La clave publicable puede ir en la web: las tablas están cerradas y
# solo se entra por las funciones, que comprueban el token del cliente o la clave del personal.
SUPABASE = {"url": "https://zbcjhcvjnpigesvfyibe.supabase.co", "key": "sb_publishable_QKlh63AKSawSyepIhJy_Ng_8tqDXrwd",
            "negocio": "alegria-2-0"}
# el canal de WhatsApp sale de web/js/data.js (CANAL_URL; mientras esté vacío, un WhatsApp para pedirlo)
import re, urllib.parse
_d = (WEB / "js/data.js").read_text()
CANAL = re.search(r'export const CANAL_URL = "([^"]*)"', _d)[1] or "https://wa.me/34625924429?text=" + urllib.parse.quote(
    re.search(r'encodeURIComponent\("([^"]*)"\)', _d[_d.index("export const CANAL ="):])[1], safe="")
QR_CARTA = False  # el local no tiene carta (26-11-2026): la pantalla del QR no la enseña ni la genera
# SELLOS = True activa la tarjeta de sellos (sellos.html) y la parte de barra de barra.html. Con False
# (27-11-2026: Alegría aún no la quiere) el QR solo tiene reseñas y «únete» (mini formulario → canal de
# WhatsApp), y barra.html queda como la pantalla del dueño para ver y descargar los clientes.
SELLOS = False
SUPABASE["sellos"] = SELLOS

# Iconos de lucide (los mismos que usa Qronnect), en línea para no cargar nada de fuera
ICON = {
    "carta": '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',
    "sello": '<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.69 0-3 1-3 3s1 2 1 3.5V13"/>',
    "estrella": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    "derecha": '<path d="m9 18 6-6-6-6"/>',
    "externo": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "volver": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "filtro": '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    "cerrar": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "regalo": '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    "chispas": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    "escudo": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "sol": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    "copiar": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    "whatsapp": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "camara": '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    "buscar": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "salir": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    "usuarios": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "descargar": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
}
def icon(name, cls="ico"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[name]}</svg>'

def qr_svg(value, label):
    # QR normal (no micro), módulos oscuros sobre blanco y 2 módulos de margen
    svg = segno.make(value, error="m", micro=False).svg_inline(scale=1, border=2, dark="#0a0610", light="#ffffff", omitsize=True)
    return svg.replace("<svg ", f'<svg role="img" aria-label="{label}" shape-rendering="crispEdges" ', 1)

COVER = ('<img src="../assets/img/escenas/escena-2-800.jpg" srcset="../assets/img/escenas/escena-2-800.jpg 800w, '
         '../assets/img/escenas/escena-2-1400.jpg 1400w" sizes="(max-width: 448px) 100vw, 448px" alt="" fetchpriority="high">')
SEAL = '<img src="../assets/icons/sello.svg" width="1588" height="1610" alt="">'
GRAD = '<div class="neon-gradient qr-bg" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'

def page(slug, title, desc, body, view, qrlib=False):
    html = f'''<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#0a0610">
  <meta name="robots" content="noindex">
  <link rel="icon" href="../assets/icons/favicon.ico" sizes="48x48">
  <link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="../assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="../site.webmanifest">
  <link rel="preload" href="../assets/fonts/shrikhand-latin-486ff6.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../assets/fonts/fonts.css">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../pages.css">
  <link rel="stylesheet" href="qr.css">
</head>
<body class="qr-app" data-qr="{view}">
  {GRAD}
  <div class="qr-shell">
{body}  </div>
  <div class="qr-toast" role="status" aria-live="polite"></div>
  <script type="application/json" id="supabase">{json.dumps(SUPABASE)}</script>
{'  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>' + chr(10) if qrlib else ''}  <script type="module" src="qr.js"></script>
</body>
</html>
'''
    (QR / f"{slug}.html").write_text(html)

# ---------------- 1 · LOS TRES BOTONES ----------------
def via(clave, href, ico, titulo, texto, color, externo=False, first=False):
    attrs = ' target="_blank" rel="noopener noreferrer"' if externo else ""
    sr = '<span class="sr-only"> (se abre en una pestaña nueva)</span>' if externo else ""
    return f'''        <a class="qr-via{" is-first" if first else ""}" href="{href}" data-via="{clave}" style="--c:{color}"{attrs}>
          <span class="qr-via-icon">{icon(ico)}</span>
          <span class="qr-via-text"><span class="qr-via-title">{titulo}</span><span class="qr-via-sub">{texto}</span></span>
          {icon("externo" if externo else "derecha", "ico qr-via-arrow")}{sr}
        </a>
'''

page("index", f"{NOMBRE} · Bienvenido", f"Únete a la familia {NOMBRE} y déjanos tu reseña.", f'''    <div class="qr-cover is-tall">{COVER}<div class="qr-veil"></div></div>
    <main class="qr-main is-lifted">
      <header class="qr-brand">
        <span class="qr-seal">{SEAL}</span>
        <h1 class="qr-name">Alegría <span>2.0</span></h1>
        <p class="qr-hello">¡Gracias por venir! ¿Qué te apetece hacer?</p>
      </header>
      <nav class="qr-vias" aria-label="Opciones">
{via("carta", "carta.html", "carta", "Ver la carta", "Platos, precios y alérgenos, con fotos.", "var(--magenta)", first=True) if QR_CARTA else ""}{(via("sellos", "sellos.html", "sello", "Tarjeta de sellos", "Un sello en cada visita y, al completarla, invitamos nosotros.", "var(--cyan)", first=not QR_CARTA) + via("canal", CANAL, "whatsapp", "Canal de WhatsApp", "Fiestas, Viejotecas y noches de DJ: te avisamos antes que a nadie.", "var(--magenta)", externo=True) + via("resena", REVIEW, "estrella", "Déjanos tu reseña", "¿Te ha gustado? Cuéntalo en Google, nos ayuda muchísimo.", "var(--gold)", externo=True)) if SELLOS else (via("resena", REVIEW, "estrella", "Déjanos tu reseña", "¿Te ha gustado? Cuéntalo en Google: nos ayuda muchísimo.", "var(--gold)", externo=True, first=not QR_CARTA) + via("unete", "unete.html", "whatsapp", "Únete a la familia Alegría", "Fiestas, Viejotecas y sorpresas en nuestro canal de WhatsApp.", "var(--magenta)"))}      </nav>
    </main>
    <footer class="qr-foot"><a href="https://qronnect.es">Hecho con Qronnect</a></footer>
''', "inicio")

# ---------------- 2 · LA CARTA ----------------
if not QR_CARTA:
    (QR / "carta.html").unlink(missing_ok=True)
else: page("carta", f"Carta · {NOMBRE}", f"La carta de {NOMBRE}: cócteles, cubos, copas, chupitos y sin alcohol, con sus alérgenos.", f'''    <div class="qr-cover is-short">{COVER}<div class="qr-veil"></div>
      <a class="qr-back" href="index.html" aria-label="Volver">{icon("volver")}</a>
      <div class="qr-cover-title">
        <span class="qr-seal is-small">{SEAL}</span>
        <div><p class="qr-cover-kicker">Nuestra carta</p><h1 class="qr-cover-name">{NOMBRE}</h1></div>
      </div>
    </div>
    <header class="qr-bar">
      <div class="qr-bar-row">
        <nav class="qr-chips" aria-label="Secciones de la carta"><ul></ul></nav>
        <button class="qr-filter-btn" type="button" aria-expanded="false" aria-controls="filtro-alergenos" aria-label="Filtrar por alérgenos" hidden>{icon("filtro")}<span class="qr-wide">Alérgenos</span><span class="qr-count"></span></button>
      </div>
      <div class="qr-filter" id="filtro-alergenos" hidden>
        <p>Ocultar platos que lleven:</p>
        <div class="qr-filter-list"></div>
      </div>
    </header>
    <main class="qr-main qr-menu" aria-busy="true">
      <div class="qr-skeleton" aria-label="Cargando la carta"><i></i><i></i><i></i><i></i></div>
    </main>
    <div class="qr-sheet" role="dialog" aria-modal="true" aria-labelledby="ficha-titulo" hidden></div>
''', "carta")

# ---------------- 3 · ALTA Y TARJETA DE SELLOS ----------------
def checkbox(id, label, sub="", required=False):
    return f"""            <label class="qr-check{" is-required" if required else ""}" for="{id}">
              <input type="checkbox" id="{id}" name="{id}">
              <span class="qr-check-box" aria-hidden="true">{icon("check")}</span>
              <span class="qr-check-text">{label}{sub}</span>
            </label>
"""

def slot(i, n):
    last = i == n - 1
    return f'<li class="qr-slot{" is-last" if last else ""}" data-i="{i}"><span class="qr-slot-num">{icon("regalo") if last else i + 1}</span><span class="qr-slot-stamp">{icon("check")}</span></li>'
slots = "".join(slot(i, PROGRAMA["objetivo"]) for i in range(PROGRAMA["objetivo"]))
cols = 6 if PROGRAMA["objetivo"] > 10 else 5
# plantilla de una casilla para que qr.js rehaga la tarjeta si el negocio cambia el número de sellos
SLOT_TPL = {"normal": slot(0, 2), "ultima": slot(1, 2)}

if not SELLOS:
    (QR / "sellos.html").unlink(missing_ok=True)
else: page("sellos", f"Sellos · {NOMBRE}", f"Tarjeta de sellos de {NOMBRE}: un sello en cada visita.", f"""    <div class="qr-topbar">
      <a class="qr-back is-flat" href="index.html" aria-label="Volver">{icon("volver")}</a>
      <span class="qr-seal is-tiny">{SEAL}</span>
      <span class="qr-topbar-name">{NOMBRE}</span>
    </div>
    <main class="qr-main qr-stamps">
      <p class="qr-loading qr-muted" data-view="cargando">Cargando tu tarjeta…</p>

      <!-- ALTA -->
      <section class="qr-panel qr-signup" data-view="alta" hidden>
        <div class="qr-signup-head">
          <h1 class="qr-title">Únete gratis</h1>
          <span class="qr-step-count">Paso <b>1</b> de 3</span>
        </div>
        <div class="qr-progress" role="progressbar" aria-label="Progreso del alta" aria-valuemin="0" aria-valuemax="100"><i></i></div>
        <p class="qr-muted">En 30 segundos tienes tu tarjeta: un sello en cada visita y, con {PROGRAMA["objetivo"]}, {PROGRAMA["premio"].lower()} gratis.</p>
        <form class="qr-form" novalidate>
          <div class="qr-step" data-step="1">
            <div class="qr-step-head">{icon("chispas", "ico qr-step-ico")}<h2>Empecemos con lo básico</h2><p>Con esto ya tienes tu tarjeta</p></div>
            <div class="field"><label for="nombre">¿Cómo te llamas? *</label><input id="nombre" name="nombre" type="text" placeholder="Tu nombre" autocomplete="given-name" maxlength="80"><p class="qr-hint" data-for="nombre"></p></div>
            <div class="field"><label for="telefono">Tu WhatsApp *</label><input id="telefono" name="telefono" type="tel" placeholder="612 345 678" autocomplete="tel" inputmode="tel"><p class="qr-hint" data-for="telefono"></p><p class="qr-help">📱 Es tu tarjeta: si cambias de móvil, la recuperas con tu número</p></div>
            <div class="field"><label for="email">Tu email <span class="qr-dim">(opcional)</span></label><input id="email" name="email" type="email" placeholder="tu@email.com" autocomplete="email" inputmode="email"><p class="qr-hint" data-for="email"></p></div>
            <button class="btn is-solid qr-wide-btn" type="button" data-next>Continuar {icon("derecha")}</button>
          </div>
          <div class="qr-step" data-step="2" hidden>
            <div class="qr-step-head">{icon("regalo", "ico qr-step-ico")}<h2>¿Cuándo es tu cumple?</h2><p>Opcional, pero merece la pena</p></div>
            <div class="field"><label for="fecha_nacimiento">🎂 Tu fecha de nacimiento</label><input id="fecha_nacimiento" name="fecha_nacimiento" type="date" max="2010-12-31" min="1920-01-01"><p class="qr-hint" data-for="fecha_nacimiento"></p><p class="qr-help is-good">🎁 Si nos dejas, te felicitamos con un detalle para celebrarlo aquí</p><p class="qr-help is-dim">Nunca compartimos tu fecha con nadie</p></div>
            <div class="qr-row"><button class="btn" type="button" data-prev>Atrás</button><button class="btn is-solid" type="button" data-next>Continuar {icon("derecha")}</button></div>
            <button class="qr-skip" type="button" data-next data-skip>Saltar este paso</button>
          </div>
          <div class="qr-step" data-step="3" hidden>
            <div class="qr-step-head">{icon("escudo", "ico qr-step-ico")}<h2>Ya casi estás</h2><p>Tú decides qué te mandamos</p></div>
{checkbox("aceptarPrivacidad", f'He leído la <a href="../privacidad.html#club" target="_blank" rel="noopener">política de privacidad</a> y acepto que {NOMBRE} guarde mis datos para gestionar mi tarjeta de sellos. *', required=True)}            <p class="qr-hint is-bad" data-for="aceptarPrivacidad"></p>
{checkbox("aceptarPromos", '<b>Quiero que me aviséis de fiestas y promociones</b>', '<small>Por WhatsApp o email. Te das de baja cuando quieras.</small>')}{checkbox("aceptarCumple", '<b>Felicitadme por mi cumpleaños</b>', '<small>Solo si nos has dado la fecha.</small>')}            <div class="qr-row"><button class="btn" type="button" data-prev>Atrás</button><button class="btn is-solid" type="submit" disabled>🎉 Crear mi tarjeta</button></div>
            <p class="qr-hint is-bad qr-form-error" role="alert"></p>
            <p class="qr-safe">{icon("escudo")}<span>Guardamos tus datos en servidores de la Unión Europea y no se los damos a nadie.</span></p>
          </div>
        </form>
      </section>

      <!-- TARJETA -->
      <div data-view="tarjeta" hidden>
        <header class="qr-page-head">
          <h1 class="qr-title">Hola, <span class="qr-hola"></span></h1>
          <p class="qr-muted">Un sello en cada visita. Completa la tarjeta y llévate el premio.</p>
        </header>
        <article class="qr-panel qr-stampcard">
          <div class="qr-stampcard-body">
            <div class="qr-stampcard-head">
              <div><h2>{PROGRAMA["nombre"]}</h2><p class="qr-muted">{PROGRAMA["descripcion"]}</p></div>
              <p class="qr-counter"><b>0</b><span>/{PROGRAMA["objetivo"]}</span></p>
            </div>
            <ol class="qr-slots" style="--cols:{cols}" aria-label="0 de {PROGRAMA["objetivo"]} sellos">{slots}</ol>
            <p class="qr-prize">{icon("regalo")}<span><span class="qr-dim">Premio: </span><b class="qr-premio">{PROGRAMA["premio"]}</b></span></p>
            <p class="qr-left qr-muted"></p>
          </div>
          <div class="qr-coupon" hidden>
            <p class="qr-coupon-title">¡Tarjeta completa! Tu premio te espera</p>
            <div class="qr-coupon-row">
              <div class="qr-coupon-qr"></div>
              <div><p class="qr-dim">Código del premio</p><p class="qr-code"></p><p class="qr-expire qr-dim"></p></div>
            </div>
            <p class="qr-howto">{icon("info")}{PROGRAMA["instrucciones"]}</p>
          </div>
        </article>

        <!-- MI QR -->
        <section class="qr-myqr" aria-labelledby="tit-miqr">
          <header class="qr-page-head"><h2 class="qr-title" id="tit-miqr">Mi QR</h2><p class="qr-muted">Enséñalo en la barra en cada visita y te ponemos el sello.</p></header>
          <div class="qr-pass">
            <div class="qr-pass-head"><span class="qr-seal is-small">{SEAL}</span><div><p class="qr-pass-name">{NOMBRE}</p><p class="qr-pass-client"></p></div></div>
            <div class="qr-pass-code"></div>
            <p class="qr-pass-tip">{icon("sol")}Sube el brillo de la pantalla para que se lea mejor</p>
          </div>
          <div class="qr-pass-actions">
            <button class="btn is-solid qr-wide-btn" type="button" data-download>{icon("descargar")}Guardar en mis fotos</button>
            <div class="qr-dictate"><div><p class="qr-dim">Si no se puede escanear, dicta este código</p><p class="qr-mono qr-mi-codigo"></p></div><button type="button" data-copy aria-label="Copiar código">{icon("copiar")}</button></div>
          </div>
        </section>

        <!-- MIS DATOS -->
        <details class="qr-panel qr-mydata">
          <summary>Mis datos y avisos</summary>
          <form class="qr-prefs">
{checkbox("prefPromos", '<b>Avisos de fiestas y promociones</b>')}{checkbox("prefCumple", '<b>Felicitación de cumpleaños</b>')}            <button class="btn qr-wide-btn" type="submit">Guardar</button>
          </form>
          <p class="qr-muted qr-small">¿Quieres cambiar tu nombre, teléfono o fecha? Pídelo en la barra o por WhatsApp al 625 92 44 29.</p>
          <button class="qr-danger" type="button" data-baja>Borrar mi tarjeta y mis datos</button>
        </details>
      </div>
    </main>
    <script type="application/json" id="programa">{json.dumps({**PROGRAMA, "slot": SLOT_TPL}, ensure_ascii=False)}</script>
""", "sellos", qrlib=True)

# ---------------- 3b · ÚNETE (mini formulario → canal de WhatsApp) ----------------
page("unete", f"Únete · {NOMBRE}", f"Únete a la familia {NOMBRE}: déjanos tu nombre y entra en nuestro canal de WhatsApp.", f"""    <div class="qr-topbar">
      <a class="qr-back is-flat" href="index.html" aria-label="Volver">{icon("volver")}</a>
      <span class="qr-seal is-tiny">{SEAL}</span>
      <span class="qr-topbar-name">{NOMBRE}</span>
    </div>
    <main class="qr-main qr-stamps">
      <section class="qr-panel qr-signup" data-view="alta">
        <h1 class="qr-title">Únete a la familia</h1>
        <p class="qr-muted qr-join-lead">Déjanos tu nombre y entra en nuestro canal de WhatsApp: fiestas, Viejotecas y noches de DJ, antes que nadie.</p>
        <form class="qr-form qr-join" novalidate autocomplete="on">
          <p class="qr-help qr-autofill">✨ Tu móvil puede rellenarlo por ti: toca un campo y elige tus datos guardados.</p>
          <div class="field"><label for="nombre">¿Cómo te llamas? *</label><input id="nombre" name="name" type="text" placeholder="Nombre y apellido" autocomplete="name" autocapitalize="words" enterkeyhint="next" maxlength="80"><p class="qr-hint" data-for="nombre"></p></div>
          <div class="field"><label for="telefono">Tu WhatsApp *</label><input id="telefono" name="tel" type="tel" placeholder="612 345 678" autocomplete="tel" inputmode="tel" enterkeyhint="next"><p class="qr-hint" data-for="telefono"></p></div>
          <div class="field"><label for="email">Tu email <span class="qr-dim">(opcional)</span></label><input id="email" name="email" type="email" placeholder="tu@email.com" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" enterkeyhint="next"><p class="qr-hint" data-for="email"></p></div>
          <div class="field"><label for="fecha_nacimiento">🎂 Tu cumpleaños <span class="qr-dim">(opcional)</span></label><input id="fecha_nacimiento" name="bday" type="date" autocomplete="bday" max="2010-12-31" min="1920-01-01"><p class="qr-hint" data-for="fecha_nacimiento"></p></div>
{checkbox("aceptarPrivacidad", f'He leído la <a href="../privacidad.html#club" target="_blank" rel="noopener">política de privacidad</a> y acepto que {NOMBRE} guarde mis datos. *', required=True)}{checkbox("aceptarPromos", '<b>Quiero que me aviséis de fiestas y promociones</b>', '<small>Por WhatsApp o email. Te das de baja cuando quieras.</small>')}{checkbox("aceptarCumple", '<b>Felicitadme por mi cumpleaños</b>', '<small>Solo si nos has dado la fecha.</small>')}          <button class="btn is-solid qr-wide-btn" type="submit" disabled>{icon("whatsapp")}Unirme al canal</button>
          <p class="qr-hint is-bad qr-form-error" role="alert"></p>
          <p class="qr-safe">{icon("escudo")}<span>Guardamos tus datos en servidores de la Unión Europea y no se los damos a nadie.</span></p>
        </form>
      </section>
      <section class="qr-panel qr-signup qr-joined" data-view="hecho" hidden>
        <h1 class="qr-title">¡Ya eres de la familia!</h1>
        <p class="qr-muted">Te estamos abriendo el canal de WhatsApp. Si no se abre solo, pulsa aquí:</p>
        <a class="btn is-solid qr-wide-btn qr-canal-btn" href="{CANAL}" target="_blank" rel="noopener noreferrer">{icon("whatsapp")}Abrir el canal de WhatsApp</a>
        <a class="qr-skip" href="index.html">Volver al inicio</a>
      </section>
    </main>
    <script type="application/json" id="canal">{json.dumps(CANAL)}</script>
""", "unete")

# ---------------- 4 · PANTALLA DEL PERSONAL (BARRA) ----------------
BARRA_T = "Barra" if SELLOS else "Clientes"
BARRA_H1 = "Pantalla de barra" if SELLOS else "Tus clientes"
BARRA_TXT = ("Solo para el personal. Escribe la clave del local una vez y este móvil la recuerda." if SELLOS
             else "Solo para el dueño. Escribe tu clave una vez y este móvil la recuerda.")
OFF = "" if SELLOS else " hidden"
OFF_DATA = "" if SELLOS else " data-off"
LISTA = "" if SELLOS else '<h3 class="qr-admin-sub">Últimos apuntados</h3><ul class="qr-admin-list"></ul>'
page("barra", f"{BARRA_T} · {NOMBRE}", f"Pantalla del personal de {NOMBRE}.", f"""    <div class="qr-topbar">
      <span class="qr-seal is-tiny">{SEAL}</span>
      <span class="qr-topbar-name">{NOMBRE} · {BARRA_T}</span>
      <button class="qr-back is-flat qr-logout" type="button" data-salir aria-label="Salir" hidden>{icon("salir")}</button>
    </div>
    <main class="qr-main qr-staff">
      <!-- ENTRAR -->
      <section class="qr-panel" data-view="entrar" hidden>
        <h1 class="qr-title">{BARRA_H1}</h1>
        <p class="qr-muted">{BARRA_TXT}</p>
        <form class="qr-form qr-login">
          <div class="field"><label for="clave">Clave del personal</label><input id="clave" name="clave" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" placeholder="xxxx-xxxx-xxxx-xxxx"></div>
          <p class="qr-hint is-bad" data-for="clave" role="alert"></p>
          <button class="btn is-solid qr-wide-btn" type="submit">Entrar</button>
        </form>
      </section>

      <!-- BUSCAR Y SELLAR -->
      <div data-view="barra" hidden>
        <section class="qr-panel"{OFF}>
          <h1 class="qr-title">Poner un sello</h1>
          <p class="qr-howto">{icon("camara")}Abre la cámara del móvil y escanea el QR del cliente: se abre aquí con su tarjeta.</p>
          <form class="qr-search">
            <label class="sr-only" for="q">Código, teléfono o código de premio</label>
            <input id="q" name="q" type="search" placeholder="Código, teléfono o premio" autocapitalize="characters" autocomplete="off" spellcheck="false">
            <button class="btn is-solid" type="submit" aria-label="Buscar">{icon("buscar")}</button>
          </form>
          <p class="qr-hint is-bad qr-search-error" role="alert"></p>
        </section>

        <article class="qr-panel qr-staff-card" aria-live="polite" hidden{OFF_DATA}>
          <div class="qr-stampcard-head">
            <div><h2 class="qr-staff-name"></h2><p class="qr-muted qr-staff-meta"></p></div>
            <p class="qr-counter"><b>0</b><span>/8</span></p>
          </div>
          <div class="qr-staff-bar" aria-hidden="true"><i></i></div>
          <p class="qr-staff-msg"></p>
          <div class="qr-staff-actions">
            <button class="btn is-solid qr-wide-btn" type="button" data-sellar>{icon("sello")}Poner sello</button>
            <button class="btn qr-wide-btn" type="button" data-forzar hidden>Poner sello igualmente</button>
            <button class="btn is-solid qr-wide-btn is-gold" type="button" data-canjear hidden>{icon("regalo")}Entregar premio</button>
          </div>
          <details class="qr-staff-more">
            <summary>Cambió de móvil</summary>
            <p class="qr-muted qr-small">Genera un enlace nuevo: el cliente escanea este QR con su móvil y recupera la tarjeta. El enlace anterior deja de funcionar.</p>
            <button class="btn qr-wide-btn" type="button" data-recuperar>Generar enlace nuevo</button>
            <div class="qr-recover" hidden><div class="qr-pass-code"></div></div>
          </details>
        </article>

        <!-- SOLO DUEÑO -->
        <section class="qr-panel qr-admin" hidden>
          <h2 class="qr-h2">{icon("usuarios")}Clientes</h2>
          <p class="qr-admin-stats qr-muted"></p>
          <ul class="qr-admin-bdays"></ul>
          {LISTA}
          <div class="qr-staff-actions">
            <button class="btn qr-wide-btn" type="button" data-csv="todos">{icon("descargar")}Descargar todos</button>
            <button class="btn qr-wide-btn" type="button" data-csv="promos">{icon("descargar")}Solo con avisos</button>
          </div>
          <p class="qr-muted qr-small">Se descarga en CSV, que abre Excel. Manda avisos o felicitaciones solo a quien lo haya aceptado: lo indica cada fila.</p>
        </section>
      </div>
    </main>
""", "barra", qrlib=True)

print("ok qr de mesa: index, unete, barra" + (", sellos" if SELLOS else "") + (", carta" if QR_CARTA else ""))
