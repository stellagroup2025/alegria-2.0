// Alegría 2.0 · coreografía de scroll portada de yaas-energy.com (HomePage.js).
// Las constantes llevan el mismo valor que en el original; los comentarios citan su nombre.
import { createGlassScene } from "./glasses.js";
import { NOCHES, DEFAULT_INDEX, WHATSAPP, CANAL, TEL, MAPS, INSTAGRAM, FAQ, pic } from "./data.js";
import "./shell.js";

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger, window.ScrollToPlugin);
// Al recargar se empieza arriba: si el navegador restaura la posición mientras cargan fotos y
// modelos, el refresco de ScrollTrigger mueve la página bajo el usuario.
ScrollTrigger.clearScrollMemory("manual");
window.scrollTo(0, 0);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutQuad = (n) => (n < 0.5 ? 2 * n * n : 1 - (-2 * n + 2) ** 2 / 2);
// Alto de pantalla estable: en móvil la barra del navegador cambia innerHeight al hacer scroll; solo
// se actualiza si cambia el ancho (girar el móvil) o el alto cambia de verdad.
let VH = innerHeight, VW = innerWidth;
addEventListener("resize", () => { if (innerWidth !== VW || Math.abs(innerHeight - VH) > 160) { VW = innerWidth; VH = innerHeight; } });
const vh = () => VH;
const isDesktop = () => window.matchMedia("(min-width: 960px)").matches;
const SCRUB = true; // kE: YAAS usa 1 s de retraso en táctil; con el dedo se sentía como un reajuste al acabar cada sección

// ---------- enlaces ----------
const LINKS = { whatsapp: WHATSAPP, canal: CANAL, tel: TEL, maps: MAPS, instagram: INSTAGRAM };
$$("[data-href]").forEach((a) => (a.href = LINKS[a.dataset.href]));
$(".detail-cta").href = WHATSAPP;
$(".detail-cta").target = "_blank";

// la barra del navegador móvil no debe recalcular todas las animaciones al hacer scroll
ScrollTrigger.config({ ignoreMobileResize: true });

// ---------- Lenis ----------
const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
// Lenis guarda el alto de la página y su ResizeObserver no se entera de los espaciadores que
// añade ScrollTrigger al fijar secciones: se quedaba con 2742 px de límite y el scroll iba a
// tirones. Se vuelve a medir cada vez que ScrollTrigger recalcula.
ScrollTrigger.addEventListener("refresh", () => lenis.resize());
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
window.__lenis = lenis; // pruebas: __lenis.scrollTo(y, { immediate: true })
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 || a.hasAttribute("data-scroll-slider")) return;
    e.preventDefault();
    lenis.scrollTo(id, { duration: 1.4 });
  })
);

// ---------- Avance pegado al scroll ----------
// YAAS avanza estas transiciones a velocidad constante (1 s / 1,1 s por recorrido completo) y al
// soltar el scroll a medias las lleva solas al final o al principio (snap direccional). Con Lenis
// eso se notaba como un reajuste raro al acabar cada transición, como si animación y scroll fueran
// por separado. Ahora siguen al scroll con un suavizado corto y no hay imán.
const FOLLOW_TAU = 0.07; // s
function follower(_seconds, cb) {
  let target = 0, cur = 0, running = false, paused = false;
  const tick = (_t, dt) => {
    const d = target - cur;
    cur = Math.abs(d) < 0.0005 ? target : cur + d * (1 - Math.exp(-dt / 1000 / FOLLOW_TAU));
    cb(cur);
    if (cur === target) { gsap.ticker.remove(tick); running = false; }
  };
  return {
    set(v) { target = v; if (!paused && !running && target !== cur) { running = true; gsap.ticker.add(tick); } },
    pause(p) { paused = p; if (p) { gsap.ticker.remove(tick); running = false; } else if (target !== cur && !running) { running = true; gsap.ticker.add(tick); } },
    get value() { return cur; },
  };
}

// ======================================================================
// 1-3 · HERO → CARRUSEL → DETALLE
// ======================================================================
const ENTRANCE = 0.6; // He (vh)
const DETAIL = 0.6; // at (vh)
const GAP = 0.5; // ot() = 0.5 vh
const DONE = { desktop: 0.85, narrow: 0.7 }; // Ae
const DETAIL_DUR = 1.1; // ye
const DEAD = 2; // vs (px)

const wrapEl = $(".intro-wrap");
const pin = $(".intro-pin");
const scene = createGlassScene($(".glass-canvas"));
let active = DEFAULT_INDEX;

function applyNoche(i) {
  const n = NOCHES[i];
  scene.setNoche(i);
  pin.style.setProperty("--noche", n.color);
  pin.style.setProperty("--noche-dark", n.dark);
  const name = $(".flavor-name");
  name.textContent = n.title;
  name.style.animation = "none"; void name.offsetWidth; name.style.animation = "";
}
function fillDetail(i) {
  const n = NOCHES[i];
  $(".detail-when").textContent = n.when;
  $(".detail-title").textContent = n.title;
  $(".detail-cocktail").textContent = "Su cóctel: " + n.cocktail;
  $(".detail-description").textContent = n.description;
  $$(".detail-thumb").forEach((b, k) => b.classList.toggle("is-active", k === i));
}
applyNoche(active);
fillDetail(active);

function sizeIntro() {
  const tail = isDesktop() ? 120 + 1 * vh() : 0.5 * vh(); // un + fn·vh | hn·vh
  wrapEl.style.height = `calc(100vh + ${(ENTRANCE + DETAIL) * vh() + GAP * vh() + tail}px)`;
}
sizeIntro();

let entranceDone = false;
let detailRaw = 0;
const detailFollow = follower(DETAIL_DUR, (b) => {
  scene.setDetail(b);
  pin.classList.toggle("is-detail", b > 0);
  pin.classList.toggle("is-detail-text", b >= (isDesktop() ? DONE.desktop : DONE.narrow));
});
const entranceFollow = follower(1, (x) => { // wn = 1 s
  pin.style.setProperty("--h2g", String(x));
  pin.classList.toggle("is-entrance-active", x > 0.02);
  scene.setEntrance(x);
  const done = x >= (isDesktop() ? DONE.desktop : DONE.narrow);
  if (done !== entranceDone) {
    entranceDone = done;
    pin.classList.toggle("is-entrance-done", done);
    detailFollow.set(done ? detailRaw : 0);
  }
});

const entranceST = ScrollTrigger.create({
  trigger: wrapEl, start: "top top", end: () => `+=${ENTRANCE * vh()}`, invalidateOnRefresh: true,
  onUpdate: (st) => {
    // al volver al hero con otra noche activa, el carrusel regresa primero a la central
    if (st.progress < 1 && Math.round(scene.state.g) % NOCHES.length !== DEFAULT_INDEX && entranceFollow.value >= 1) {
      gsap.to(scene.state, { g: Math.round(scene.state.g / NOCHES.length) * NOCHES.length + DEFAULT_INDEX, duration: 0.7, ease: "power3.out", onComplete: () => { active = DEFAULT_INDEX; applyNoche(active); fillDetail(active); } });
    }
    entranceFollow.set(st.progress);
  },
});

const detailST = ScrollTrigger.create({
  trigger: wrapEl, start: () => `top+=${(ENTRANCE + GAP) * vh()} top`, end: () => `+=${DETAIL * vh()}`, scrub: true, invalidateOnRefresh: true,
  onUpdate: (st) => {
    const dz = DEAD / Math.max(1, st.end - st.start), p = st.progress;
    detailRaw = p <= dz ? 0 : p >= 1 - dz ? 1 : p;
    detailFollow.set(entranceDone ? detailRaw : 0);
  },
});

// Entrada: arranca cuando cargan las fuentes; si la página ya está bajada, sin vuelo.
// Entrada: espera a las fuentes y al HDRI (sin él el vidrio no tiene qué reflejar).
Promise.all([document.fonts.ready, scene.ready]).then(() => {
  pin.classList.add("is-loaded");
  if (window.scrollY > 4) scene.skipEntrance();
  else scene.playEntrance();
  setTimeout(() => $(".hero-copy").classList.add("is-visible"), 700);
});

$("[data-scroll-slider]").addEventListener("click", (e) => {
  e.preventDefault();
  lenis.scrollTo(entranceST.end, { duration: DETAIL_DUR, easing: (t) => t });
});

// Carrusel: flechas y arrastre
const onSettle = (i) => { active = i; applyNoche(i); fillDetail(i); };
$(".slider-arrow.is-prev").addEventListener("click", () => scene.step(-1, onSettle));
$(".slider-arrow.is-next").addEventListener("click", () => scene.step(1, onSettle));
(() => {
  const stage = $(".slider-stage");
  let id = null, lastX = 0, v = 0, lastT = 0;
  stage.addEventListener("pointerdown", (e) => { id = e.pointerId; lastX = e.clientX; lastT = performance.now(); v = 0; stage.setPointerCapture(id); });
  stage.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - lastX, now = performance.now();
    scene.dragBy(-dx / (window.innerWidth * 0.22));
    v = (-dx / Math.max(1, now - lastT)) * 16; lastX = e.clientX; lastT = now;
  });
  const end = (e) => { if (e.pointerId !== id) return; id = null; scene.endDrag(v, onSettle); };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
})();

// Selector del detalle: miniaturas renderizadas de las propias copas
const thumbs = $(".detail-thumbs");
const thumbImgs = [];
scene.ready.then(() => NOCHES.forEach((_, i) => (thumbImgs[i].src = scene.snapshot(i, 220))));
NOCHES.forEach((n, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "detail-thumb"; b.style.setProperty("--c", n.color);
  b.setAttribute("aria-label", n.title);
  b.innerHTML = `<img alt="">`;
  thumbImgs[i] = b.querySelector("img");
  b.addEventListener("click", () => {
    if (i === active) return;
    pin.classList.add("is-swapping");
    scene.swapTo(i, (k) => { active = k; applyNoche(k); fillDetail(k); pin.classList.remove("is-swapping"); });
  });
  thumbs.appendChild(b);
});
fillDetail(active);

// ======================================================================
// 4 · ARCO DE FOTOS (screen2-arc)
// ======================================================================
const SCENARIOS = [
  { id: "cumple", img: "assets/img/escenas/escena-1.jpg", title: "Cumpleaños con tu gente", caption: "Cuando la tarta llega con bengalas y todo el bar canta contigo" },
  { id: "karaoke", img: "assets/img/escenas/escena-2.jpg", title: "Karaoke", caption: "Cuando te toca el micro y no piensas soltarlo" },
  { id: "viejoteca", img: "assets/img/escenas/escena-3.jpg", title: "Viejoteca", caption: "Cuando suena el vallenato y la pista se llena de recuerdos" },
  { id: "dj", img: "assets/img/escenas/escena-4.jpg", title: "DJ en cabina", caption: "Cuando pides tu canción y el DJ te la pone" },
  { id: "ronda", img: "assets/img/escenas/escena-5.jpg", title: "La última ronda", caption: "Cuando nadie quiere que se encienda la luz" },
];
const ARC_EXTRA = [1, 2, 3, 4, 5].map((k) => ({ id: "arco-" + k, img: `assets/img/escenas/arco-${k}.jpg` }));
const ARC_ORDER = [ARC_EXTRA[0], SCENARIOS[1], ARC_EXTRA[1], SCENARIOS[3], ARC_EXTRA[2], SCENARIOS[0], ARC_EXTRA[3], SCENARIOS[2], ARC_EXTRA[4], SCENARIOS[4]];
const CENTER_ID = "cumple"; // Bn: la tarjeta que se expande = primera tarjeta apilada
const COPIES = 3; // zt
const ARC = { rr: 7, Vt: 0.7, $e: 0.35, Kt: 24, sr: 2.62, or: 0.06, mt: 3.2, Xe: 2.2, wt: 3.1, Ye: 0.62, ar: 3.4, ir: 1.25, cr: 18 };
const Zt = (n) => Math.sqrt(n * n + ARC.$e * ARC.$e) - ARC.$e;
function halfWidths(n, w, p) {
  const i = Math.max(-ARC.mt, Math.min(ARC.mt, n));
  const s = (-i * ARC.Kt * Math.PI) / 180, c = ARC.Vt * w * Zt(i), o = w / 2;
  const u = Math.cos(s), d = Math.sin(s), g = p * 0.15;
  return { left: (o * u * p) / Math.max(p - c - o * d, g), right: (o * u * p) / Math.max(p - c + o * d, g) };
}
function arcPositions(offs, w, p) {
  const hw = offs.map((f) => halfWidths(f, w, p)), gap = ARC.or * w, c = [0];
  for (let f = 1; f < offs.length; f++) c[f] = c[f - 1] + hw[f - 1].right + gap + hw[f].left;
  let o = 0;
  while (o < offs.length - 2 && offs[o + 1] < 0) o++;
  const u = offs[o + 1] - offs[o], d = u === 0 ? 0 : (0 - offs[o]) / u, g = c[o] + (c[o + 1] - c[o]) * d;
  return c.map((f) => f - g);
}
// sin loading="lazy" ni decoding="async": una foto que se pinta por primera vez a mitad de
// la animación deja un fotograma vacío
const cardMarkup = (s, withCopy) => `<img ${pic(s.img, "(max-width: 767px) 80vw, 40vw")} alt="">` +
  (withCopy ? `<div class="scenario-card-shade"></div><div class="scenario-card-copy"><h3 class="scenario-card-title">${s.title}</h3><p class="scenario-card-caption">${s.caption}</p></div>` : "");
// Decodifica todas las fotos de las escenas al cargar para que ninguna se pinte por primera vez
// a mitad de una transición (eso daba un fotograma vacío).
window.addEventListener("load", () => document.querySelectorAll(".screen2 img").forEach((im) => im.decode?.().catch(() => {})));

(() => {
  const section = $(".screen2-arc"), stage = $(".screen2-arc-stage"), target = $(".screen2-arc-target");
  const headline = $(".screen2-headline"), subline = $(".screen2-subline");
  const list = Array.from({ length: ARC_ORDER.length * COPIES }, (_, i) => ARC_ORDER[i % ARC_ORDER.length]);
  const center = ARC_ORDER.length * Math.floor(COPIES / 2) + ARC_ORDER.findIndex((s) => s.id === CENTER_ID);
  const cards = list.map((s, i) => {
    const el = document.createElement("article");
    el.className = "screen2-arc-card" + (i === center ? " is-centre" : "");
    el.innerHTML = cardMarkup(s, i === center);
    stage.appendChild(el);
    return el;
  });
  const copy = cards[center].querySelector(".scenario-card-copy");
  let m = { cardW: 0, cardH: 0, targetW: 0, targetH: 0, dx: 0, dy: 0 }, last = 0;
  const offsetIn = (el, root) => { let x = 0, y = 0, n = el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  function measure() {
    const D = offsetIn(stage, section), F = offsetIn(target, section);
    m = {
      cardW: cards[0].offsetWidth, cardH: cards[0].offsetHeight, targetW: target.offsetWidth, targetH: target.offsetHeight,
      dx: F.x - (D.x + stage.offsetWidth / 2), dy: F.y + target.offsetHeight / 2 - (D.y + stage.offsetHeight / 2),
    };
  }
  function render(A) {
    last = A;
    const { cardW: N, cardH: Dh, targetW, targetH, dx, dy } = m;
    if (!N) return;
    const S = easeInOutQuad(clamp01(A / ARC.Ye));
    const Z = clamp01((A - ARC.Ye) / (1 - ARC.Ye));
    const ue = center - ARC.rr * (1 - S);
    const z = clamp01(Z * ARC.ir);
    const blur = z === 0 ? "none" : `blur(${z * ARC.cr}px)`;
    [headline, subline].forEach((k) => { k.style.opacity = String(1 - z); k.style.filter = blur; });
    const persp = ARC.sr * N;
    const offs = cards.map((_, x) => x - ue);
    const pos = arcPositions(offs, N, persp);
    cards.forEach((k, x) => {
      const h = offs[x], y = Math.abs(h);
      if (y > ARC.wt) { k.style.opacity = "0"; return; } // opacidad, no visibility: la foto sigue decodificada
      const Lx = pos[x], j = ARC.Vt * N * Zt(h), rot = -h * ARC.Kt;
      const W = y <= ARC.Xe ? 1 : 1 - (y - ARC.Xe) / (ARC.wt - ARC.Xe);
      if (x === center) {
        const H = easeInOutQuad(Z);
        k.style.width = `${lerp(N, targetW, H)}px`;
        k.style.height = `${lerp(Dh, targetH, H)}px`;
        k.style.opacity = String(W);
        k.style.zIndex = "5";
        k.style.transform = `translate(-50%, -50%) translate3d(${Lx + dx * H}px, ${dy * H}px, 0) perspective(${persp}px) translateZ(${j * (1 - H)}px) rotateY(${rot * (1 - H)}deg)`;
      } else {
        k.style.opacity = String(W * (1 - z));
        k.style.filter = blur;
        k.style.zIndex = String(4 - Math.min(3, Math.round(y)));
        k.style.transform = `translate(-50%, -50%) translate3d(${Lx}px, 0, 0) perspective(${persp}px) translateZ(${j}px) rotateY(${rot}deg)`;
      }
    });
    copy.style.opacity = String(clamp01((Z - 0.55) / 0.35));
  }
  measure(); render(0);
  new ResizeObserver(() => { measure(); render(last); }).observe(stage);
  ScrollTrigger.create({
    trigger: section, start: "top top", end: () => `+=${ARC.ar * vh()}`, scrub: true, pin: true, invalidateOnRefresh: true,
    onRefresh: () => { measure(); render(last); },
    onUpdate: (st) => { render(st.progress); section.closest(".screen2").classList.toggle("is-arc-running", st.progress < 1); },
  });
  section.closest(".screen2").classList.add("is-arc-running");
})();

// ======================================================================
// 5 · TARJETAS APILADAS (scenario-cards-iso)
// ======================================================================
(() => {
  const section = $(".scenario-cards-iso"), stage = $(".scenario-cards-iso-stage");
  const order = [SCENARIOS.find((s) => s.id === CENTER_ID), ...SCENARIOS.filter((s) => s.id !== CENTER_ID)];
  const cards = order.map((s) => {
    const el = document.createElement("article");
    el.className = "scenario-card-iso";
    el.innerHTML = cardMarkup(s, true);
    stage.appendChild(el);
    return el;
  });
  const n = cards.length, hold = 1; // fE
  cards.forEach((c, i) => gsap.set(c, { xPercent: -50, y: 0, rotate: 0, opacity: 1, zIndex: n - i }));
  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: "top top", end: () => `+=${(n - 1 + hold) * vh()}`, scrub: SCRUB, pin: true, invalidateOnRefresh: true },
  });
  for (let g = 0; g < n - 1; g++) {
    const rot = g % 2 === 0 ? -7 : 7; // xt
    tl.to(cards[g], { y: "-115%", rotate: rot, ease: "power2.inOut", duration: 1 }, g)
      .to(cards[g], { opacity: 0, duration: 0.35, ease: "power1.in" }, g + 0.65);
  }
  tl.to({}, { duration: hold }, n - 1);
})();

// ======================================================================
// 6 · VENTAJAS EN ARCO (advantages)
// ======================================================================
const ADVANTAGES = [
  { n: "01", title: "Karaoke de 20 a 23", text: "Ha vuelto el micro: de martes a domingo, de 20:00 a 23:00. Tú eliges la canción y el bar canta contigo.", color: "#ff2fb3" },
  { n: "02", title: "Vuelve el DJ", text: "La cabina se enciende otra vez: pide tu tema y suena. Vallenato, cumbia, música popular y lo que pida la pista.", color: "#19e6ff" },
  { n: "03", title: "Vuelven las fiestas", text: "Viejotecas, noches de DJ y fiestas especiales otra vez. Te las avisamos en nuestro canal de WhatsApp.", color: "#39ff88" },
  { n: "04", title: "Hasta las 5:30", text: "Abiertos de martes a domingo desde las 20:00; de viernes a domingo, hasta las 5:30. Los lunes, cerrado.", color: "#ffd23f" },
  { n: "05", title: "Tu fiesta, otra vez aquí", text: "Cumpleaños, despedidas y quedadas: vuelve a traer a tu gente, te guardamos sitio para todo el grupo.", color: "#ff3d3d" },
];
(() => {
  const host = $(".advantages-arc-cards");
  const cards = ADVANTAGES.map((a) => {
    const el = document.createElement("article");
    el.className = "advantage-card"; el.style.setProperty("--card-color", a.color);
    el.innerHTML = `<p class="advantage-card-number">${a.n}</p><h3 class="advantage-card-title">${a.title}</h3><p class="advantage-card-description">${a.text}</p>`;
    host.appendChild(el);
    return el;
  });
  const K = { mr: 8.32, bt: 0.7, qe: 1, wr: 1.5, yr: 40, vr: 40 / 420, xr: 56, Rr: 385 / 352, br: 25 / 420, Er: 375 / 303, Tr: 30, _r: 1200 };
  let step = 0, prog = 0;
  function pose(n) {
    const t = Math.abs(n), x = n * step, y = K.xr * n * n, rot = n <= 0 ? n * 8.22 : n * K.mr;
    let o;
    if (t <= K.qe) o = 1 - (1 - K.bt) * t;
    else o = K.bt * (1 - Math.min(1, (t - K.qe) / (K.wr - K.qe)));
    return { rot, x, y, opacity: clamp01(o) };
  }
  function apply(p) {
    prog = p;
    const f = p * (cards.length - 1);
    cards.forEach((c, w) => {
      const { rot, x, y, opacity } = pose(w - f);
      c.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg)`;
      c.style.opacity = String(opacity);
      c.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
    });
  }
  function size() {
    const m = cards[0].offsetWidth || 352, narrow = innerWidth < K._r;
    step = m + (narrow ? K.yr : m * K.vr);
    const h = `${m * (narrow ? K.Er : K.Rr - K.br) - (narrow ? K.Tr : 0)}px`;
    cards.forEach((c) => (c.style.height = h));
    apply(prog);
  }
  size();
  new ResizeObserver(size).observe(host);
  ScrollTrigger.create({
    trigger: $(".advantages-pin"), start: "top top", end: () => `+=${vh() * 2.2}`, scrub: SCRUB, pin: true, invalidateOnRefresh: true, // kr
    onUpdate: (st) => apply(st.progress),
  });
})();

// ======================================================================
// 7 · FAQ
// ======================================================================
(() => {
  const list = $(".faq-list");
  // En la portada solo las 4 más habituales; todas están en contacto.html (el botón de debajo lleva allí).
  const HOME = ["¿Ya estáis abiertos?", "¿A qué hora es el karaoke?", "¿Qué horario tenéis?", "¿Hay que reservar?"];
  FAQ.filter(([q]) => HOME.includes(q)).sort((x, y) => HOME.indexOf(x[0]) - HOME.indexOf(y[0])).forEach(([q, a], i) => {
    const item = document.createElement("div");
    item.className = "faq-item";
    item.innerHTML = `<button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-${i}"><span class="faq-question-text">${q}</span><span class="faq-toggle" aria-hidden="true"></span></button>
      <div class="faq-answer-wrap" id="faq-${i}" role="region"><div class="faq-answer-inner"><p class="faq-answer">${a}</p></div></div>`;
    const btn = item.querySelector("button");
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      setTimeout(() => ScrollTrigger.refresh(), 420);
    });
    list.appendChild(item);
  });
})();

// ======================================================================
// 8 · NUESTRA GENTE (about-brand): mazo de fotos
// ======================================================================
(() => {
  const section = $(".about-brand-pin"), deck = $(".about-brand-deck");
  const photos = [
    { src: "assets/img/gente/gente-4.jpg", alt: "Cliente de siempre con su copa en Alegría 2.0" },
    { src: "assets/img/gente/gente-3.jpg", alt: "Responsable de Alegría 2.0 en el local" },
    { src: "assets/img/gente/gente-2.jpg", alt: "El DJ en su cabina" },
    { src: "assets/img/gente/gente-1.jpg", alt: "Camarera sonriente detrás de la barra" },
  ];
  const cards = photos.map((p) => {
    const c = document.createElement("div");
    c.className = "about-brand-card";
    c.innerHTML = `<div class="about-brand-card-face"><img ${pic(p.src, "(max-width: 767px) 70vw, 30vw")} alt="${p.alt}" loading="lazy"></div>`;
    deck.appendChild(c);
    return c;
  });
  const STACK = [ // _t
    { rotate: 6.58, skewX: -2.37, y: 0 }, { rotate: 2.5, skewX: -2.37, y: 0 },
    { rotate: -1.08, skewX: -2.37, y: 0 }, { rotate: -3, skewX: 2.37, y: 8 },
  ];
  const FROM = [ // zr
    { x: -0.82, y: -0.42, rotate: -26 }, { x: 0.86, y: -0.3, rotate: 22 },
    { x: -0.72, y: 0.5, rotate: 18 }, { x: 0.78, y: 0.46, rotate: -20 },
  ];
  function offscreen(el, dir, rot) { // Ct
    const w = innerWidth, h = innerHeight, cx = dir.x * w, cy = dir.y * h, u = Math.abs((rot * Math.PI) / 180);
    const co = Math.abs(Math.cos(u)), si = Math.abs(Math.sin(u));
    const hw = (el.offsetWidth * co + el.offsetHeight * si) / 2, hh = (el.offsetWidth * si + el.offsetHeight * co) / 2;
    const k = Math.max(1, Math.min((w / 2 + hw + 28) / Math.abs(cx || 1), (h / 2 + hh + 28) / Math.abs(cy || 1)));
    return { x: cx * k, y: cy * k };
  }
  const total = 4.9 - 1; // an − nt
  const tl = gsap.timeline({ paused: true });
  // En móvil las fotos tardan más en llegar desde las esquinas: si el titular se apaga tan rápido
  // como en YAAS (0,75) queda la pantalla vacía un buen rato; ahí se apaga mientras llegan.
  tl.fromTo($(".about-brand-heading-slot"), { opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(26px)", ease: "power1.in", duration: isDesktop() ? 0.75 : 1.7 }, 0);
  cards.forEach((c, i) => {
    const d = FROM[i], s = STACK[i];
    tl.fromTo(c,
      { x: () => offscreen(c, d, s.rotate + d.rotate).x, y: () => offscreen(c, d, s.rotate + d.rotate).y, rotate: s.rotate + d.rotate, skewX: s.skewX, scale: 1, opacity: 1, zIndex: i },
      { x: 0, y: s.y, rotate: s.rotate, skewX: s.skewX, opacity: 1, ease: "sine.out", duration: 2.2 }, 0.15 + i * 0.06);
  });
  const textAt = 0.15 + 3 * 0.06 + 2.2 - 0.31;
  tl.fromTo(".about-brand-text-left", { xPercent: -140, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power2.out", duration: 0.6 }, textAt);
  tl.fromTo(".about-brand-text-right", { xPercent: 140, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power2.out", duration: 0.6 }, textAt);
  const built = tl.duration();
  tl.to({}, { duration: Math.max(0, total - built) }, built);
  const readyAt = built / total;

  // mazo interactivo: cada 2 s la de delante pasa al fondo
  let front = cards.length - 1, timer = 0, interactive = false, hovered = false;
  const depth = (i, f) => (f - i + cards.length) % cards.length;
  function restack(f) {
    cards.forEach((c, i) => {
      const j = depth(i, f);
      c.classList.toggle("is-front", j === 0);
      gsap.set(c, { zIndex: cards.length - 1 - j });
      gsap.to(c, { ...STACK[cards.length - 1 - j], x: 0, duration: 0.8, ease: "power3.out" });
      if (j === cards.length - 1) gsap.to(c, { keyframes: [{ scale: 0.94, duration: 0.32, ease: "power3.in" }, { scale: 1, duration: 0.48, ease: "power3.out" }] });
    });
  }
  const next = () => { front = (front - 1 + cards.length) % cards.length; restack(front); };
  const tick = () => { const r = section.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) next(); };
  function sync() {
    const run = interactive && !hovered;
    if (run && !timer) timer = setInterval(tick, 2000);
    if (!run && timer) { clearInterval(timer); timer = 0; }
  }
  deck.addEventListener("pointerenter", () => { hovered = true; sync(); });
  deck.addEventListener("pointerleave", () => { hovered = false; sync(); });
  deck.addEventListener("click", () => interactive && next());
  ScrollTrigger.create({
    trigger: section, start: "top top", end: () => `+=${total * vh()}`, scrub: SCRUB, pin: true, invalidateOnRefresh: true,
    onRefresh: () => tl.invalidate(),
    onUpdate: (st) => {
      tl.progress(st.progress);
      const on = st.progress >= readyAt;
      if (on !== interactive) {
        interactive = on; deck.classList.toggle("is-interactive", on);
        if (!on) { front = cards.length - 1; }
        sync();
      }
    },
  });
})();

// ======================================================================
// 9 · CONTACTO: dos copas flotando a los lados del panel
// ======================================================================
(() => {
  const frame = $(".contact-frame"), panel = $(".contact-panel");
  const imgs = $$(".contact-glass");
  const POS = [ // We
    { i: 2, x: 0.128, y: 0.273, rotZ: -15 },
    { i: 1, x: 0.867, y: 0.722, rotZ: 15 },
  ];
  const NARROW = [{ x: 0.668, y: 0.825 }, { x: 0.327, y: 0.825 }]; // Fr
  scene.ready.then(() => POS.forEach((p, k) => (imgs[k].src = scene.snapshot(p.i, innerWidth < 768 ? 512 : 1024, (p.rotZ * Math.PI) / 180))));
  const floats = [];
  function place() {
    const f = panel.getBoundingClientRect(), l = frame.getBoundingClientRect();
    if (!f.width) return;
    const narrow = l.width < 960;
    // alto de la lata del original (P·Wr); la copa ocupa ~4/5 de su miniatura cuadrada, de ahí el 1.15
    const size = (narrow ? f.height * 0.3 : Math.max(190, Math.min(543.5, f.height * (543.5 / 771))) * (1583 / 1538)) * 1.15;
    floats.forEach((t) => t.kill()); floats.length = 0;
    POS.forEach((p, k) => {
      const at = narrow ? NARROW[k] : p;
      gsap.set(imgs[k], { left: f.left - l.left + f.width * at.x, top: f.top - l.top + f.height * at.y, width: size, height: size, xPercent: -50, yPercent: -50, y: 0, rotation: narrow ? p.rotZ * 0.5 : 0 });
      floats.push(gsap.to(imgs[k], { y: -16, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: k * 0.9 }));
    });
  }
  place();
  new ResizeObserver(place).observe(panel);
})();

// ---------- bordes redondeados al subir / bajar (gE · wE: radio = progreso × ancho / 2) ----------
const wide = window.matchMedia("(min-width: 1200px)");
const RISE = [".screen2", ".advantages"].map((s) => $(s));
const FALL = [".advantages", ".about-brand"].map((s) => $(s));
gsap.ticker.add(() => {
  const h = vh(); // .screen2 solo sube sobre la intro en escritorio (ver solapes en styles.css)
  RISE.forEach((el) => { if (el.classList.contains("screen2") && !wide.matches) return; const r = clamp01(el.getBoundingClientRect().top / h); el.style.setProperty("--rise-radius", `${(r * el.offsetWidth) / 2}px`); });
  FALL.forEach((el) => { const f = clamp01(1 - el.getBoundingClientRect().bottom / h); el.style.setProperty("--fall-radius", `${(f * el.offsetWidth) / 2}px`); });
});

window.addEventListener("resize", () => { sizeIntro(); });
