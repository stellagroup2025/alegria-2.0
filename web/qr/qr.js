// Página QR de mesa (maqueta de Qronnect). Solo front: la carta sale de carta.json (mismo sitio) y la
// tarjeta de sellos se guarda en el localStorage de este móvil. No hay ninguna petición a servidores.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const view = document.body.dataset.qr;
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// localStorage siempre con try/catch: en privado o con los datos bloqueados la demo sigue, sin recordar
const KEY = "alegria_qr_demo";
const store = {
  get(k = KEY) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(v, k = KEY) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k = KEY) { try { localStorage.removeItem(k); } catch {} },
};
let memory = null; // copia en memoria por si no hay localStorage
const getState = () => store.get() ?? memory;
const setState = (s) => { memory = s; store.set(s); };

const ico = (path, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const STAR = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>';
const CHECK = '<path d="M20 6 9 17l-5-5"/>';

let toastTimer;
function toast(title, text = "", ms = 3200) {
  const t = $(".qr-toast");
  t.innerHTML = `<b>${esc(title)}</b>${esc(text)}`;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), ms);
}

// ============ 1 · los tres botones ============
if (view === "inicio") {
  // con el alta hecha en este móvil va directo a su tarjeta; si no, a apuntarse
  $('[data-via="sellos"]').href = getState()?.cliente ? "sellos.html#tarjeta" : "sellos.html#alta";
}

// ============ 2 · la carta ============
// Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011) y las etiquetas, como Qronnect
const ALERGENOS = [
  ["gluten", "Gluten", "🌾"], ["crustaceos", "Crustáceos", "🦐"], ["huevos", "Huevos", "🥚"], ["pescado", "Pescado", "🐟"],
  ["cacahuetes", "Cacahuetes", "🥜"], ["soja", "Soja", "🫘"], ["lacteos", "Lácteos", "🥛"], ["frutos_cascara", "Frutos de cáscara", "🌰"],
  ["apio", "Apio", "🥬"], ["mostaza", "Mostaza", "🟡"], ["sesamo", "Sésamo", "⚪"], ["sulfitos", "Sulfitos", "🍷"],
  ["altramuces", "Altramuces", "🌼"], ["moluscos", "Moluscos", "🦪"],
].map(([id, nombre, emoji]) => ({ id, nombre, emoji }));
const ETIQUETAS = { vegetariano: "Vegetariano", vegano: "Vegano", sin_gluten: "Sin gluten", picante: "Picante", casero: "Casero", nuevo: "Nuevo" };
const ALERGENO = Object.fromEntries(ALERGENOS.map((a) => [a.id, a]));
const precio = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fmt = (p) => (p === null || p === undefined ? "" : precio.format(p));

if (view === "carta") {
  const main = $(".qr-menu"), chips = $(".qr-chips ul"), btn = $(".qr-filter-btn"), panel = $(".qr-filter"), sheet = $(".qr-sheet");
  let categorias = null, sin = [], obs = null, abierto = null;

  const aviso = (t) => `<p class="qr-notice">${t}</p>`;
  const thumb = (p, cls = "qr-thumb") => p.imagen_url
    ? `<div class="${cls}"><img src="${esc(p.imagen_url)}" alt="" loading="lazy"></div>`
    : "";
  const tags = (p) => {
    if (!p.etiquetas.length && !p.alergenos.length) return "";
    return `<div class="qr-tags">${p.etiquetas.map((e) => `<span class="qr-tag">${esc(ETIQUETAS[e] ?? e)}</span>`).join("")}` +
      (p.alergenos.length ? '<span class="sr-only">Alérgenos:</span>' : "") +
      p.alergenos.map((a) => `<span class="qr-allergen"><span aria-hidden="true">${ALERGENO[a]?.emoji ?? "•"}</span> ${esc(ALERGENO[a]?.nombre ?? a)}</span>`).join("") + "</div>";
  };

  function visibles() {
    if (!categorias) return [];
    if (!sin.length) return categorias;
    return categorias.map((c) => ({ ...c, platos: c.platos.filter((p) => !p.alergenos.some((a) => sin.includes(a))) })).filter((c) => c.platos.length > 0);
  }

  function render() {
    const vis = visibles(), destacados = vis.flatMap((c) => c.platos.filter((p) => p.destacado));
    const platos = Object.fromEntries(categorias.flatMap((c) => c.platos.map((p) => [p.id, p])));
    chips.innerHTML = vis.map((c) => `<li><a id="chip-${c.id}" href="#cat-${c.id}">${esc(c.nombre)}</a></li>`).join("");
    let html = "";
    if (!categorias.length) html += aviso("La carta todavía no está disponible.");
    else if (!vis.length) html += aviso("Ningún plato cumple el filtro de alérgenos. Pregunta al personal por alternativas.");
    if (destacados.length) {
      html += `<section class="qr-section" aria-labelledby="tit-destacados"><h2 class="qr-h2 is-star" id="tit-destacados">${ico(STAR)}Recomendados de la casa</h2>
        <ul class="qr-featured">${destacados.map((p) => `<li><button class="qr-feat" type="button" data-plato="${p.id}">
          <div class="qr-thumb">${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="" loading="lazy">` : ""}${p.precio !== null ? `<span class="qr-price">${fmt(p.precio)}</span>` : ""}</div>
          <div class="qr-feat-body"><h3>${esc(p.nombre)}</h3>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ""}</div></button></li>`).join("")}</ul></section>`;
    }
    html += vis.map((c) => `<section class="qr-section" id="cat-${c.id}" aria-labelledby="tit-${c.id}">
      <h2 class="qr-h2" id="tit-${c.id}">${esc(c.nombre)}</h2>${c.descripcion ? `<p class="qr-section-desc">${esc(c.descripcion)}</p>` : ""}
      <ul class="qr-dishes">${c.platos.map((p) => `<li><button class="qr-dish" type="button" data-plato="${p.id}">
        <div class="qr-dish-body"><h3>${p.destacado ? ico(STAR).replace("<svg ", '<svg role="img" aria-label="Recomendado" ').replace(' aria-hidden="true"', "") : ""}${esc(p.nombre)}</h3>
        ${p.descripcion ? `<p class="qr-dish-desc">${esc(p.descripcion)}</p>` : ""}${tags(p)}${p.precio !== null ? `<p class="qr-price">${fmt(p.precio)}</p>` : ""}</div>${thumb(p)}</button></li>`).join("")}</ul></section>`).join("");
    if (categorias.length) html += '<p class="qr-menu-end">Si tienes alguna alergia o intolerancia, avisa al personal antes de pedir.<br>Precios con IVA incluido.</p>';
    main.innerHTML = html;
    $$("[data-plato]", main).forEach((b) => b.addEventListener("click", () => abrir(platos[b.dataset.plato], b)));
    observar(vis);
  }

  // marca en el menú de secciones la que se está viendo
  function observar(vis) {
    obs?.disconnect();
    obs = new IntersectionObserver((entradas) => {
      const vista = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!vista) return;
      const id = vista.target.id.replace("cat-", "");
      $$("a", chips).forEach((a) => a.removeAttribute("aria-current"));
      const chip = $(`#chip-${id}`);
      chip?.setAttribute("aria-current", "true");
      chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }, { rootMargin: "-140px 0px -60% 0px" });
    vis.forEach((c) => { const el = $(`#cat-${c.id}`); if (el) obs.observe(el); });
  }

  function filtro() {
    $(".qr-filter-list").innerHTML = ALERGENOS.map((a) => `<button type="button" data-al="${a.id}" aria-pressed="${sin.includes(a.id)}"><span aria-hidden="true">${a.emoji}</span> ${a.nombre}</button>`).join("") +
      (sin.length ? `<button type="button" class="qr-clear" data-clear>${ico('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')} Quitar filtro</button>` : "");
    btn.classList.toggle("is-on", sin.length > 0);
    $(".qr-count", btn).textContent = sin.length ? `(${sin.length})` : "";
  }
  $(".qr-filter-list").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.clear !== undefined) sin = [];
    else sin = sin.includes(b.dataset.al) ? sin.filter((a) => a !== b.dataset.al) : [...sin, b.dataset.al];
    filtro(); render();
    (b.dataset.clear !== undefined ? btn : $(`[data-al="${b.dataset.al}"]`))?.focus();
  });
  btn.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });

  // ficha del plato con la foto en grande
  function abrir(p, from) {
    abierto = from;
    sheet.innerHTML = `<button class="qr-sheet-bg" type="button" aria-label="Cerrar"></button>
      <div class="qr-sheet-card">${p.imagen_url ? thumb(p) : '<div class="qr-thumb is-empty" aria-hidden="true"></div>'}
        <button class="qr-sheet-close" type="button" aria-label="Cerrar">${ico('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')}</button>
        <div class="qr-sheet-body"><div class="qr-sheet-top"><h2 id="ficha-titulo">${esc(p.nombre)}</h2>${p.precio !== null ? `<span class="qr-price">${fmt(p.precio)}</span>` : ""}</div>
          ${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ""}${tags(p)}
          <p class="qr-sheet-note">¿Alguna alergia? Avisa al personal antes de pedir.</p></div></div>`;
    sheet.hidden = false;
    document.documentElement.style.overflow = "hidden";
    $$(".qr-sheet-bg, .qr-sheet-close", sheet).forEach((b) => b.addEventListener("click", cerrar));
    $(".qr-sheet-close", sheet).focus();
  }
  function cerrar() {
    sheet.hidden = true; sheet.innerHTML = "";
    document.documentElement.style.overflow = "";
    abierto?.focus();
  }
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) cerrar(); });

  fetch("carta.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => {
      // como la carta pública de Qronnect: solo secciones activas y platos disponibles (los agotados no salen)
      categorias = d.categorias.filter((c) => c.activa).sort((a, b) => a.orden - b.orden)
        .map((c) => ({ ...c, platos: c.platos.filter((p) => p.disponible).sort((a, b) => a.orden - b.orden) }))
        .filter((c) => c.platos.length > 0);
      main.removeAttribute("aria-busy");
      if (categorias.length) btn.hidden = false;
      filtro(); render();
    })
    .catch(() => { main.removeAttribute("aria-busy"); main.innerHTML = aviso("No hemos podido cargar la carta. Pregunta al personal o inténtalo en un momento."); });
}

// ============ 3 · alta y tarjeta de sellos ============
if (view === "sellos") {
  const P = JSON.parse($("#programa").textContent);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const alta = $('[data-view="alta"]'), tarjeta = $('[data-view="tarjeta"]');

  function mostrar(cual) {
    alta.hidden = cual !== "alta";
    tarjeta.hidden = cual !== "tarjeta";
    history.replaceState(null, "", `#${cual}`);
    scrollTo(0, 0);
    if (cual === "tarjeta") pintar();
  }

  // ----- alta: los pasos y validaciones de registro-form-v2 -----
  const form = $(".qr-form"), DRAFT = "registro_form_draft";
  const EJEMPLO = { nombre: "Laura Gómez", email: "laura@ejemplo.com", telefono: "612345678", fecha_nacimiento: "1995-06-14", codigo_postal: "28053" };
  let paso = 1;
  const campo = (n) => form.elements[n];
  const REGLAS = {
    nombre: (v) => (v.trim().length >= 2 ? "" : "Tu nombre debe tener al menos 2 caracteres"),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Por favor, revisa que tu email sea correcto"),
    telefono: (v) => (v.replace(/\D/g, "").length >= 9 ? "" : "El teléfono debe tener al menos 9 dígitos"),
    codigo_postal: (v) => (!v || /^\d{5}$/.test(v) ? "" : "El código postal debe tener 5 dígitos"),
  };
  const OK = { nombre: "¡Perfecto!", email: "¡Genial!" };
  function validar(n, mostrarError = true) {
    const el = campo(n), hint = $(`.qr-hint[data-for="${n}"]`), err = REGLAS[n](el.value);
    el.classList.toggle("is-bad", !!err && mostrarError);
    el.classList.toggle("is-good", !err && !!el.value && n !== "codigo_postal");
    hint.className = "qr-hint" + (err && mostrarError ? " is-bad" : !err && OK[n] && el.value ? " is-good" : "");
    hint.innerHTML = err && mostrarError ? esc(err) : !err && OK[n] && el.value ? `${ico(CHECK)} ${OK[n]}` : "";
    if (el.value || err) el.setAttribute("aria-invalid", String(!!err && mostrarError));
    return !err;
  }
  function irA(n) {
    paso = n;
    $$(".qr-step", form).forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    $(".qr-step-count b").textContent = n;
    const pct = Math.round((n / 3) * 100);
    $(".qr-progress").style.setProperty("--p", `${pct}%`);
    $(".qr-progress").setAttribute("aria-valuenow", pct);
    guardarBorrador();
  }
  function botonPaso1() {
    $('[data-step="1"] [data-next]').disabled = !["nombre", "email", "telefono"].every((n) => campo(n).value);
  }
  function guardarBorrador() {
    const data = Object.fromEntries(Object.keys(EJEMPLO).map((n) => [n, campo(n).value]));
    if (Object.values(data).some(Boolean)) store.set({ data, step: paso, timestamp: Date.now() }, DRAFT);
  }
  // demo: datos de ejemplo ya puestos (o el borrador de menos de 1 hora, como Qronnect)
  const borrador = store.get(DRAFT);
  const datos = borrador && Date.now() - borrador.timestamp < 3600e3 ? borrador.data : EJEMPLO;
  Object.entries(datos).forEach(([n, v]) => { if (campo(n)) campo(n).value = v ?? ""; });
  if (borrador && Date.now() - borrador.timestamp >= 3600e3) store.del(DRAFT);

  ["nombre", "email", "telefono", "codigo_postal"].forEach((n) => campo(n).addEventListener("input", () => { validar(n); botonPaso1(); guardarBorrador(); }));
  campo("fecha_nacimiento").addEventListener("input", guardarBorrador);
  ["nombre", "email"].forEach((n) => validar(n, false));
  botonPaso1();

  $$("[data-next]", form).forEach((b) => b.addEventListener("click", () => {
    if (paso === 1 && !["nombre", "email", "telefono"].map((n) => validar(n)).every(Boolean)) { form.querySelector(".is-bad")?.focus(); return; }
    if (paso === 2 && b.classList.contains("btn") && !validar("codigo_postal")) return;
    irA(paso + 1);
    toast("✨ ¡Perfecto!", "Un paso más para disfrutar de las ventajas exclusivas");
  }));
  $$("[data-prev]", form).forEach((b) => b.addEventListener("click", () => irA(paso - 1)));
  const terminos = campo("aceptarTerminos"), enviar = $('[type="submit"]', form);
  terminos.addEventListener("change", () => {
    enviar.disabled = !terminos.checked;
    $('.qr-hint[data-for="aceptarTerminos"]').textContent = "";
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!terminos.checked) { $('.qr-hint[data-for="aceptarTerminos"]').textContent = "Necesitamos que aceptes los términos para continuar"; return; }
    // demo: en Qronnect aquí va el POST de alta y la validación del email. Aquí solo se guarda en el móvil.
    const cliente = Object.fromEntries(Object.keys(EJEMPLO).map((n) => [n, campo(n).value.trim()]));
    cliente.marketing = campo("aceptarMarketing").checked;
    setState({ cliente, sellos: 0, completada: null });
    store.del(DRAFT);
    mostrar("tarjeta");
  });

  // ----- tarjeta: TarjetaSelloCard -----
  const slotsEl = $(".qr-slots"), slots = $$(".qr-slot", slotsEl);
  function pintar(nuevo = -1) {
    const s = getState();
    if (!s?.cliente) return mostrar("alta");
    const n = Math.min(s.sellos, P.objetivo), completa = n >= P.objetivo, faltan = Math.max(0, P.objetivo - n);
    $(".qr-counter b").textContent = n;
    slotsEl.setAttribute("aria-label", `${n} de ${P.objetivo} sellos`);
    slots.forEach((li, i) => { li.classList.toggle("is-full", i < n); li.classList.toggle("is-new", i === nuevo); });
    $(".qr-left").hidden = completa;
    $(".qr-left").textContent = `${faltan === 1 ? "¡Solo te falta 1 sello!" : `Te faltan ${faltan} sellos.`} Te lo ponen en caja al escanear tu QR.`;
    $(".qr-coupon").hidden = !completa;
    if (completa && s.completada) {
      const dias = Math.max(0, Math.ceil((s.completada + 30 * 864e5 - Date.now()) / 864e5));
      const exp = $(".qr-expire");
      exp.textContent = dias === 0 ? "Caduca hoy" : `Caduca en ${dias} día${dias !== 1 ? "s" : ""}`;
      exp.style.color = dias < 7 ? "#ff9aac" : "";
    }
    $("[data-stamp]").disabled = completa;
    $(".qr-pass-client").textContent = s.cliente.nombre;
  }
  $("[data-stamp]").addEventListener("click", () => {
    const s = getState();
    if (!s || s.sellos >= P.objetivo) return;
    s.sellos += 1;
    if (s.sellos >= P.objetivo) s.completada = Date.now();
    setState(s);
    slots.forEach((li) => li.classList.remove("is-new"));
    void slotsEl.offsetWidth; // reinicia la animación
    pintar(s.sellos - 1);
    const c = $(".qr-counter");
    c.classList.remove("is-bump"); void c.offsetWidth; c.classList.add("is-bump");
    toast(s.sellos >= P.objetivo ? "🎉 ¡Tarjeta completa!" : "Sello añadido", s.sellos >= P.objetivo ? "Tu premio te espera" : `${s.sellos} de ${P.objetivo}`);
    if (s.sellos >= P.objetivo) setTimeout(() => $(".qr-coupon").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }), 500);
  });
  $("[data-reset]").addEventListener("click", () => {
    store.del(); store.del(DRAFT); memory = null;
    Object.entries(EJEMPLO).forEach(([n, v]) => (campo(n).value = v));
    terminos.checked = false; campo("aceptarMarketing").checked = false; enviar.disabled = true;
    ["nombre", "email"].forEach((n) => validar(n, false));
    irA(1); store.del(DRAFT);
    mostrar("alta");
    toast("Demo reiniciada");
  });

  // ----- mi QR -----
  $("[data-copy]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(P.cliente); toast("Código copiado"); }
    catch { toast("Error", "No se pudo copiar el código"); }
  });
  $("[data-download]").addEventListener("click", () => {
    // PNG de 600 px dibujado en el propio móvil a partir del SVG de la página (sin red)
    const svg = $(".qr-pass-code svg").cloneNode(true);
    svg.setAttribute("width", 600); svg.setAttribute("height", 600);
    const img = new Image();
    img.onload = () => {
      const cv = Object.assign(document.createElement("canvas"), { width: 600, height: 600 });
      const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false; cx.drawImage(img, 0, 0, 600, 600);
      const a = Object.assign(document.createElement("a"), { download: `qr-${(getState()?.cliente?.nombre || "cliente").replace(/\s+/g, "-")}.png`, href: cv.toDataURL("image/png") });
      a.click();
      toast("QR descargado", "Guárdalo en tus fotos para tenerlo siempre a mano");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  });

  irA(borrador && Date.now() - borrador.timestamp < 3600e3 && borrador.step ? borrador.step : 1);
  mostrar(getState()?.cliente ? "tarjeta" : "alta");
}
