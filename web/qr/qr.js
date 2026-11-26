// Página QR de mesa. La tarjeta de sellos es real: alta, sellos y premios van a la base de datos común de
// clientes (Supabase) a través de sus funciones RPC. Este móvil solo guarda su código y su token.
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

// ============ base de datos (Supabase, solo funciones RPC) ============
const SB = JSON.parse($("#supabase")?.textContent || "{}");
async function rpc(fn, args) {
  let r;
  try {
    r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: SB.key, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
  } catch { return { error: "red" }; }
  if (!r.ok) return { error: "servidor" };
  return (await r.json()) ?? { error: "servidor" };
}
const ERRORES = {
  red: "Sin conexión. Comprueba los datos o el wifi y vuelve a probar.",
  servidor: "Algo ha fallado. Vuelve a probar en un momento.",
  ya_registrado: "Este teléfono ya tiene tarjeta. Pide en la barra que te la recuperen en este móvil.",
  telefono: "Revisa el teléfono: tiene que tener al menos 9 cifras.",
  nombre: "Tu nombre debe tener al menos 2 letras.",
  email: "Revisa el email.",
  fecha: "Revisa la fecha de nacimiento.",
  privacidad: "Necesitamos que aceptes la política de privacidad.",
  limite: "Ahora mismo hay muchas altas. Vuelve a probar en unos minutos.",
  no_encontrado: "No encontramos esa tarjeta.",
  clave: "Clave incorrecta.",
  bloqueado: "Demasiados intentos fallidos. Espera 15 minutos.",
  negocio: "Este local no está configurado.",
  solo_admin: "Solo con la clave del dueño.",
};
const msg = (e) => ERRORES[e] || ERRORES.servidor;
const QR_BASE = new URL(".", location.href).href; // …/qr/
function qrSvg(texto, label) {
  if (!window.qrcode) return `<p class="qr-muted">${esc(texto)}</p>`;
  const q = window.qrcode(0, "M");
  q.addData(texto); q.make();
  return q.createSvgTag({ cellSize: 1, margin: 2, scalable: true }).replace("<svg ", `<svg role="img" aria-label="${esc(label)}" shape-rendering="crispEdges" `);
}
const fecha = (iso) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
const hace = (iso) => {
  const h = (Date.now() - new Date(iso)) / 36e5;
  return h < 1 ? "hace un rato" : h < 24 ? `hace ${Math.floor(h)} h` : `el ${fecha(iso)}`;
};

// ============ 1 · los botones ============
if (view === "inicio") {
  // con la tarjeta ya hecha en este móvil va directo a ella; si no, a apuntarse
  const yo = store.get("cliente");
  const a = $('[data-via="sellos"]');
  if (a) a.href = yo?.codigo ? "sellos.html#tarjeta" : "sellos.html#alta";
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
  const vistas = $$("[data-view]");
  const CLI = "cliente";
  let yo = store.get(CLI), tarjeta = null, anterior = null;

  // enlace de recuperación que genera la barra: sellos.html#c=CODIGO&t=TOKEN
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("c") && h.get("t")) { yo = { codigo: h.get("c").toUpperCase(), token: h.get("t") }; store.set(yo, CLI); }

  function mostrar(cual) {
    vistas.forEach((v) => (v.hidden = v.dataset.view !== cual));
    if (cual !== "cargando") history.replaceState(null, "", `#${cual}`);
    if (cual !== "cargando") scrollTo(0, 0);
  }

  // ----- alta -----
  const form = $(".qr-form"), DRAFT = "alta_borrador";
  const CAMPOS = ["nombre", "telefono", "email", "fecha_nacimiento"];
  let paso = 1;
  const campo = (n) => form.elements[n];
  const REGLAS = {
    nombre: (v) => (v.trim().length >= 2 ? "" : "Tu nombre debe tener al menos 2 letras"),
    telefono: (v) => (v.replace(/\D/g, "").length >= 9 ? "" : "El teléfono debe tener al menos 9 cifras"),
    email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Revisa que tu email sea correcto"),
    fecha_nacimiento: (v) => {
      if (!v) return "";
      const d = new Date(v), edad = (Date.now() - d) / (365.25 * 864e5);
      return edad >= 16 && d.getFullYear() >= 1920 ? "" : "Revisa la fecha";
    },
  };
  const OK = { nombre: "¡Perfecto!", telefono: "¡Genial!" };
  function validar(n, mostrarError = true) {
    const el = campo(n), hint = $(`.qr-hint[data-for="${n}"]`), err = REGLAS[n](el.value);
    el.classList.toggle("is-bad", !!err && mostrarError);
    el.classList.toggle("is-good", !err && !!el.value && !!OK[n]);
    if (hint) {
      hint.className = "qr-hint" + (err && mostrarError ? " is-bad" : !err && OK[n] && el.value ? " is-good" : "");
      hint.innerHTML = err && mostrarError ? esc(err) : !err && OK[n] && el.value ? `${ico(CHECK)} ${OK[n]}` : "";
    }
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
  const botonPaso1 = () => ($('[data-step="1"] [data-next]').disabled = !["nombre", "telefono"].every((n) => campo(n).value));
  function guardarBorrador() {
    const data = Object.fromEntries(CAMPOS.map((n) => [n, campo(n).value]));
    if (Object.values(data).some(Boolean)) store.set({ data, step: paso, timestamp: Date.now() }, DRAFT);
  }
  const borrador = store.get(DRAFT);
  const vivo = borrador && Date.now() - borrador.timestamp < 3600e3;
  if (vivo) Object.entries(borrador.data).forEach(([n, v]) => { if (campo(n)) campo(n).value = v ?? ""; });
  else store.del(DRAFT);

  CAMPOS.forEach((n) => campo(n).addEventListener("input", () => { validar(n); botonPaso1(); guardarBorrador(); }));
  botonPaso1();

  $$("[data-next]", form).forEach((b) => b.addEventListener("click", () => {
    if (paso === 1 && !["nombre", "telefono", "email"].map((n) => validar(n)).every(Boolean)) { form.querySelector(".is-bad")?.focus(); return; }
    if (paso === 2 && b.dataset.skip !== undefined) campo("fecha_nacimiento").value = "";
    if (paso === 2 && !validar("fecha_nacimiento")) return;
    if (paso === 2) campo("aceptarCumple").closest(".qr-check").hidden = !campo("fecha_nacimiento").value;
    irA(paso + 1);
  }));
  $$("[data-prev]", form).forEach((b) => b.addEventListener("click", () => irA(paso - 1)));
  const privacidad = campo("aceptarPrivacidad"), enviar = $('[type="submit"]', form), errForm = $(".qr-form-error");
  privacidad.addEventListener("change", () => {
    enviar.disabled = !privacidad.checked;
    $('.qr-hint[data-for="aceptarPrivacidad"]').textContent = "";
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!privacidad.checked) { $('.qr-hint[data-for="aceptarPrivacidad"]').textContent = msg("privacidad"); return; }
    enviar.disabled = true; enviar.textContent = "Creando tu tarjeta…"; errForm.textContent = "";
    const r = await rpc("alta_cliente", {
      p_negocio: SB.negocio,
      p_nombre: campo("nombre").value.trim(),
      p_telefono: campo("telefono").value,
      p_email: campo("email").value.trim() || null,
      p_fecha_nacimiento: campo("fecha_nacimiento").value || null,
      p_acepta_privacidad: true,
      p_acepta_promos: campo("aceptarPromos").checked,
      p_acepta_cumple: campo("aceptarCumple").checked && !!campo("fecha_nacimiento").value,
    });
    enviar.disabled = false; enviar.textContent = "🎉 Crear mi tarjeta";
    if (r.error) { errForm.textContent = msg(r.error); return; }
    // las elecciones del alta se recuerdan en este móvil para el panel «Mis datos»
    yo = { codigo: r.codigo, token: r.token, promos: campo("aceptarPromos").checked, cumple: campo("aceptarCumple").checked && !!campo("fecha_nacimiento").value };
    store.set(yo, CLI); store.del(DRAFT);
    pintar(r); mostrar("tarjeta");
    toast("✨ ¡Ya tienes tu tarjeta!", "Enseña tu QR en la barra en cada visita");
  });

  // ----- tarjeta -----
  const slotsEl = $(".qr-slots");
  function rehacerCasillas(n) {
    if ($$(".qr-slot", slotsEl).length === n) return;
    slotsEl.innerHTML = Array.from({ length: n }, (_, i) => (i === n - 1 ? P.slot.ultima : P.slot.normal)
      .replace(/data-i="\d+"/, `data-i="${i}"`).replace(/<span class="qr-slot-num">\d+<\/span>/, `<span class="qr-slot-num">${i + 1}</span>`)).join("");
    slotsEl.style.setProperty("--cols", n > 10 ? 6 : 5);
  }
  function pintar(t) {
    const antes = tarjeta?.sellos;
    tarjeta = t;
    rehacerCasillas(t.objetivo);
    const n = Math.min(t.sellos, t.objetivo), faltan = Math.max(0, t.objetivo - n), cupon = t.cupon;
    $(".qr-hola").textContent = t.nombre.split(" ")[0];
    $(".qr-counter b").textContent = n;
    $(".qr-counter span").textContent = `/${t.objetivo}`;
    $(".qr-premio").textContent = t.premio;
    slotsEl.setAttribute("aria-label", `${n} de ${t.objetivo} sellos`);
    $$(".qr-slot", slotsEl).forEach((li, i) => { li.classList.toggle("is-full", i < n); li.classList.toggle("is-new", antes !== undefined && i >= antes && i < n); });
    $(".qr-left").hidden = !!cupon;
    $(".qr-left").textContent = n === 0 ? "Enseña tu QR en la barra y te ponemos el primer sello."
      : `${faltan === 1 ? "¡Solo te falta 1 sello!" : `Te faltan ${faltan} sellos.`} Último sello: ${hace(t.ultimo_sello_at)}.`;
    $(".qr-coupon").hidden = !cupon;
    if (cupon) {
      $(".qr-coupon-qr").innerHTML = qrSvg(`${QR_BASE}barra.html#u=${cupon.codigo}`, "QR del premio");
      $(".qr-code").textContent = cupon.codigo;
      const dias = Math.max(0, Math.ceil((new Date(cupon.caduca_at) - Date.now()) / 864e5));
      const exp = $(".qr-expire");
      exp.textContent = dias === 0 ? "Caduca hoy" : `Caduca en ${dias} día${dias !== 1 ? "s" : ""}`;
      exp.style.color = dias < 7 ? "#ff9aac" : "";
    }
    $(".qr-pass-client").textContent = t.nombre;
    $(".qr-mi-codigo").textContent = t.codigo;
    if (!$(".qr-pass-code svg")) $(".qr-pass-code").innerHTML = qrSvg(`${QR_BASE}barra.html#c=${t.codigo}`, "Tu código QR de cliente");
    if (antes !== undefined && t.sellos > antes) {
      const c = $(".qr-counter");
      c.classList.remove("is-bump"); void c.offsetWidth; c.classList.add("is-bump");
      toast(cupon ? "🎉 ¡Tarjeta completa!" : "Sello añadido", cupon ? "Tu premio te espera" : `${n} de ${t.objetivo}`);
      if (cupon) setTimeout(() => $(".qr-coupon").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }), 500);
    }
    if (antes !== undefined && anterior?.cupon && !cupon) toast("🍹 ¡Premio entregado!", "Tarjeta nueva: a por la siguiente");
    anterior = t;
  }
  async function cargar() {
    if (!yo?.codigo) return false;
    const t = await rpc("mi_tarjeta", { p_codigo: yo.codigo, p_token: yo.token });
    if (t.error === "no_encontrado") { store.del(CLI); yo = null; return false; }
    if (t.error) { if (!tarjeta) toast("Sin conexión", msg(t.error)); return !!tarjeta; }
    pintar(t);
    return true;
  }
  // mientras la tarjeta está a la vista se actualiza sola (el sello lo pone la barra desde otro móvil)
  setInterval(() => { if (!document.hidden && !$('[data-view="tarjeta"]').hidden) cargar(); }, 8000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && yo) cargar(); });

  // ----- mis datos -----
  $(".qr-prefs").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await rpc("mis_preferencias", { p_codigo: yo.codigo, p_token: yo.token,
      p_acepta_promos: $("#prefPromos").checked, p_acepta_cumple: $("#prefCumple").checked });
    if (!r.error) { yo = { ...yo, promos: $("#prefPromos").checked, cumple: $("#prefCumple").checked }; store.set(yo, CLI); }
    toast(r.error ? "No se ha guardado" : "Guardado", r.error ? msg(r.error) : "");
  });
  $(".qr-mydata").addEventListener("toggle", (e) => {
    if (!e.target.open) return;
    // sin leer los datos personales del servidor: se marcan según lo elegido en el alta en este móvil
    $("#prefPromos").checked = !!yo?.promos;
    $("#prefCumple").checked = !!yo?.cumple;
  });
  $("[data-baja]").addEventListener("click", async () => {
    if (!confirm("¿Seguro? Se borran tu tarjeta, tus sellos y tus datos, y no se puede deshacer.")) return;
    const r = await rpc("baja_cliente", { p_codigo: yo.codigo, p_token: yo.token });
    if (r.error && r.error !== "no_encontrado") { toast("No se ha podido borrar", msg(r.error)); return; }
    store.del(CLI); yo = null; tarjeta = null;
    $(".qr-pass-code").innerHTML = "";
    form.reset(); irA(1); botonPaso1();
    mostrar("alta");
    toast("Datos borrados", "Tu tarjeta ya no existe");
  });

  // ----- mi QR -----
  $("[data-copy]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(tarjeta.codigo); toast("Código copiado"); }
    catch { toast("Error", "No se pudo copiar el código"); }
  });
  $("[data-download]").addEventListener("click", () => {
    const svg = $(".qr-pass-code svg")?.cloneNode(true);
    if (!svg) return;
    svg.setAttribute("width", 600); svg.setAttribute("height", 600);
    const img = new Image();
    img.onload = () => {
      const cv = Object.assign(document.createElement("canvas"), { width: 600, height: 600 });
      const cx = cv.getContext("2d"); cx.imageSmoothingEnabled = false; cx.drawImage(img, 0, 0, 600, 600);
      const a = Object.assign(document.createElement("a"), { download: `tarjeta-${tarjeta.codigo}.png`, href: cv.toDataURL("image/png") });
      a.click();
      toast("QR guardado", "Tenlo en tus fotos para enseñarlo en la barra");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  });

  irA(vivo && borrador.step ? borrador.step : 1);
  mostrar("cargando");
  cargar().then((ok) => mostrar(ok ? "tarjeta" : "alta"));
}

// ============ 3b · únete: mini formulario → canal de WhatsApp ============
if (view === "unete") {
  const CANAL = JSON.parse($("#canal").textContent);
  const form = $(".qr-join"), campo = (n) => $(`#${n}`, form) || form.elements[n];
  const enviar = $('[type="submit"]', form), errForm = $(".qr-form-error");
  const REGLAS = {
    nombre: (v) => (v.trim().length >= 2 ? "" : "Tu nombre debe tener al menos 2 letras"),
    telefono: (v) => (v.replace(/\D/g, "").length >= 9 ? "" : "El teléfono debe tener al menos 9 cifras"),
    email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Revisa que tu email sea correcto"),
    fecha_nacimiento: (v) => {
      if (!v) return "";
      const d = new Date(v), edad = (Date.now() - d) / (365.25 * 864e5);
      return edad >= 16 && d.getFullYear() >= 1920 ? "" : "Revisa la fecha";
    },
  };
  function validar(n, mostrarError = true) {
    const el = campo(n), hint = $(`.qr-hint[data-for="${n}"]`), err = REGLAS[n](el.value);
    el.classList.toggle("is-bad", !!err && mostrarError);
    hint.className = "qr-hint" + (err && mostrarError ? " is-bad" : "");
    hint.textContent = err && mostrarError ? err : "";
    el.setAttribute("aria-invalid", String(!!err && mostrarError));
    return !err;
  }
  const listo = () => (enviar.disabled = !(campo("aceptarPrivacidad").checked && campo("nombre").value && campo("telefono").value));
  ["nombre", "telefono", "email", "fecha_nacimiento"].forEach((n) => ["input", "change"].forEach((ev) => campo(n).addEventListener(ev, () => { if (campo(n).classList.contains("is-bad")) validar(n); listo(); })));
  ["nombre", "telefono", "email", "fecha_nacimiento"].forEach((n) => campo(n).addEventListener("blur", () => campo(n).value && validar(n)));
  const cumple = campo("aceptarCumple").closest(".qr-check");
  const verCumple = () => { cumple.hidden = !campo("fecha_nacimiento").value; if (cumple.hidden) campo("aceptarCumple").checked = false; };
  ["input", "change"].forEach((ev) => campo("fecha_nacimiento").addEventListener(ev, verCumple)); verCumple();
  campo("aceptarPrivacidad").addEventListener("change", listo); listo();

  const hecho = () => {
    $('[data-view="alta"]').hidden = true; $('[data-view="hecho"]').hidden = false;
    scrollTo(0, 0);
  };
  if (store.get("unido")) hecho();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errForm.textContent = "";
    if (!["nombre", "telefono", "email", "fecha_nacimiento"].map((n) => validar(n)).every(Boolean)) { form.querySelector(".is-bad")?.focus(); return; }
    if (!campo("aceptarPrivacidad").checked) { errForm.textContent = msg("privacidad"); return; }
    const txt = enviar.innerHTML;
    enviar.disabled = true; enviar.textContent = "Un momento…";
    const r = await rpc("alta_cliente", {
      p_negocio: SB.negocio,
      p_nombre: campo("nombre").value.trim(),
      p_telefono: campo("telefono").value,
      p_email: campo("email").value.trim() || null,
      p_fecha_nacimiento: campo("fecha_nacimiento").value || null,
      p_acepta_privacidad: true,
      p_acepta_promos: campo("aceptarPromos").checked,
      p_acepta_cumple: campo("aceptarCumple").checked && !!campo("fecha_nacimiento").value,
    });
    enviar.disabled = false; enviar.innerHTML = txt;
    // si ya estaba apuntado con ese teléfono, también le mandamos al canal
    if (r.error && r.error !== "ya_registrado") { errForm.textContent = msg(r.error); return; }
    store.set({ at: Date.now() }, "unido");
    hecho();
    setTimeout(() => { location.href = CANAL; }, 900);
  });
}

// ============ 4 · pantalla del personal ============
if (view === "barra") {
  const KEY_CLAVE = "personal";
  let yo = store.get(KEY_CLAVE), actual = null;
  const vistas = $$("[data-view]");
  const card = $(".qr-staff-card"), err = $(".qr-search-error");
  const mostrar = (cual) => {
    vistas.forEach((v) => (v.hidden = v.dataset.view !== cual));
    $("[data-salir]").hidden = cual !== "barra";
  };

  async function entrar(clave, silencioso) {
    const r = await rpc("personal_entrar", { p_negocio: SB.negocio, p_clave: clave });
    if (r.error) {
      if (!silencioso || r.error === "clave") { store.del(KEY_CLAVE); yo = null; }
      if (!silencioso) $('.qr-hint[data-for="clave"]').textContent = msg(r.error);
      mostrar("entrar");
      return false;
    }
    if (!SB.sellos && r.rol !== "admin") {
      $('.qr-hint[data-for="clave"]').textContent = "Esta pantalla es solo para el dueño: usa su clave.";
      store.del(KEY_CLAVE); yo = null; mostrar("entrar");
      return false;
    }
    yo = { clave, rol: r.rol }; store.set(yo, KEY_CLAVE);
    $(".qr-admin").hidden = r.rol !== "admin";
    mostrar("barra");
    if (r.rol === "admin") cargarClientes();
    desdeEnlace();
    return true;
  }
  $(".qr-login").addEventListener("submit", (e) => { e.preventDefault(); entrar($("#clave").value.trim()); });
  $("[data-salir]").addEventListener("click", () => { store.del(KEY_CLAVE); yo = null; card.hidden = true; $("#clave").value = ""; $("#q").value = ""; $(".qr-admin").hidden = true; mostrar("entrar"); });

  function pintar(t, aviso = "", tipo = "") {
    if (actual?.codigo === t.codigo) t = { ...actual, ...t }; // conserva el final del teléfono
    actual = t;
    card.hidden = false;
    const n = Math.min(t.sellos, t.objetivo);
    $(".qr-staff-name").textContent = t.nombre;
    $(".qr-staff-meta").textContent = `${t.codigo}${t.telefono_final ? ` · tel. …${t.telefono_final}` : ""}${t.ultimo_sello_at ? ` · último sello ${hace(t.ultimo_sello_at)}` : " · sin sellos aún"}`;
    $(".qr-counter b", card).textContent = n;
    $(".qr-counter span", card).textContent = `/${t.objetivo}`;
    $(".qr-staff-bar").style.setProperty("--p", `${Math.round((n / t.objetivo) * 100)}%`);
    const m = $(".qr-staff-msg");
    m.textContent = aviso || (t.cupon ? `Tiene un premio pendiente: ${t.cupon.premio} (código ${t.cupon.codigo}).` : `Le faltan ${t.objetivo - n} para ${t.premio.toLowerCase()}.`);
    m.className = "qr-staff-msg" + (tipo ? ` is-${tipo}` : "");
    $("[data-sellar]").hidden = !!t.cupon;
    $("[data-canjear]").hidden = !t.cupon;
    $("[data-forzar]").hidden = true;
    $(".qr-recover").hidden = true;
  }
  async function buscar(q) {
    err.textContent = "";
    const r = await rpc("personal_buscar", { p_negocio: SB.negocio, p_clave: yo.clave, p_q: q });
    if (r.error) { card.hidden = true; err.textContent = msg(r.error); if (r.error === "clave") entrar("", true); return; }
    pintar(r);
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $(".qr-search").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#q").value.trim(); if (q) buscar(q); });

  async function sellar(forzar = false) {
    const b = $(forzar ? "[data-forzar]" : "[data-sellar]");
    b.disabled = true;
    const r = await rpc("personal_sellar", { p_negocio: SB.negocio, p_clave: yo.clave, p_codigo: actual.codigo, p_forzar: forzar });
    b.disabled = false;
    if (r.error === "reciente") {
      pintar(r, `Ya tiene un sello ${hace(r.ultimo_sello_at)}. Solo se pone uno por visita: si es otra visita, ponlo igualmente.`, "warn");
      $("[data-sellar]").hidden = true;
      $("[data-forzar]").hidden = false;
      return;
    }
    if (r.error === "cupon_pendiente") { pintar(r, "Primero entrégale el premio que tiene pendiente.", "warn"); return; }
    if (r.error) { toast("Error", msg(r.error)); return; }
    pintar(r, r.completa ? `🎉 ¡Tarjeta completa! Ya puede pedir ${r.premio.toLowerCase()}.` : `✅ Sello puesto: lleva ${r.sellos} de ${r.objetivo}.`, "ok");
    navigator.vibrate?.(60);
  }
  $("[data-sellar]").addEventListener("click", () => sellar(false));
  $("[data-forzar]").addEventListener("click", () => sellar(true));
  $("[data-canjear]").addEventListener("click", async () => {
    if (!actual?.cupon) return;
    const r = await rpc("personal_canjear", { p_negocio: SB.negocio, p_clave: yo.clave, p_cupon: actual.cupon.codigo });
    if (r.error) { toast("No se ha podido", r.error === "ya_canjeado" ? "Ese premio ya se entregó." : r.error === "caducado" ? "El premio ha caducado." : msg(r.error)); return; }
    pintar(r, `🍹 Premio entregado: ${r.premio}. Su tarjeta empieza de cero.`, "ok");
  });
  $("[data-recuperar]").addEventListener("click", async () => {
    if (!confirm(`¿Generar un enlace nuevo para ${actual.nombre}? El de su móvil anterior dejará de funcionar.`)) return;
    const r = await rpc("personal_recuperar", { p_negocio: SB.negocio, p_clave: yo.clave, p_codigo: actual.codigo });
    if (r.error) { toast("Error", msg(r.error)); return; }
    const box = $(".qr-recover");
    $(".qr-pass-code", box).innerHTML = qrSvg(`${QR_BASE}sellos.html#c=${r.codigo}&t=${r.token}`, "QR para recuperar la tarjeta");
    box.hidden = false;
  });

  // ----- solo dueño: clientes y exportar -----
  let clientes = [];
  async function cargarClientes() {
    const r = await rpc("personal_clientes", { p_negocio: SB.negocio, p_clave: yo.clave });
    if (r.error) return;
    clientes = r.clientes;
    const mes = new Date().getMonth(), promos = clientes.filter((c) => c.acepta_promos).length;
    const cumples = clientes.filter((c) => c.acepta_cumple && c.fecha_nacimiento && new Date(c.fecha_nacimiento).getMonth() === mes)
      .sort((a, b) => a.fecha_nacimiento.slice(8) - b.fecha_nacimiento.slice(8));
    if (!SB.sellos) {
      $(".qr-admin-list").innerHTML = clientes.slice(0, 50).map((c) => `<li><b>${esc(c.nombre)}</b> · <a href="https://wa.me/${esc(c.telefono.replace(/\D/g, ""))}" target="_blank" rel="noopener">${esc(c.telefono)}</a><span class="qr-dim"> · ${fecha(c.alta)}${c.acepta_promos ? " · acepta avisos" : ""}</span></li>`).join("") || '<li class="qr-dim">Todavía no se ha apuntado nadie.</li>';
    }
    $(".qr-admin-stats").textContent = `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""} · ${promos} aceptan avisos · ${cumples.length} cumplen años este mes`;
    $(".qr-admin-bdays").innerHTML = cumples.map((c) => `<li>🎂 <b>${esc(c.nombre)}</b> · ${Number(c.fecha_nacimiento.slice(8))} ${new Date(c.fecha_nacimiento).toLocaleDateString("es-ES", { month: "long" })} · <a href="https://wa.me/${esc(c.telefono.replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp</a></li>`).join("");
  }
  $$("[data-csv]").forEach((b) => b.addEventListener("click", async () => {
    await cargarClientes();
    const filas = clientes.filter((c) => b.dataset.csv === "todos" || c.acepta_promos);
    const cols = [["nombre", "Nombre"], ["telefono", "Teléfono"], ["email", "Email"], ["fecha_nacimiento", "Nacimiento"],
      ...(SB.sellos ? [["sellos", "Sellos ahora"], ["visitas", "Visitas"], ["ultimo_sello_at", "Última visita"]] : []),
      ["acepta_promos", "Acepta avisos"], ["acepta_cumple", "Acepta felicitación"], ["alta", "Alta"], ["codigo", "Código"]].filter(([k]) => SB.sellos || k !== "codigo");
    const cel = (v) => { const t = v === true ? "sí" : v === false ? "no" : v == null ? "" : String(v).replace(/T.*/, ""); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const csv = "﻿" + [cols.map((c) => c[1]).join(";"), ...filas.map((f) => cols.map(([k]) => cel(f[k])).join(";"))].join("\r\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: `clientes-${SB.negocio}-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    toast("Descargado", `${filas.length} cliente${filas.length !== 1 ? "s" : ""}`);
  }));

  // al escanear el QR del cliente (barra.html#c=…) o del premio (#u=…) se abre aquí directamente
  async function desdeEnlace() {
    const h = new URLSearchParams(location.hash.slice(1)), q = h.get("c") || h.get("u");
    if (q && yo) { $("#q").value = q; await buscar(q); history.replaceState(null, "", location.pathname); }
  }
  addEventListener("hashchange", desdeEnlace);
  if (yo?.clave) entrar(yo.clave, true);
  else mostrar("entrar");
}
