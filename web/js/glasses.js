// Escena 3D de copas: entrada del hero, carrusel de noches y detalle.
// Coreografía portada de yaas-energy.com (heroLayout + Scene): mismas curvas,
// tiempos, retrasos, layout del carrusel y transición al detalle.
import * as THREE from "three";
import { RGBELoader } from "../assets/vendor/RGBELoader.js";
import { buildGlass, loadGlasses } from "./models.js";
import { createBackdrop } from "./backdrop.js";
import { NOCHES, DEFAULT_INDEX } from "./data.js";

const gsap = window.gsap;
const N = NOCHES.length;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
const pow2InOut = gsap.parseEase("power2.inOut");
const pow3InOut = gsap.parseEase("power3.inOut");
const pow2In = gsap.parseEase("power2.in");

function bezier(a, c, b, t, out) {
  const u = 1 - t;
  out.x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
  out.y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
  out.z = u * u * a.z + 2 * u * t * c.z + t * t * b.z;
  return out;
}

// ---------- Layout del hero (heroLayout.js) ----------
// Las latas originales acaban casi boca abajo (rotZ 2.661); una copa boca abajo
// derramaría, así que la de arriba termina inclinada en el mismo ángulo − π.
const HERO_DESKTOP = [
  { slot: 0, end: { x: 0.1, y: 0.72, z: 0.2, rotY: 0.15, rotZ: 2.661 - Math.PI, scale: 1.13 },
    start: { x: 0.3, y: 2.54, z: -0.4, rotY: 0.15, rotZ: 2.661 - Math.PI + Math.PI * 3, scale: 0.3 },
    control: { x: -0.1, y: 1.69, z: 0.9 }, delay: 0 },
  { slot: -1, end: { x: -1.39, y: -0.47, z: 0.1, rotY: 0.2, rotZ: -0.44, scale: 1.217 },
    start: { x: -3.2, y: -1.1, z: -0.6, rotY: 0.2, rotZ: -0.44 - Math.PI * 3, scale: 0.28 },
    control: { x: -2.3, y: -1.4, z: 0.6 }, delay: 0.12 },
  { slot: 1, end: { x: 1.79, y: -0.05, z: -0.2, rotY: -0.25, rotZ: 1.05 - Math.PI / 2, scale: 1.13 },
    start: { x: 3.2, y: 0.5, z: -0.9, rotY: -0.25, rotZ: 1.05 - Math.PI / 2 + Math.PI * 3, scale: 0.26 },
    control: { x: 2.4, y: -0.3, z: 0.3 }, delay: 0.24 },
];
const L = 0.349, Y = 0.44;
// En móvil las copas suben respecto a YAAS (y −0,457/−0,539): con nuestro texto de entrada, más
// largo, quedaban debajo de él y no se leía. Ahora van entre el rótulo y el texto.
const HERO_MOBILE = [
  { slot: 0, end: { x: 0, y: -0.06, z: 0.2, rotY: 0.1, rotZ: 0.05, scale: 0.692 },
    start: { x: 0, y: 1.7, z: -0.4, rotY: 0.1, rotZ: 0.05 + Math.PI * 3, scale: 0.22 },
    control: { x: -0.1, y: 1.3, z: 0.9 }, delay: 0 },
  { slot: -1, end: { x: -Y, y: -0.14, z: 0, rotY: 0.18, rotZ: L, scale: 0.65 },
    start: { x: -1.6, y: -1.5, z: -0.5, rotY: 0.18, rotZ: L - Math.PI * 3, scale: 0.2 },
    control: { x: -1.5, y: -1.1, z: 0.5 }, delay: 0.12 },
  { slot: 1, end: { x: Y, y: -0.14, z: -0.1, rotY: -0.18, rotZ: -L, scale: 0.65 },
    start: { x: 1.6, y: -1.5, z: -0.7, rotY: -0.18, rotZ: -L + Math.PI * 3, scale: 0.2 },
    control: { x: 1.5, y: -1.1, z: 0.3 }, delay: 0.24 },
];
const ENTRANCE_DURATION = 1.5;

// ---------- Layout del carrusel (Scene.js) ----------
const SLOT_DESKTOP = { spacingX: 0.85, degPerSlot: 22, depthZ: 0.3, scaleStep: 0.1, minScale: 0.62, dipY: 0.02, fadeRange: 2.5 };
const SLOT_MOBILE = { spacingX: 1.35, degPerSlot: 34, depthZ: 0.4, scaleStep: 0.22, minScale: 0.35, dipY: 0.02, fadeRange: 1.05, baseScale: 0.683, yOffset: 0.0386 };
const SLOT_Y = -0.045;
function slot(o, mobile) {
  const c = mobile ? SLOT_MOBILE : SLOT_DESKTOP;
  const a = Math.abs(o), s = Math.sign(o);
  return {
    x: o * c.spacingX,
    y: -a * a * c.dipY + (c.yOffset ?? SLOT_Y),
    z: -a * c.depthZ,
    rotY: -s * a * c.degPerSlot * (Math.PI / 180),
    scale: (c.baseScale ?? 1) * Math.max(c.minScale, 1 - a * c.scaleStep),
    visibility: Math.max(0, 1 - a / c.fadeRange),
  };
}
const wrap = (i, g, n = N) => { let d = i - g; d = ((d % n) + n) % n; if (d > n / 2) d -= n; return d; };
const nearest = (g, i, n = N) => {
  const base = Math.round((g - i) / n) * n + i;
  let best = base, dist = Math.abs(base - g);
  for (const c of [base - n, base + n]) { const d = Math.abs(c - g); if (d < dist) { best = c; dist = d; } }
  return best;
};
const EXTRA_OFFSETS = { [-2]: -2, [2]: 2 }; // las dos copas que no salen en el hero
const EXTRA_REACH = 1.15;
const DETAIL_ROTZ = THREE.MathUtils.degToRad(-13);
const DETAIL_POS = { desktop: { x: 0.365, y: -0.028 }, mobile: { x: 0, y: 0.13 } };
const DETAIL_SCALE = { desktop: 1.55, mobile: 0.6017 };
const PARALLAX = 0.16;
// Las copas son más anchas que una lata (0,58 de ancho por 1 de alto): se reducen para ocupar lo mismo.
const GLASS_SCALE = 0.82;
const GLASS_FIT = { martini: 0.92, margarita: 0.86, coupe: 0.92, balon: 1, highball: 1.04 };
const DIM = new THREE.Color(0.42, 0.42, 0.48);
const WHITE = new THREE.Color(1, 1, 1);

// ---------- Escena ----------
export function createGlassScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  // 1,5 como máximo: el pase de transmisión del vidrio cuesta proporcional a los píxeles
  // (en móvil 1,25: la memoria de GPU es mucho menor y la pantalla, pequeña)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, innerWidth < 768 ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 3.6);

  // Iluminación: dos HDRI de Poly Haven (CC0) —estudio con softboxes para el vidrio (reflejos
  // limpios) y estudio de neón solo para el líquido (color profundo con brillos de colores)—,
  // luz principal con sombras suaves y contraluces magenta y cian que recortan los bordes.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const loadEnv = (file) => new RGBELoader().loadAsync(file).then((hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const t = pmrem.fromEquirectangular(hdr).texture; hdr.dispose(); return t;
  });
  let liquidEnv = null;
  const useLiquidEnv = (root) => root.traverse((o) => { if (o.material?.userData?.isLiquid) { o.material.envMap = liquidEnv; o.material.needsUpdate = true; } });
  const envReady = Promise.all([loadEnv("assets/hdr/studio_small_09_1k.hdr"), loadEnv("assets/hdr/neon_photostudio_1k.hdr")]).then(([studio, neon]) => {
    scene.environment = studio; liquidEnv = neon; useLiquidEnv(scene);
  });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a0d24, 0.35));
  const key = new THREE.DirectionalLight(0xfff4ea, 2.4);
  key.position.set(1.8, 3.2, 3);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(innerWidth < 768 ? 512 : 1024);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 12 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 6;
  const fill = new THREE.DirectionalLight(0xc9d8ff, 0.6); fill.position.set(-3, 0.5, 2.5);
  const rimL = new THREE.SpotLight(0xff2fb3, 40, 12, 0.6, 0.8); rimL.position.set(-3.2, 1.2, -1.8);
  const rimR = new THREE.SpotLight(0x19e6ff, 40, 12, 0.6, 0.8); rimR.position.set(3.2, -0.2, -1.8);
  scene.add(key, fill, rimL, rimR);

  const backdrop = createBackdrop(camera, { wordmark: document.querySelector(".hero-logo-giant .logo-text"), wordmark2: document.querySelector(".logo-2") });
  scene.add(backdrop.mesh);

  // Cada copa: outer (posición/escala/rotZ) > inner (parallax del ratón) > modelo (rotY)
  const items = NOCHES.map((n) => {
    const outer = new THREE.Group();
    const inner = new THREE.Group();
    const model = new THREE.Group(); // el GLB se añade al cargar (loadGlasses)
    model.userData.tick = () => {};
    model.scale.setScalar(GLASS_SCALE * (GLASS_FIT[n.glass] ?? 1));
    inner.add(model); outer.add(inner); scene.add(outer);
    outer.visible = false;
    return { outer, inner, model, mats: [], type: n.glass, base: new THREE.Color(n.color), fit: GLASS_SCALE * (GLASS_FIT[n.glass] ?? 1) };
  });

  const modelsReady = loadGlasses().then(() => items.forEach((it) => {
    const g = buildGlass(it.type); it.model.add(g); it.mats = g.userData.materials; useLiquidEnv(g);
  }));

  let mobile = false;
  let heroLayout = HERO_DESKTOP;
  const slotOf = (s) => (DEFAULT_INDEX + s + N) % N;
  const state = {
    entrance: 0, detail: 0, g: DEFAULT_INDEX, active: DEFAULT_INDEX, spin: 0,
    flown: false, loaded: false, pointer: { x: 0, y: 0 }, pointerS: { x: 0, y: 0 },
  };
  const flights = [];

  function setTransform(it, p) {
    it.outer.position.set(p.x, p.y, p.z);
    it.outer.rotation.set(0, 0, p.rotZ ?? 0);
    it.model.rotation.y = p.rotY ?? 0;
    it.outer.scale.setScalar(p.scale);
  }
  function tint(it, k) { for (const m of it.mats) { m.emissiveIntensity = lerp(0.08, 0.32, k); m.color.copy(DIM).lerp(WHITE, k); } }

  // Recorrido entrada → carrusel (Scene.js, Ie): de la pose del hero al hueco del carrusel.
  function toSlider() {
    return heroLayout.map((h) => {
      const s = slot(h.slot, mobile);
      return { item: items[slotOf(h.slot)], start: h.end, control: { x: (h.end.x + s.x) / 2, y: Math.max(h.end.y, s.y) + 0.35, z: 0.2 }, end: s, slot: h.slot };
    });
  }
  let paths = [];

  function playEntrance() {
    backdrop.startIntro();
    heroLayout.forEach((h) => {
      const it = items[slotOf(h.slot)];
      it.outer.visible = true;
      setTransform(it, h.start);
      const c = { t: 0 }, tmp = {};
      flights.push(gsap.to(c, {
        t: 1, duration: ENTRANCE_DURATION, delay: h.delay, ease: "power3.out",
        onUpdate: () => {
          bezier(h.start, h.control, h.end, c.t, tmp);
          setTransform(it, { ...tmp, rotY: lerp(h.start.rotY, h.end.rotY, c.t), rotZ: lerp(h.start.rotZ, h.end.rotZ, c.t), scale: lerp(h.start.scale, h.end.scale, c.t) });
        },
        onComplete: () => { if (flights.every((f) => f.progress() === 1)) state.flown = true; },
      }));
    });
  }
  function skipEntrance() {
    backdrop.skipIntro();
    flights.forEach((f) => f.progress(1));
    heroLayout.forEach((h) => { const it = items[slotOf(h.slot)]; it.outer.visible = true; setTransform(it, h.end); });
    state.flown = true;
  }

  // ----- pose por fotograma -----
  const tmp = {};
  function poseEntrance(e) {
    const t = clamp(e, 0, 1), k = pow2InOut(t);
    if (state.flown) {
      paths.forEach((p) => {
        bezier(p.start, p.control, p.end, k, tmp);
        const spin = Math.min(1, e / 0.4) * Math.PI * 2;
        p.item.outer.visible = true;
        setTransform(p.item, { ...tmp, rotY: lerp(p.start.rotY, p.end.rotY, k) + spin, rotZ: lerp(p.start.rotZ, 0, k), scale: lerp(p.start.scale, p.end.scale, k) });
        tint(p.item, lerp(1, 1 - Math.min(1, Math.abs(p.slot)), t));
      });
    }
    [-2, 2].forEach((o) => {
      const it = items[slotOf(o)];
      const s = slot(o, mobile), f = slot(o + Math.sign(o) * EXTRA_REACH, mobile), r = easeOutCubic(t);
      it.outer.visible = t > 0;
      setTransform(it, { x: lerp(f.x, s.x, r), y: lerp(f.y, s.y, r), z: lerp(f.z, s.z, r), rotY: s.rotY, rotZ: 0, scale: lerp(f.scale, s.scale, r) });
      tint(it, lerp(1, 1 - Math.min(1, Math.abs(o)), t));
    });
  }
  function ndcToWorld(x, y, z) {
    const v = new THREE.Vector3(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
    const d = (z - camera.position.z) / v.z;
    return camera.position.clone().add(v.multiplyScalar(d));
  }
  function detailAnchor() {
    if (!mobile) return DETAIL_POS.desktop;
    const space = document.querySelector(".detail-glass-space");
    if (space) {
      const r = space.getBoundingClientRect(), c = canvas.getBoundingClientRect();
      if (r.height > 0 && c.height > 0) return { x: 0, y: 1 - (2 * (r.top + r.height / 2 - c.top)) / c.height };
    }
    return DETAIL_POS.mobile;
  }
  function poseSlider(d) {
    const g = state.g, a = state.active, inK = pow3InOut(d), outK = pow2In(d);
    items.forEach((it, i) => {
      if (i === a) return;
      const o = wrap(i, g), s = slot(o, mobile), dir = Math.sign(o) || 1;
      it.outer.visible = d < 1 && s.visibility > 0;
      setTransform(it, { x: s.x + dir * 3.2 * outK, y: s.y, z: s.z, rotY: s.rotY, rotZ: 0, scale: s.scale });
      tint(it, 1 - Math.min(1, Math.abs(o)));
    });
    const it = items[a];
    const s = slot(wrap(a, g), mobile), anchor = detailAnchor(), w = ndcToWorld(anchor.x, anchor.y, 0);
    const sc = mobile ? (innerWidth >= 640 ? slot(0, true).scale : DETAIL_SCALE.mobile) : DETAIL_SCALE.desktop;
    it.outer.visible = true;
    setTransform(it, { x: lerp(s.x, w.x, inK), y: lerp(s.y, w.y, inK), z: lerp(s.z, 0, inK), rotY: lerp(s.rotY, 0, inK) + state.spin, rotZ: lerp(0, DETAIL_ROTZ, inK), scale: lerp(s.scale, sc, inK) });
    tint(it, 1);
  }

  let last = performance.now(), wordAlpha = 0;
  function frame() {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (canvas.getBoundingClientRect().bottom <= 0) return; // fuera de pantalla: no se dibuja
    state.pointerS.x += (state.pointer.x - state.pointerS.x) * 0.06;
    state.pointerS.y += (state.pointer.y - state.pointerS.y) * 0.06;
    if (state.entrance < 1) poseEntrance(state.entrance);
    else poseSlider(state.detail);
    const k = state.entrance < 1 ? 0.6 : 1;
    items.forEach((it) => {
      it.inner.rotation.y = state.pointerS.x * PARALLAX * k; it.inner.rotation.x = -state.pointerS.y * PARALLAX * 0.5 * k;
      it.model.userData.tick(dt);
    });
    wordAlpha = Math.min(1, wordAlpha + (state.loaded ? dt / 0.9 : 0));
    backdrop.draw(now / 1000, state.entrance, state.entrance >= 0.85 && state.detail === 0, wordAlpha);
    renderer.render(scene, camera);
  }

  // En móvil, al hacer scroll la barra del navegador aparece y desaparece y lanza «resize» sin
  // parar. Rehacer el lienzo (y el pase de transmisión y la textura del rótulo) en cada uno agotaba
  // la memoria de la GPU y el navegador cerraba la pestaña: solo se rehace si cambia el ancho o el
  // alto cambia de verdad (girar el móvil, redimensionar la ventana).
  let lastW = 0, lastH = 0;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === lastW && Math.abs(h - lastH) < 160) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    backdrop.resize();
    mobile = innerWidth < 960;
    heroLayout = mobile ? HERO_MOBILE : HERO_DESKTOP;
    paths = toSlider();
  }
  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { state.pointer.x = (e.clientX / innerWidth) * 2 - 1; state.pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  gsap.ticker.add(frame);

  let spinTween = null;
  let snapR = null, snapT = 0;
  return {
    state, ready: Promise.all([envReady, modelsReady]),
    playEntrance() { state.loaded = true; playEntrance(); },
    skipEntrance() { state.loaded = true; skipEntrance(); },
    setNoche(i) { backdrop.setColors(NOCHES[i].color, NOCHES[i].dark); },
    setEntrance(p) { if (p > 0.3 && !state.flown) skipEntrance(); state.entrance = p; },
    setDetail(p) {
      const v = clamp(p, 0, 1);
      if (v > 0 && state.detail === 0) { // al entrar al detalle se fija la copa central
        state.active = ((Math.round(state.g) % N) + N) % N;
        const t = nearest(state.g, state.active);
        if (Math.abs(t - state.g) > 0.001) gsap.to(state, { g: t, duration: 0.6, ease: "power3.out" });
      }
      state.detail = v;
    },
    // flechas / arrastre del carrusel
    step(dir, onSettle) {
      gsap.killTweensOf(state, "g");
      gsap.to(state, { g: Math.round(state.g) + dir, duration: 0.6, ease: "power3.out", onComplete: () => { state.active = ((Math.round(state.g) % N) + N) % N; onSettle?.(state.active); } });
    },
    dragBy(dx) { gsap.killTweensOf(state, "g"); state.g += dx; },
    endDrag(v, onSettle) {
      const target = Math.round(state.g + clamp(v * 0.12, -1.2, 1.2));
      const dur = clamp(0.4 + Math.min(Math.abs(v) * 0.05, 0.45), 0.4, 0.9);
      gsap.to(state, { g: target, duration: dur, ease: "power3.out", onComplete: () => { state.active = ((target % N) + N) % N; onSettle?.(state.active); } });
    },
    // en el detalle: giro completo y cambio de copa a mitad (Scene.js, Ye)
    swapTo(i, onMid) {
      if (i === state.active) return;
      spinTween?.progress(1);
      let switched = false; const r = { t: 0 };
      spinTween = gsap.to(r, {
        t: 1, duration: 1.15, ease: "power2.inOut",
        onUpdate: () => {
          state.spin = r.t * Math.PI * 2;
          if (!switched && r.t >= 0.5) { switched = true; gsap.killTweensOf(state, "g"); state.g = nearest(state.g, i); state.active = i; onMid?.(i); }
        },
        onComplete: () => { state.spin = 0; spinTween = null; },
      });
    },
    // Miniaturas con transparencia real: se pinta la copa sobre negro y sobre blanco y el alfa
    // sale de la diferencia (así el vidrio queda translúcido y no gris).
    // Un único renderer para todas las miniaturas (antes uno por miniatura: 7 contextos WebGL al
    // cargar, que en móvil pueden tumbar el principal); se libera cuando dejan de pedirse.
    snapshot(i, size = 360, rotZ = 0) {
      if (!snapR) snapR = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      const r = snapR; clearTimeout(snapT);
      r.setPixelRatio(1); r.setSize(size, size);
      r.toneMapping = renderer.toneMapping; r.toneMappingExposure = renderer.toneMappingExposure; r.outputColorSpace = renderer.outputColorSpace;
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      const s = new THREE.Scene(); s.environment = scene.environment;
      [key, fill, rimL, rimR].forEach((l) => { const c = l.clone(); if (l.target) { c.target.position.copy(l.target.position); s.add(c.target); } s.add(c); });
      s.add(new THREE.HemisphereLight(0xffffff, 0x1a0d24, 0.35));
      const m = buildGlass(NOCHES[i].glass, { still: true }); m.scale.setScalar(GLASS_FIT[NOCHES[i].glass] ?? 1); m.rotation.z = rotZ; useLiquidEnv(m); s.add(m);
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20); cam.position.set(0, 0, 2.35);
      const grab = (hex) => {
        r.setClearColor(hex, 1); r.render(s, cam);
        const c = document.createElement("canvas"); c.width = c.height = size;
        const g = c.getContext("2d"); g.drawImage(r.domElement, 0, 0);
        return g.getImageData(0, 0, size, size);
      };
      const black = grab(0x000000), white = grab(0xffffff), out = new ImageData(size, size);
      for (let p = 0; p < black.data.length; p += 4) {
        const d = ((white.data[p] - black.data[p]) + (white.data[p + 1] - black.data[p + 1]) + (white.data[p + 2] - black.data[p + 2])) / 3;
        const a = Math.max(0, Math.min(255, 255 - d)), k = a > 0 ? 255 / a : 0;
        out.data[p] = Math.min(255, black.data[p] * k); out.data[p + 1] = Math.min(255, black.data[p + 1] * k); out.data[p + 2] = Math.min(255, black.data[p + 2] * k); out.data[p + 3] = a;
      }
      const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").putImageData(out, 0, 0);
      s.traverse((o) => { if (o.isMesh && o.material?.userData?.isLiquid) o.material.dispose(); });
      snapT = setTimeout(() => { snapR.dispose(); snapR.forceContextLoss(); snapR = null; }, 1500);
      return c.toDataURL("image/png");
    },
  };
}
