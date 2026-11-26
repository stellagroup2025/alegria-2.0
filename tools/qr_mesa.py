# Página QR de mesa (maqueta de Qronnect con el diseño de Alegría 2.0): qr/index.html (los tres
# botones), qr/carta.html (la carta, de qr/carta.json) y qr/sellos.html (alta y tarjeta simuladas).
# Es solo front: nada llama a Qronnect ni a ningún servidor; la demo guarda lo suyo en el localStorage
# del móvil. Estructura, orden, textos y estados copiados de sistema-qr/Qronnect/frontend:
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
CODIGO_CLIENTE = "DEMO-ALG-7F3A2C91"   # código de demo del QR personal
CODIGO_CUPON = "ALG-8K2Q4P"            # código de demo del cupón

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

def page(slug, title, desc, body, view):
    html = f'''<!doctype html>
<html lang="es" class="is-demo">
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
  <script type="module" src="qr.js"></script>
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

page("index", f"{NOMBRE} · Bienvenido", f"Carta, tarjeta de sellos y reseñas de {NOMBRE}.", f'''    <div class="qr-cover is-tall">{COVER}<div class="qr-veil"></div></div>
    <main class="qr-main is-lifted">
      <header class="qr-brand">
        <span class="qr-seal">{SEAL}</span>
        <h1 class="qr-name">Alegría <span>2.0</span></h1>
        <p class="qr-hello">¡Gracias por venir! ¿Qué te apetece hacer?</p>
      </header>
      <nav class="qr-vias" aria-label="Opciones">
{via("carta", "carta.html", "carta", "Ver la carta", "Platos, precios y alérgenos, con fotos.", "var(--magenta)", first=True)}{via("sellos", "sellos.html", "sello", "Tarjeta de sellos", "Suma un sello en cada visita y llévate premios.", "var(--cyan)")}{via("resena", REVIEW, "estrella", "Déjanos tu reseña", "¿Te ha gustado? Cuéntalo en Google, nos ayuda muchísimo.", "var(--gold)", externo=True)}      </nav>
    </main>
    <footer class="qr-foot"><a href="https://qronnect.es">Hecho con Qronnect</a></footer>
''', "inicio")

# ---------------- 2 · LA CARTA ----------------
page("carta", f"Carta · {NOMBRE}", f"La carta de {NOMBRE}: cócteles, cubos, copas, chupitos y sin alcohol, con sus alérgenos.", f'''    <div class="qr-cover is-short">{COVER}<div class="qr-veil"></div>
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
    return f'''            <label class="qr-check{" is-required" if required else ""}" for="{id}">
              <input type="checkbox" id="{id}" name="{id}">
              <span class="qr-check-box" aria-hidden="true">{icon("check")}</span>
              <span class="qr-check-text">{label}{sub}</span>
            </label>
'''

slots = "".join(
    f'<li class="qr-slot{" is-last" if i == PROGRAMA["objetivo"] - 1 else ""}" data-i="{i}"><span class="qr-slot-num">{icon("regalo") if i == PROGRAMA["objetivo"] - 1 else i + 1}</span><span class="qr-slot-stamp">{icon("check")}</span></li>'
    for i in range(PROGRAMA["objetivo"]))
cols = 6 if PROGRAMA["objetivo"] > 10 else 5

page("sellos", f"Sellos · {NOMBRE}", f"Tarjeta de sellos de {NOMBRE}: un sello en cada visita.", f'''    <div class="qr-topbar">
      <a class="qr-back is-flat" href="index.html" aria-label="Volver">{icon("volver")}</a>
      <span class="qr-seal is-tiny">{SEAL}</span>
      <span class="qr-topbar-name">{NOMBRE}</span>
    </div>
    <main class="qr-main qr-stamps">
      <!-- ALTA (registro-form-v2) -->
      <section class="qr-panel qr-signup" data-view="alta" hidden>
        <div class="qr-signup-head">
          <h1 class="qr-title">Únete gratis</h1>
          <span class="qr-step-count">Paso <b>1</b> de 3</span>
        </div>
        <div class="qr-progress" role="progressbar" aria-label="Progreso del alta" aria-valuemin="0" aria-valuemax="100"><i></i></div>
        <p class="qr-muted">En solo 30 segundos estarás dentro y disfrutando de ventajas exclusivas</p>
        <form class="qr-form" novalidate>
          <div class="qr-step" data-step="1">
            <div class="qr-step-head">{icon("chispas", "ico qr-step-ico")}<h2>Empecemos con lo básico</h2><p>Solo necesitamos conocerte un poquito</p></div>
            <div class="field"><label for="nombre">¿Cómo te llamas? *</label><input id="nombre" name="nombre" type="text" placeholder="Juan Pérez" autocomplete="name"><p class="qr-hint" data-for="nombre"></p></div>
            <div class="field"><label for="email">Tu email *</label><input id="email" name="email" type="email" placeholder="tu@email.com" autocomplete="email" inputmode="email"><p class="qr-hint" data-for="email"></p><p class="qr-help">📧 Te enviaremos ofertas solo si te interesan</p></div>
            <div class="field"><label for="telefono">Tu teléfono *</label><input id="telefono" name="telefono" type="tel" placeholder="612345678" autocomplete="tel" inputmode="tel"><p class="qr-hint" data-for="telefono"></p><p class="qr-help">📱 Solo para ventajas exclusivas, nada de spam</p></div>
            <button class="btn is-solid qr-wide-btn" type="button" data-next>Continuar {icon("derecha")}</button>
          </div>
          <div class="qr-step" data-step="2" hidden>
            <div class="qr-step-head">{icon("regalo", "ico qr-step-ico")}<h2>Personaliza tu experiencia</h2><p>Esto nos ayuda a darte mejores ofertas (opcional)</p></div>
            <div class="field"><label for="fecha_nacimiento">🎂 Tu fecha de nacimiento</label><input id="fecha_nacimiento" name="fecha_nacimiento" type="date"><p class="qr-help is-good">🎁 Te enviaremos un regalo por tu cumpleaños</p><p class="qr-help is-dim">⚠️ Nunca compartiremos tu fecha con terceros</p></div>
            <div class="field"><label for="codigo_postal">Código postal</label><input id="codigo_postal" name="codigo_postal" type="text" placeholder="28001" maxlength="5" inputmode="numeric"><p class="qr-hint" data-for="codigo_postal"></p><p class="qr-help">📍 Para mostrarte ofertas de tu zona</p></div>
            <div class="qr-row"><button class="btn" type="button" data-prev>Atrás</button><button class="btn is-solid" type="button" data-next>Continuar {icon("derecha")}</button></div>
            <button class="qr-skip" type="button" data-next>Saltar este paso</button>
          </div>
          <div class="qr-step" data-step="3" hidden>
            <div class="qr-step-head">{icon("escudo", "ico qr-step-ico")}<h2>Ya casi estás</h2><p>Solo falta confirmar un par de cositas</p></div>
{checkbox("aceptarTerminos", 'Acepto las condiciones para disfrutar del club y recibir mis ventajas. <a href="../privacidad.html" target="_blank" rel="noopener">Ver términos</a>', required=True)}            <p class="qr-hint is-bad" data-for="aceptarTerminos"></p>
{checkbox("aceptarMarketing", '<b>Sí, quiero recibir ofertas personalizadas</b>', '<small>No enviaremos spam. Puedes darte de baja cuando quieras.</small>')}            <div class="qr-row"><button class="btn" type="button" data-prev>Atrás</button><button class="btn is-solid" type="submit" disabled>🎉 Activar mis ventajas</button></div>
            <p class="qr-demo-note">Demo: tus datos no se envían a ningún sitio.</p>
            <p class="qr-safe">{icon("escudo")}<span>Tus datos están seguros. Usamos cifrado y nunca los compartimos.</span></p>
          </div>
        </form>
      </section>

      <!-- TARJETA (MisTarjetasSellos + TarjetaSelloCard) -->
      <div data-view="tarjeta" hidden>
        <header class="qr-page-head">
          <h1 class="qr-title">Sellos</h1>
          <p class="qr-muted">Un sello en cada visita. Completa la tarjeta y llévate el premio.</p>
        </header>
        <article class="qr-panel qr-stampcard">
          <div class="qr-stampcard-body">
            <div class="qr-stampcard-head">
              <div><h2>{PROGRAMA["nombre"]}</h2><p class="qr-muted">{PROGRAMA["descripcion"]}</p></div>
              <p class="qr-counter"><b>0</b><span>/{PROGRAMA["objetivo"]}</span></p>
            </div>
            <ol class="qr-slots" style="--cols:{cols}" aria-label="0 de {PROGRAMA["objetivo"]} sellos">{slots}</ol>
            <p class="qr-prize">{icon("regalo")}<span><span class="qr-dim">Premio: </span><b>{PROGRAMA["premio"]}</b></span></p>
            <p class="qr-left qr-muted"></p>
          </div>
          <div class="qr-coupon" hidden>
            <p class="qr-coupon-title">¡Tarjeta completa! Tu premio te espera</p>
            <div class="qr-coupon-row">
              <div class="qr-coupon-qr">{qr_svg(CODIGO_CUPON, "QR del cupón")}</div>
              <div><p class="qr-dim">Código del cupón</p><p class="qr-code">{CODIGO_CUPON}</p><p class="qr-expire qr-dim"></p></div>
            </div>
            <p class="qr-howto">{icon("info")}{PROGRAMA["instrucciones"]}</p>
          </div>
        </article>

        <div class="qr-demo-tools" aria-label="Controles de la demo">
          <p>Solo en la demo</p>
          <div><button class="btn is-solid" type="button" data-stamp>Simular sello en caja</button><button class="btn" type="button" data-reset>Reiniciar demo</button></div>
        </div>

        <!-- MI QR (app/[slug]/mi-qr) -->
        <section class="qr-myqr" aria-labelledby="tit-miqr">
          <header class="qr-page-head"><h2 class="qr-title" id="tit-miqr">Mi QR</h2><p class="qr-muted">Enséñalo en caja en cada compra para sumar puntos.</p></header>
          <div class="qr-pass">
            <div class="qr-pass-head"><span class="qr-seal is-small">{SEAL}</span><div><p class="qr-pass-name">{NOMBRE}</p><p class="qr-pass-client"></p></div></div>
            <div class="qr-pass-code">{qr_svg(CODIGO_CLIENTE, "Tu código QR de cliente")}</div>
            <p class="qr-pass-tip">{icon("sol")}Sube el brillo de la pantalla para que se lea mejor</p>
          </div>
          <div class="qr-pass-actions">
            <button class="btn is-solid qr-wide-btn" type="button" data-download>{icon("descargar")}Guardar en mis fotos</button>
            <div class="qr-dictate"><div><p class="qr-dim">Si no se puede escanear, dicta este código</p><p class="qr-mono">{CODIGO_CLIENTE}</p></div><button type="button" data-copy aria-label="Copiar código">{icon("copiar")}</button></div>
          </div>
        </section>
      </div>
    </main>
    <script type="application/json" id="programa">{json.dumps({**PROGRAMA, "cliente": CODIGO_CLIENTE, "cupon": CODIGO_CUPON}, ensure_ascii=False)}</script>
''', "sellos")

print("ok qr de mesa: index, carta, sellos")
