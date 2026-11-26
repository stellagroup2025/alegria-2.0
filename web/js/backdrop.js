// Fondo de la intro pintado dentro de WebGL: el degradado de neón del hero, el resplandor de
// la noche activa y la palabra «Alegría». Al estar en la escena, el vidrio de las copas lo
// refracta de verdad (con un canvas transparente, Three.js refracta un gris plano).
import * as THREE from "three";

const NIGHT = "#0a0610";
const BLOBS = [ // mismos colores, posiciones (centro de cada círculo de 60vmax), opacidades y derivas que .neon-gradient
  { c: "#ff2fb3", at: (W, H, v) => [0.12 * v, 0.08 * v], a: 0.55, d: 22, o: 0 },
  { c: "#7b2cff", at: (W, H, v) => [W - 0.1 * v, 0.2 * v], a: 0.55, d: 26, o: -6 },
  { c: "#19e6ff", at: (W, H, v) => [0.2 * W + 0.3 * v, H + 0.08 * v], a: 0.38, d: 30, o: -12 },
  { c: "#ff3d3d", at: (W, H, v) => [W - 0.06 * v, H], a: 0.35, d: 24, o: -3 },
  { c: "#39ff88", at: (W, H, v) => [0.04 * v, H + 0.04 * v], a: 0.22, d: 34, o: -18 },
];
const clamp01 = (n) => Math.min(1, Math.max(0, n));
const mix = (a, b, k) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();

function blobSprite(color) {
  const s = 256, c = document.createElement("canvas"); c.width = c.height = s;
  const g = c.getContext("2d"), grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, color); grd.addColorStop(0.45, color + "88"); grd.addColorStop(1, color + "00");
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  return c;
}

export function createBackdrop(camera, { wordmark, wordmark2 }) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.renderOrder = -10;
  mesh.position.z = -2.4;
  const sprites = BLOBS.map((b) => blobSprite(b.c));
  let W = 0, H = 0, scale = 1, glowCache = null, glowKey = "";
  const colors = { noche: new THREE.Color("#ff2fb3"), dark: new THREE.Color("#8a0f5c"), tn: new THREE.Color("#ff2fb3"), td: new THREE.Color("#8a0f5c") };
  let glow = 0, flicker = 1, lastKey = "";

  function resize() {
    const dist = camera.position.z - mesh.position.z;
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    mesh.scale.set(h * camera.aspect, h, 1);
    scale = Math.min(1, 1400 / Math.max(innerWidth, innerHeight)); // textura ≤1400 px
    W = canvas.width = Math.round(innerWidth * scale);
    H = canvas.height = Math.round(innerHeight * scale);
    glowKey = "";
  }

  // ---- Rótulo «Alegría» + «2.0» ----
  // Se pintan una vez (tubos encendidos, tubos apagados y el 2.0 aparte) y en cada fotograma se
  // componen: al cargar se enciende letra a letra con chisporroteo; luego el 2.0 entra desde fuera
  // de la pantalla por arriba a la derecha, cae sobre el final de la palabra y la deja ladeada como un
  // balancín: la izquierda arriba y la derecha abajo, que es donde se posa el 2.0.
  const IGN = [0.25, 0.62, 0.4, 0.9, 0.5, 1.05, 0.75]; // segundo en que arranca cada letra
  const BLINK = [[0.05, 1], [0.07, 0.08], [0.04, 0.85], [0.11, 0], [0.06, 0.6], [0.05, 0.15]]; // (duración, brillo) antes de quedarse fija
  const IGN_END = Math.max(...IGN) + BLINK.reduce((n, [d]) => n + d, 0);
  const LAUNCH = 1.45, FLIGHT = 0.55, HIT = LAUNCH + FLIGHT, PERCH = 0.65, TILT = 5 * Math.PI / 180, TWO_ROT = -8 * Math.PI / 180, SLANT = 0.24;
  let introT0 = null, introPending = false;
  const letterAlpha = (i, s) => {
    let d = s - (IGN[i] ?? 0.2 + i * 0.12);
    if (d < 0) return 0;
    for (const [dur, a] of BLINK) { if (d < dur) return a; d -= dur; }
    return 1;
  };
  const easeOutBack = (k) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);

  function wordmarkGlow() {
    const r = wordmark.getBoundingClientRect(), cs = getComputedStyle(wordmark);
    const key = [r.width, r.height, r.left, r.top, cs.fontSize, W].join();
    if (key === glowKey) return glowCache;
    glowKey = key;
    const pad = 120 * scale, fs = parseFloat(cs.fontSize) * scale;
    const cw = Math.ceil(r.width * scale + pad * 2), ch = Math.ceil(r.height * scale + pad * 2);
    const main = wordmark.firstChild.textContent.trim(), w = fs * 0.03;
    const x0 = cw / 2 - (wordmark2 ? fs * 0.04 : 0), y0 = ch / 2 + fs * 0.04;
    const layer = (paint) => {
      const c = document.createElement("canvas"); c.width = cw; c.height = ch;
      const g = c.getContext("2d"); g.textAlign = "center"; g.textBaseline = "middle"; g.font = `400 ${fs}px Shrikhand`; g.lineJoin = g.lineCap = "round";
      paint(g); return c;
    };
    // encendido: halo ancho, halo, tubo rosa y núcleo casi blanco (lo que más brilla en un neón de
    // verdad); el interior de las letras queda hueco
    const lit = layer((g) => {
      [[0.24, w * 1.3, 0.5], [0.09, w, 0.9], [0.025, w, 1]].forEach(([blur, lw, a]) => {
        g.globalAlpha = a; g.shadowBlur = fs * blur; g.shadowColor = "#ff2fb3"; g.strokeStyle = "#ff2fb3"; g.lineWidth = lw; g.strokeText(main, x0, y0);
      });
      g.globalAlpha = 1; g.shadowBlur = fs * 0.02; g.shadowColor = "#fff"; g.strokeStyle = "#ffe6f6"; g.lineWidth = w * 0.38; g.strokeText(main, x0, y0);
    });
    // apagado: el tubo de vidrio sin gas, apenas visible
    const off = layer((g) => { g.strokeStyle = "rgba(255, 190, 230, 0.18)"; g.lineWidth = w * 0.9; g.strokeText(main, x0, y0); });
    // una columna inclinada por letra (la Shrikhand es cursiva) para encenderlas por separado
    const mg = lit.getContext("2d");
    let x = x0 - mg.measureText(main).width / 2;
    const chars = [...main], cols = chars.map((chr, i) => {
      const a = i ? x : -cw; x += mg.measureText(chr).width;
      return [a, i === chars.length - 1 ? cw * 2 : x];
    });
    const baseY = r.top * scale - pad + y0; // centro vertical de las letras en pantalla
    let two = null;
    if (wordmark2) {
      const r2 = wordmark2.getBoundingClientRect(), fs2 = parseFloat(getComputedStyle(wordmark2).fontSize) * scale;
      // mismo rótulo de neón que «Alegría» (contorno en tubo con núcleo claro), en cian
      const c = document.createElement("canvas"); c.width = Math.ceil(fs2 * 3.2); c.height = Math.ceil(fs2 * 2.2);
      const t = c.getContext("2d"); t.textAlign = "center"; t.textBaseline = "middle"; t.font = `400 ${fs2}px Shrikhand`; t.lineJoin = t.lineCap = "round";
      const w2 = Math.max(1.6 * scale, fs2 * 0.035), cx2 = c.width / 2, cy2 = c.height / 2 + fs2 * 0.04;
      [[0.3, w2 * 1.3, 0.5], [0.11, w2, 0.9], [0.03, w2, 1]].forEach(([bl, lw, a]) => {
        t.globalAlpha = a; t.shadowBlur = fs2 * bl; t.shadowColor = "#19e6ff"; t.strokeStyle = "#19e6ff"; t.lineWidth = lw; t.strokeText("2.0", cx2, cy2);
      });
      t.globalAlpha = 1; t.shadowBlur = fs2 * 0.025; t.shadowColor = "#fff"; t.strokeStyle = "#e6fdff"; t.lineWidth = w2 * 0.38; t.strokeText("2.0", cx2, cy2);
      two = { c, x: (r2.left + r2.width / 2) * scale, y: (r2.top + r2.height / 2) * scale - fs2 * 0.72, fs: fs2 }; // más arriba: que no pise la «a» ni la tilde
    }
    glowCache = {
      lit, off, cols, y0, ch, two, x: r.left * scale - pad, y: r.top * scale - pad,
      pivot: [(r.left + r.width * 0.5) * scale, baseY + fs * 0.3], // en el centro: balancín (izquierda sube, derecha baja)
      hit: [(r.right - r.width * 0.09) * scale, baseY - fs * 0.26 - (two ? two.fs * 0.45 : 0)], // sobre la última «a»
    };
    return glowCache;
  }

  function drawWordmark(t, wa, blur) {
    if (introPending) { introT0 = t; introPending = false; }
    const m = wordmarkGlow(), s = introT0 === null ? -1 : t - introT0;
    // parpadeo de neón cada 4,5 s (como la animación flicker del CSS), una vez acabada la entrada
    const cyc = (t % 4.5) / 4.5;
    flicker = s > HIT + 1 && cyc > 0.91 && cyc < 0.95 ? [0.55, 0.95, 0.7, 1][Math.floor((cyc - 0.91) / 0.01)] : 1;
    // el golpe: muelle amortiguado hasta quedar ladeada, sacudida y fogonazo
    const u = s - HIT;
    const ang = u <= 0 ? 0 : TILT * (1 - Math.exp(-4.5 * u) * Math.cos(13 * u));
    const bump = u <= 0 ? 0 : Math.exp(-6 * u) * Math.sin(22 * u) * 12 * scale; // el golpe empuja hacia abajo
    const flare = u <= 0 ? 0 : Math.exp(-7 * u);
    const [px, py] = m.pivot;
    if (blur) ctx.filter = `blur(${blur}px)`;
    ctx.save();
    ctx.translate(px, py + bump); ctx.rotate(ang); ctx.translate(-px, -py);
    ctx.globalAlpha = wa; ctx.drawImage(m.off, m.x, m.y);
    if (s >= IGN_END) { ctx.globalAlpha = wa * flicker; ctx.drawImage(m.lit, m.x, m.y); }
    else m.cols.forEach(([a, b], i) => {
      const la = letterAlpha(i, s);
      if (!la) return;
      const top = SLANT * m.y0, bot = SLANT * (m.ch - m.y0);
      ctx.save(); ctx.beginPath();
      ctx.moveTo(m.x + a + top, m.y); ctx.lineTo(m.x + b + top, m.y); ctx.lineTo(m.x + b - bot, m.y + m.ch); ctx.lineTo(m.x + a - bot, m.y + m.ch);
      ctx.clip(); ctx.globalAlpha = wa * la; ctx.drawImage(m.lit, m.x, m.y); ctx.restore();
    });
    if (flare > 0.01) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = wa * flare * 0.7; ctx.drawImage(m.lit, m.x, m.y); ctx.globalCompositeOperation = "source-over"; }
    ctx.restore();
    // el 2.0: cae acelerando desde arriba a la derecha, rebota y se posa sobre la palabra ya ladeada
    if (m.two && s > LAUNCH) {
      const T = m.two, [hx, hy] = m.hit, cos = Math.cos(ang), sin = Math.sin(ang);
      const fx = px + (T.x - px) * cos - (T.y - py) * sin, fy = py + bump + (T.x - px) * sin + (T.y - py) * cos;
      let x, y, rot, sc = 1;
      if (s < HIT) {
        const e = Math.pow((s - LAUNCH) / FLIGHT, 1.5), sx = W + T.c.width * 0.4, sy = -T.c.height * 0.6, cx = (sx + hx) / 2 + W * 0.04, cy = sy + (hy - sy) * 0.15;
        x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * hx;
        y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * hy;
        rot = 1.1 * (1 - e) - 0.35 * e;
      } else {
        const k = clamp01(u / PERCH), e = easeOutBack(k);
        x = hx + (fx - hx) * e; y = hy + (fy - hy) * e - Math.sin(Math.PI * k) * T.fs * 0.9;
        rot = -0.35 + (TWO_ROT + ang + 0.35) * e;
        sc = 1 + 0.3 * flare;
      }
      ctx.save(); ctx.globalAlpha = wa; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.drawImage(T.c, -T.c.width / 2, -T.c.height / 2); ctx.restore();
    }
    ctx.filter = "none";
  }

  function draw(t, h2g, wantGlow, wordAlpha) {
    colors.noche.lerp(colors.tn, 0.06); colors.dark.lerp(colors.td, 0.06);
    glow += ((wantGlow ? 0.85 : 0) - glow) * 0.08;
    // Solo se repinta (y se sube a la GPU) si algo cambia: en el hero los degradados se mueven
    // siempre; en el carrusel y el detalle, únicamente durante las transiciones de color o brillo.
    const heroVisible = h2g < 0.72;
    const key = [h2g.toFixed(3), colors.noche.getHexString(), colors.dark.getHexString(), glow.toFixed(3), wordAlpha.toFixed(2), W, H].join();
    if (!heroVisible && key === lastKey) return;
    lastKey = key;
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.filter = "none";
    ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
    const vmax = Math.max(W, H);
    // 1 · degradado de neón del hero
    const a = clamp01(1 - h2g * 1.4);
    if (a > 0) {
      const base = ctx.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, Math.max(W * 1.2, H * 0.9) * 0.6);
      base.addColorStop(0, "#2a0b3d"); base.addColorStop(1, NIGHT);
      ctx.globalAlpha = a; ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "screen";
      BLOBS.forEach((b, i) => {
        // keyframes drift (alternate): 0 → (8vw, 6vh, ×1.12) → (−6vw, −4vh, ×0.95)
        const p = (((t - b.o) / b.d) % 2 + 2) % 2, k = p < 1 ? p : 2 - p;
        const e = k < 0.5 ? k * 2 : (k - 0.5) * 2;
        const [x0, y0, s0, x1, y1, s1] = k < 0.5 ? [0, 0, 1, 0.08 * W, 0.06 * H, 1.12] : [0.08 * W, 0.06 * H, 1.12, -0.06 * W, -0.04 * H, 0.95];
        const ease = e * e * (3 - 2 * e);
        const [cx, cy] = b.at(W, H, vmax), size = 0.6 * vmax * 1.6 * (s0 + (s1 - s0) * ease); // ×1.6: el blur de 90px ensancha el halo
        ctx.globalAlpha = a * b.a;
        ctx.drawImage(sprites[i], cx + x0 + (x1 - x0) * ease - size / 2, cy + y0 + (y1 - y0) * ease - size / 2, size, size);
      });
      ctx.globalCompositeOperation = "source-over";
    }
    // 2 · fondo de la noche activa (.background-layer)
    const bAlpha = clamp01(h2g * 1.6);
    if (bAlpha > 0) {
      const cx = W / 2, cy = H * 0.58;
      ctx.save(); ctx.globalAlpha = bAlpha; ctx.translate(cx, cy); ctx.scale(W * 0.7, H * 0.7);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, mix(NIGHT, "#" + colors.noche.getHexString(), 0.55));
      g.addColorStop(0.38, mix(NIGHT, "#" + colors.dark.getHexString(), 0.7));
      g.addColorStop(0.82, NIGHT); g.addColorStop(1, NIGHT);
      ctx.fillStyle = g; ctx.fillRect(-2, -2, 4, 4); ctx.restore();
    }
    // 3 · resplandor central del carrusel (.center-glow)
    if (glow > 0.01) {
      const r = Math.min(0.7 * W, 900 * scale) / 2, cy = H * 0.54 + 20 * scale, hex = "#" + colors.noche.getHexString();
      const g = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, r);
      g.addColorStop(0, hex + "b3"); g.addColorStop(0.38, hex + "38"); g.addColorStop(0.68, hex + "00");
      ctx.globalAlpha = glow; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // 4 · la palabra del hero (con el desenfoque de --h2g)
    const wa = wordAlpha * clamp01(1 - h2g * 2);
    if (wa > 0.01 && document.fonts.check("40px Shrikhand")) drawWordmark(t, wa, h2g > 0.001 ? h2g * 14 * scale : 0);
    ctx.globalAlpha = 1;
    tex.needsUpdate = true;
  }

  resize();
  return {
    mesh, resize, draw,
    startIntro() { introPending = true; },
    skipIntro() { introPending = false; introT0 = -1e6; },
    setColors(hex, dark) { colors.tn.set(hex); colors.td.set(dark); },
  };
}
