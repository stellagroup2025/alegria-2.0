// Copas: modelos GLB generados con Higgsfield (imagen fotorrealista → Hunyuan3D) y optimizados
// con gltf-transform (meshopt + webp). El GLB es una sola superficie con el líquido pintado por fuera
// del cáliz. Dos tratamientos:
//  · VOLUMEN (balón, martini): lo pintado del color del líquido pasa a ser vidrio fino y dentro se
//    añade un volumen de líquido de verdad (torneado con el perfil del propio modelo) que refracta y
//    tiñe lo que hay detrás. La guarnición (piel de naranja, limón) sigue opaca.
//  · HÍBRIDO (resto): vidrio real allí donde la textura es gris y color donde está saturada.
// Altura normalizada a 1 y centrada (como la lata de YAAS).
import * as THREE from "three";
import { GLTFLoader } from "../assets/vendor/GLTFLoader.js";
import { MeshoptDecoder } from "../assets/vendor/meshopt_decoder.module.js";

const FILES = { highball: "viejoteca", balon: "dj", martini: "karaoke", margarita: "salsa", coupe: "cumple" };
// Cuánta luz deja pasar el líquido (0 = opaco): el gin-tonic y el cava son casi transparentes;
// el daiquiri, granizado, no deja pasar nada.
const CLARITY = { highball: 0.45, balon: 0.5, martini: 0.35, margarita: 0, coupe: 0.62 };
// Copas con volumen de líquido: alturas (0 = pie, 1 = borde superior del modelo) entre las que va
// el líquido, color y distancia a la que absorbe la luz (más corta = más intenso).
const LIQUID = {
  balon: { from: 0.465, to: 0.9, color: 0x2aa7e6, tint: 0xb4e2ff, absorb: 0.6 },
  martini: { from: 0.5, to: 0.875, color: 0xe0245e, tint: 0xffd6e2, absorb: 0.18 },
};
const templates = {};

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, mx ? d / mx : 0, mx];
};

function readTexture(src) {
  const img = src.map.image, w = img.width, h = img.height;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0);
  return { c, x, w, h, d: x.getImageData(0, 0, w, h) };
}
function canvasTexture(data, w, h, srgb) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(c); t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Fresnel y brillo propio en las zonas de color (líquido pintado o guarnición): más oscuro de frente
// y más luminoso en los bordes rasantes, como a contraluz en la barra.
const LIQUID_GLSL = `
  float lqF = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 1.6);
  outgoingLight = mix(outgoingLight, mix(outgoingLight * 0.72, outgoingLight * 1.3, lqF), lqK);
  outgoingLight += diffuseColor.rgb * lqK * (0.22 + 0.3 * lqF);`;

// Mapa de transmisión a partir del color: saturación baja → vidrio (1), alta → líquido (CLARITY).
// El gris con que viene pintado el vidrio se aclara para no oscurecer lo que se ve a través.
function hybridMaterial(src, clarity = 0) {
  const { x, w, h, d } = readTexture(src), t = new ImageData(w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2], [, sat, mx] = hsv(r, g, b);
    const glass = Math.max(0, Math.min(1, 1 - (sat - 0.12) / 0.18)) * (mx > 40 ? 1 : 0.4); // el negro (pajita) no es vidrio
    t.data[i] = t.data[i + 1] = t.data[i + 2] = (glass + (1 - glass) * clarity) * 255; t.data[i + 3] = 255;
    d.data[i] = r + (245 - r) * glass; d.data[i + 1] = g + (248 - g) * glass; d.data[i + 2] = b + (255 - b) * glass;
  }
  x.putImageData(d, 0, 0);
  // Material nuevo: el del GLB (KHR_materials_specular) rompe el sombreador de transmisión en r160.
  const m = new THREE.MeshPhysicalMaterial({
    map: canvasTexture(d, w, h, true), normalMap: src.normalMap, transmission: 1, transmissionMap: canvasTexture(t, w, h),
    thickness: 0.04, ior: 1.5, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.75,
  });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", `
      float lqK = 1.0 - smoothstep(0.85, 1.0, material.transmission); // todo lo que no es vidrio puro
      ${LIQUID_GLSL}
      #include <opaque_fragment>`);
  };
  return m;
}

// Vidrio fino para las copas con volumen: no usa transmisión (si no, taparía el líquido, que sí la
// usa) sino transparencia con los reflejos sumados enteros, más opaco en los bordes (Fresnel).
// Lo del color del líquido y lo gris es vidrio; lo saturado de otro tono (guarnición) queda opaco.
function shellMaterial(src) {
  const { w, h, d } = readTexture(src), a = new ImageData(w, h);
  // Tono dominante entre los píxeles saturados = el líquido pintado.
  const hist = new Float32Array(36);
  for (let i = 0; i < d.data.length; i += 16) { const [hu, s, v] = hsv(d.data[i], d.data[i + 1], d.data[i + 2]); if (s > 0.35 && v > 60) hist[Math.floor(hu / 10) % 36]++; }
  const liquidHue = hist.indexOf(Math.max(...hist)) * 10 + 5;
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2], [hu, sat, mx] = hsv(r, g, b);
    const dh = Math.min(Math.abs(hu - liquidHue), 360 - Math.abs(hu - liquidHue));
    const grey = 1 - Math.max(0, Math.min(1, (sat - 0.12) / 0.18));
    const liquid = 1 - Math.max(0, Math.min(1, (dh - 22) / 14));
    const glass = mx < 40 ? 0 : Math.max(grey, liquid);
    a.data[i] = a.data[i + 1] = a.data[i + 2] = (1 - glass) * 255; a.data[i + 3] = 255;
    d.data[i] = r + (240 - r) * glass; d.data[i + 1] = g + (244 - g) * glass; d.data[i + 2] = b + (250 - b) * glass;
  }
  const m = new THREE.MeshPhysicalMaterial({
    map: canvasTexture(d, w, h, true), alphaMap: canvasTexture(a, w, h), normalMap: src.normalMap, transparent: true, depthWrite: false,
    roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.1,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, // color premultiplicado
  });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <alphamap_fragment>", `
        float lqK = texture2D(alphaMap, vAlphaMapUv).g; // 1 = guarnición opaca, 0 = vidrio
        float glF = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normalize(vNormal))), 0.0, 1.0), 2.2);
        diffuseColor.a = mix(0.05 + 0.5 * glF, 1.0, lqK);
        diffuseColor.rgb *= mix(0.12 * diffuseColor.a, 1.0, lqK); // el vidrio apenas difunde: solo refleja`)
      .replace("#include <opaque_fragment>", `${LIQUID_GLSL}
        gl_FragColor = vec4(outgoingLight, diffuseColor.a);`);
  };
  return m;
}

// Volumen de líquido torneado con el perfil interior del cáliz: para cada altura, el radio exterior
// es la mediana de los máximos por sectores (así la guarnición de un lado no lo deforma).
function liquidMesh(root, cfg) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), H = box.max.y - box.min.y, pts = [], v = new THREE.Vector3();
  root.traverse((o) => { if (o.isMesh) { const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); pts.push(v.x, (v.y - box.min.y) / H, v.z); } } });
  let cx = 0, cz = 0, n = 0;
  for (let i = 0; i < pts.length; i += 3) if (pts[i + 1] < 0.06) { cx += pts[i]; cz += pts[i + 2]; n++; }
  cx /= n; cz /= n;
  const B = 80, S = 24, sec = Array.from({ length: B }, () => new Float32Array(S));
  for (let i = 0; i < pts.length; i += 3) {
    const b = Math.min(B - 1, Math.floor(pts[i + 1] * B)), dx = pts[i] - cx, dz = pts[i + 2] - cz;
    const s = Math.floor((Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI) * S) % S;
    sec[b][s] = Math.max(sec[b][s], Math.hypot(dx, dz));
  }
  const prof = sec.map((a) => Array.from(a).sort((p, q) => p - q)[S >> 1]);
  const radius = (y) => { const f = y * B - 0.5, i = Math.max(0, Math.min(B - 2, Math.floor(f))), t = Math.min(1, Math.max(0, f - i)); return prof[i] + (prof[i + 1] - prof[i]) * t; };
  const wall = 0.012 * H, steps = 28, line = [new THREE.Vector2(0, cfg.from * H)];
  for (let k = 0; k <= steps; k++) { const y = cfg.from + (cfg.to - cfg.from) * k / steps; line.push(new THREE.Vector2(Math.max(0.002 * H, radius(y) * 0.96 - wall), y * H)); }
  const top = line[line.length - 1];
  line.push(new THREE.Vector2(top.x * 0.97, top.y + 0.003 * H), new THREE.Vector2(0, top.y + 0.003 * H)); // menisco
  const geo = new THREE.LatheGeometry(line, 64);
  const mat = new THREE.MeshPhysicalMaterial({
    color: cfg.tint, emissive: cfg.color, emissiveIntensity: 0.08, roughness: 0.06, metalness: 0, ior: 1.34,
    transmission: 1, thickness: radius((cfg.from + cfg.to) / 2) * 1.6, attenuationColor: cfg.color, attenuationDistance: cfg.absorb * H,
    specularIntensity: 0.4, envMapIntensity: 0.35, // pegado al vidrio: casi no refleja, eso lo hace el vidrio
  });
  mat.userData.isLiquid = true; mat.userData.color = cfg.color;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, box.min.y, cz);
  return mesh;
}

export function loadGlasses(base = "") {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return Promise.all(Object.entries(FILES).map(([type, file]) =>
    loader.loadAsync(`${base}assets/models/${file}.glb`).then((gltf) => {
      const root = gltf.scene, liquid = LIQUID[type];
      if (liquid) root.add(liquidMesh(root, liquid));
      root.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.material.userData.isLiquid) { o.material = liquid ? shellMaterial(o.material) : hybridMaterial(o.material, CLARITY[type]); o.castShadow = o.receiveShadow = true; }
        if (liquid && !o.material.userData.isLiquid) o.renderOrder = 1; // el vidrio, después del líquido
      });
      const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      root.position.sub(center);
      const norm = new THREE.Group(); norm.add(root); norm.scale.setScalar(1 / size.y);
      templates[type] = norm;
    })
  ));
}

// Para las imágenes fijas (miniaturas, contacto) el líquido no puede usar transmisión: se recortan
// por diferencia negro/blanco y el líquido refractaría ese fondo plano (sale oscuro o macizo).
// Ahí va translúcido por mezcla, con el mismo Fresnel y brillo propio que el líquido pintado.
function stillLiquid(color) {
  const m = new THREE.MeshPhysicalMaterial({
    color, emissive: color, emissiveIntensity: 0.1, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.5, envMapIntensity: 0.6, clearcoat: 1,
  });
  m.userData.isLiquid = true;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", `
      float lqK = 1.0;
      ${LIQUID_GLSL}
      diffuseColor.a = mix(diffuseColor.a, 0.97, smoothstep(0.0, 0.7, lqF)); // más denso en los bordes, donde se atraviesa más líquido
      #include <opaque_fragment>`);
  };
  return m;
}

export function buildGlass(type, { still = false } = {}) {
  const root = new THREE.Group();
  const copy = templates[type].clone(true);
  const materials = [];
  copy.traverse((o) => {
    if (!o.isMesh) return;
    const src = o.material;
    if (still && src.userData.isLiquid && src.userData.color !== undefined) o.material = stillLiquid(src.userData.color);
    else { o.material = src.clone(); o.material.onBeforeCompile = src.onBeforeCompile; } // clone() no copia onBeforeCompile
    materials.push(o.material);
  });
  root.add(copy);
  root.userData.materials = materials; // para atenuar las copas que no están en el centro
  root.userData.tick = () => {};
  return root;
}
