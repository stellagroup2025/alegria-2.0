// Partes comunes a todas las páginas: enlaces de contacto, página activa en el menú y menú móvil.
import { WHATSAPP, CANAL, TEL, MAPS, INSTAGRAM } from "./data.js";

const LINKS = { whatsapp: WHATSAPP, canal: CANAL, tel: TEL, maps: MAPS, instagram: INSTAGRAM };
document.querySelectorAll("[data-href]").forEach((a) => { if (LINKS[a.dataset.href]) a.href = LINKS[a.dataset.href]; });

const here = location.pathname.split("/").pop().replace(/^index\.html$/, "") || "./";
document.querySelectorAll(".hero-nav a, .menu-overlay a, .footer-nav a").forEach((a) => {
  if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
});

const toggle = document.querySelector(".menu-toggle"), menu = document.querySelector(".menu-overlay");
if (toggle && menu) {
  const set = (open) => {
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    document.documentElement.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector("span").textContent = open ? "Cerrar" : "Menú";
    window.__lenis?.[open ? "stop" : "start"]();
  };
  menu.inert = true;
  toggle.addEventListener("click", () => set(!menu.classList.contains("is-open")));
  addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
}
