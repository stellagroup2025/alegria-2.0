// Páginas interiores: scroll suave, rótulo que se enciende, revelados al hacer scroll y lo propio
// de cada página (según <body data-page>). La portada usa main.js.
import "./shell.js";
import { NOCHES, HOURS, FAQ, DJ_DIAS, wa, pic } from "./data.js";

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const page = document.body.dataset.page;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Lenis ----------
const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
ScrollTrigger.addEventListener("refresh", () => lenis.resize()); // los pines cambian el alto (ver main.js)
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
window.__lenis = lenis;

// ---------- rótulo de neón: se enciende letra a letra con chisporroteo ----------
function ignite(el) {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.innerHTML = [...text].map((c) => `<span class="ch" aria-hidden="true">${c === " " ? "&nbsp;" : c}</span>`).join("");
  const chs = $$(".ch", el), order = chs.map((_, i) => i).sort(() => Math.random() - 0.5);
  order.forEach((i, k) => chs[i].style.setProperty("--d", `${0.25 + k * 0.11 + Math.random() * 0.08}s`));
  el.classList.add("is-igniting");
  setTimeout(() => el.classList.add("is-lit"), 2200);
}
// en móvil una palabra larga («Ambiente», «Privacidad») no cabe al tamaño mínimo: se reduce hasta caber
function fitSign(el) {
  el.style.fontSize = "";
  const room = el.parentElement.clientWidth, w = el.scrollWidth;
  if (w > room) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * room) / w * 0.97}px`;
}
document.fonts.ready.then(() => $$(".neon-sign").forEach((el) => { ignite(el); fitSign(el); }));
addEventListener("resize", () => $$(".neon-sign").forEach(fitSign));

// ---------- contenido generado ----------
const glass = (id) => `assets/img/copas/${id}.webp`;
const byId = Object.fromEntries(NOCHES.map((n) => [n.id, n]));
const today = new Date().getDay();
const closes = (d) => HOURS[d][2];

if (page === "experiencias") {
  // Sin agenda por días: solo está confirmado el horario. Accesos directos a cada experiencia.
  const ORDER = ["karaoke", "salsa", "dj", "viejoteca", "cumple"];
  const NAME = (n) => n.name;
  $(".exp-chips").innerHTML = ORDER.map((id) => `<a class="day-tag exp-chip" href="#${id}" style="--c:${byId[id].color}">${NAME(byId[id])}</a>`).join("");
  $$(".exp-chips a").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); lenis.scrollTo(a.getAttribute("href"), { offset: -80, duration: 1.2 }); }));
  // una sección por experiencia
  const PHOTO = { karaoke: "escenas/arco-2", salsa: "escenas/arco-3", dj: "escenas/escena-4", viejoteca: "escenas/escena-3", cumple: "escenas/escena-1" };
  const ASK = {
    dj: ["¿Qué noches pincha?", DJ_DIAS ? `¡Hola Alegría 2.0! Quería ir ${DJ_DIAS.toLowerCase()} con el DJ…` : "¡Hola Alegría 2.0! ¿Qué noches tenéis DJ esta semana?"],
    viejoteca: ["Próxima Viejoteca", "¡Hola Alegría 2.0! ¿Cuándo es la próxima Viejoteca?"],
    cumple: ["Reservar mi cumple", "¡Hola Alegría 2.0! Quería celebrar mi cumpleaños con vosotros…"],
  };
  $(".nights").innerHTML = ORDER.map((id) => {
    const n = byId[id], [label, msg] = ASK[id] || ["Guárdame sitio", `¡Hola Alegría 2.0! Quería ir a vivir el ${NAME(n).toLowerCase()}…`];
    return `<article class="night" id="${id}" style="--c:${n.color}">
      <div class="night-media">
        <div class="night-photo" data-reveal="img"><img ${pic(`assets/img/${PHOTO[id]}.jpg`, "(max-width: 767px) 92vw, 45vw")} alt="${NAME(n)} en Alegría 2.0" loading="lazy"></div>
        <img class="night-glass" src="${glass(id)}" alt="${n.cocktail}" loading="lazy" data-float>
      </div>
      <div class="night-copy" data-reveal>
        <p class="eyebrow">${n.when}</p>
        <h2 class="night-title">${NAME(n)}</h2>
        <p>${n.description}</p>
        <div class="night-facts"><span class="night-fact">Para acompañar: <b>${n.cocktail}</b></span></div>
        <div><a class="btn is-solid" href="${wa(msg)}" target="_blank" rel="noopener">${label} <span aria-hidden="true">→</span></a></div>
      </div></article>`;
  }).join("");
}

// Carta: los cócteles y la barra los escribe tools/paginas.py desde qr/carta.json (la misma carta que la página QR de mesa).

if (page === "ambiente") {
  const PHOTOS = [
    ["escenas/arco-2", "karaoke", "Cuando te toca el micro"], ["escenas/arco-3", "pista", "Bailando pegados"],
    ["escenas/arco-1", "gente", "Brindis con la cuadrilla"], ["escenas/arco-5", "barra", "La barra a pleno rendimiento"],
    ["escenas/escena-2", "karaoke", "Micro abierto"], ["escenas/arco-4", "gente", "La foto de la noche"],
    ["escenas/escena-4", "pista", "Con el DJ en cabina"], ["gente/gente-1", "barra", "Detrás de la barra"],
    ["escenas/escena-3", "pista", "Viejoteca"], ["gente/gente-2", "pista", "El DJ en su cabina"],
    ["escenas/escena-1", "gente", "Cumpleaños con tu gente"], ["gente/gente-4", "gente", "Clientes de siempre"],
    ["escenas/escena-5", "gente", "La última ronda"], ["gente/gente-3", "barra", "Te atendemos como en casa"],
  ];
  const LABEL = { karaoke: "Karaoke", pista: "Pista", barra: "Barra", gente: "Gente" };
  $(".reel-track").innerHTML = PHOTOS.slice(0, 7).map(([src, , cap]) => `<figure class="reel-item"><img ${pic(`assets/img/${src}.jpg`, "(max-width: 767px) 80vw, 40vw")} alt="${cap}"><figcaption>${cap}</figcaption></figure>`).join("");
  const grid = $(".gallery");
  // medidas reales: sin ellas las columnas se recolocan al ir llegando cada foto
  const size = (src) => (src.startsWith("gente") ? 'width="1600" height="2000"' : src.includes("arco") ? 'width="2000" height="1328"' : 'width="2000" height="1131"');
  grid.innerHTML = PHOTOS.map(([src, cat, cap], i) => `<button class="gallery-item" type="button" data-cat="${cat}" data-i="${i}" data-reveal><img ${pic(`assets/img/${src}.jpg`, "(max-width: 767px) 50vw, 25vw")} alt="${cap}" ${size(src)} loading="lazy"><span>${LABEL[cat]}</span></button>`).join("");
  $$(".filters button").forEach((b) => b.addEventListener("click", () => {
    $$(".filters button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $$(".gallery-item").forEach((it) => it.classList.toggle("is-hidden", b.dataset.cat !== "todo" && it.dataset.cat !== b.dataset.cat));
    ScrollTrigger.refresh();
  }));
  // visor a pantalla completa (teclado, flechas y deslizar)
  const lb = $(".lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb);
  let cur = 0;
  const visible = () => $$(".gallery-item:not(.is-hidden)").map((b) => +b.dataset.i);
  const show = (i) => { cur = i; const [src, , cap] = PHOTOS[i]; lbImg.src = `assets/img/${src}-1400.jpg`; lbImg.alt = cap; lbCap.textContent = cap; };
  const step = (d) => { const v = visible(), k = v.indexOf(cur); show(v[(k + d + v.length) % v.length]); };
  const open = (i) => { show(i); lb.classList.add("is-open"); lb.inert = false; lenis.stop(); $(".lightbox-close").focus(); };
  const close = () => { lb.classList.remove("is-open"); lb.inert = true; lenis.start(); };
  lb.inert = true;
  grid.addEventListener("click", (e) => { const b = e.target.closest(".gallery-item"); if (b) open(+b.dataset.i); });
  $(".lightbox-close").addEventListener("click", close);
  $(".lb-prev").addEventListener("click", () => step(-1));
  $(".lb-next").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") close(); });
  addEventListener("keydown", (e) => { if (!lb.classList.contains("is-open")) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
  let x0 = null;
  lb.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); x0 = null; });
}

if (page === "celebraciones") {
  const form = $(".form");
  const date = $("#f-fecha");
  date.min = new Date().toISOString().slice(0, 10);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const text = [
      `¡Hola Alegría 2.0! Soy ${f.get("nombre")} y quiero celebrar ${f.get("tipo").toLowerCase()} con vosotros.`,
      f.get("fecha") && `📅 ${new Date(f.get("fecha") + "T12:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}`,
      `👥 Somos ${f.get("personas")}`,
      f.get("mensaje") && `📝 ${f.get("mensaje")}`,
    ].filter(Boolean).join("\n");
    window.open(wa(text), "_blank", "noopener");
  });
}

if (page === "contacto") {
  $(".hours").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const [name, open] = HOURS[d];
    return `<tr${d === today ? ' class="is-today"' : ""}><td>${name}</td><td>${open ? `${open} – ${closes(d)}` : "Cerrado"}</td></tr>`;
  }).join("");
  // ¿abierto ahora? (hora de Madrid; la noche sigue abierta pasada la medianoche)
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })), mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (h) => +h.slice(0, 2) * 60 + +h.slice(3);
  const d = now.getDay(), prev = (d + 6) % 7;
  const isOpen = (HOURS[d][1] && mins >= toMin(HOURS[d][1])) || (HOURS[prev][1] && mins < toMin(closes(prev)));
  // mapa de Google solo a petición (sin él, Google no pone cookies)
  const map = $("[data-map]");
  $(".map-cover button", map).addEventListener("click", () => {
    map.innerHTML = `<iframe title="Mapa de Alegría 2.0" src="${map.dataset.map}" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  });
  const badge = $(".open-now");
  badge.classList.toggle("is-open", Boolean(isOpen));
  badge.textContent = isOpen ? "Abierto ahora" : HOURS[d][1] && mins < toMin(HOURS[d][1]) ? `Hoy abrimos a las ${HOURS[d][1]}` : "Ahora cerrado";
}

// FAQ (contacto y celebraciones)
const faqList = $(".faq-list");
if (faqList) {
  FAQ.forEach(([q, a], i) => {
    const item = document.createElement("div");
    item.className = "faq-item";
    item.innerHTML = `<button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-${i}"><span class="faq-question-text">${q}</span><span class="faq-toggle" aria-hidden="true"></span></button>
      <div class="faq-answer-wrap" id="faq-${i}" role="region"><div class="faq-answer-inner"><p class="faq-answer">${a}</p></div></div>`;
    const btn = $("button", item);
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      setTimeout(() => ScrollTrigger.refresh(), 420);
    });
    faqList.appendChild(item);
  });
}

// Las fotos con loading="lazy" cambian el alto de la página al llegar (sobre todo en la galería en
// columnas): sin recalcular, los disparadores quedan desfasados y hay fotos que nunca aparecen.
let refreshTimer = 0;
$$("img").forEach((img) => { if (!img.complete) img.addEventListener("load", () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150); }); });

// ---------- movimiento al hacer scroll ----------
if (reduced) {
  gsap.set("[data-reveal]", { opacity: 1, y: 0, clipPath: "none" });
} else {
  // tira de fotos horizontal fijada (ambiente). Va primero: ScrollTrigger calcula en orden de
  // creación y los revelados de debajo tienen que contar con el espacio que añade al fijarse.
  const reel = $(".reel-track");
  if (reel) {
    gsap.to(reel, {
      x: () => -(reel.scrollWidth - innerWidth), ease: "none",
      scrollTrigger: { trigger: ".reel", pin: true, start: "top top", end: () => "+=" + (reel.scrollWidth - innerWidth), scrub: true, invalidateOnRefresh: true },
    });
  }
  // de pocos en pocos y rápido: con un lote grande (la galería entera) el escalonado hacía que las
  // últimas fotos tardaran segundos en aparecer estando ya en pantalla
  ScrollTrigger.batch("[data-reveal]:not([data-reveal='img'])", {
    start: "top 92%", once: true, interval: 0.08, batchMax: 4,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.06, overwrite: true }),
  });
  $$("[data-reveal='img']").forEach((el) => {
    gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } })
      .to(el, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.3, ease: "power3.inOut" })
      .to($("img", el), { scale: 1, duration: 1.6, ease: "power3.out" }, 0);
  });
  // copas que flotan a distinto ritmo que la foto
  $$("[data-float]").forEach((el) => gsap.fromTo(el, { yPercent: 18, rotate: -6 }, { yPercent: -18, rotate: 4, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
  // la foto de cabecera se aleja al bajar
  const heroImg = $(".page-hero-media img");
  if (heroImg) gsap.to(heroImg, { yPercent: 12, scale: 1.18, ease: "none", scrollTrigger: { trigger: ".page-hero", start: "top top", end: "bottom top", scrub: true } });
  // marquesina: avanza sola y acelera con el scroll
  $$(".marquee-track").forEach((t) => {
    t.innerHTML += t.innerHTML;
    const loop = gsap.to(t, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    ScrollTrigger.create({ onUpdate: (s) => gsap.to(loop, { timeScale: 1 + Math.min(4, Math.abs(s.getVelocity()) / 600), duration: 0.2, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: 1, duration: 0.8 }) }) });
  });

}
addEventListener("load", () => ScrollTrigger.refresh());
