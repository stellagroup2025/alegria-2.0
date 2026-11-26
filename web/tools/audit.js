// Auditoría de maquetación (desarrollo): texto cortado, revelados que no aparecen y copas encima del texto.
// Uso en consola: await import("./tools/audit.js"); await __scan()
window.__audit = () => {
  const W = innerWidth, H = innerHeight, res = { y: Math.round(scrollY), sw: document.documentElement.scrollWidth, cut: [], hidden: [], overlap: [] };
  const name = (el) => (el.className && typeof el.className === "string" ? el.tagName.toLowerCase() + "." + el.className.split(" ")[0] : el.tagName.toLowerCase()) + ":" + (el.textContent || el.alt || "").trim().slice(0, 24);
  const inView = (r) => r.bottom > 0 && r.top < H && r.width > 0 && r.height > 0;
  const texts = [...document.querySelectorAll("h1,h2,h3,p,a,button,li,figcaption,label")].filter((el) => { const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && !el.closest(".menu-overlay,.lightbox,[aria-hidden=true]"); });
  texts.forEach((el) => {
    const r = el.getBoundingClientRect(); if (!inView(r)) return;
    if (r.right > W + 2 || r.left < -2) return res.cut.push(name(el) + ` [${Math.round(r.left)},${Math.round(r.right)}]`);
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p); if (cs.overflowX === "visible") continue;
      const pr = p.getBoundingClientRect(); if (r.right > pr.right + 2 || r.left < pr.left - 2) res.cut.push(name(el) + " ⊂ " + name(p).slice(0, 30)); break;
    }
  });
  document.querySelectorAll("[data-reveal]").forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < H * 0.7 && r.bottom > H * 0.1 && parseFloat(getComputedStyle(el).opacity) < 0.5) res.hidden.push(name(el)); });
  const glasses = [...document.querySelectorAll(".night-glass,.cta-glass,.page-hero-glass img,.contact-glass")].map((g) => g.getBoundingClientRect()).filter(inView);
  texts.forEach((el) => { if (el.children.length > 2) return; const r = el.getBoundingClientRect(); if (!inView(r)) return;
    glasses.forEach((g) => { const ix = Math.min(r.right, g.right - g.width * 0.25) - Math.max(r.left, g.left + g.width * 0.25), iy = Math.min(r.bottom, g.bottom - g.height * 0.1) - Math.max(r.top, g.top + g.height * 0.1); if (ix > 8 && iy > 8) res.overlap.push(name(el)); }); });
  return res;
};
window.__scan = async (step = 0.5, wait = 350) => {
  const out = [], max = document.documentElement.scrollHeight - innerHeight;
  for (let y = 0; y <= max + 1; y += innerHeight * step) {
    window.__lenis ? __lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y);
    await new Promise((r) => setTimeout(r, wait));
    const a = __audit(); if (a.sw > innerWidth || a.cut.length || a.hidden.length || a.overlap.length) out.push(a);
  }
  return out;
};
"audit ready";
