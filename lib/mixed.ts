import { clamp } from "./ascii";
import { type BloomSpec, buildBloom, type PetalSpec, poseBloom } from "./bloom";
import { buildHead, type HeadSpec, LEAVES, poseHead } from "./hydrangea";
import {
  type BouquetOf, buildFlower, buildStatics, CAM, type LilySpec, MID, mulberry32, PointBuffer, poseFlower, poseStatics, type RGB, type StaticAdd,
} from "./lily";

/** Uma flor de qualquer tipo, com a pose guardada num fecho. */
export interface Mixed {
  cx: number;
  cy: number;
  cz: number;
  yaw: number;
  pitch: number;
  delay: number;
  sid: number;
  stemBack?: boolean;
  thick?: boolean;
  pose: (open: number, P: number, t: number, term: number, gate: number, out: PointBuffer) => void;
}

const TAU = Math.PI * 2;

const smoothstep01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function sunflower(x: number, y: number, z: number, size: number, yaw: number, roll: number): BloomSpec {
  const petals: PetalSpec[] = [];
  for (const ring of [0, 1]) {
    const n = 21;
    for (let i = 0; i < n; i++) {
      petals.push({
        az: ((i + ring * 0.5) / n) * TAU,
        len: ring ? 0.15 : 0.165,
        wid: 0.021,
        th0c: 0.1,
        th0o: ring ? 1.3 : 1.42,
        curl: 0.35,
        oMax: 1,
        start: (((i * 7 + ring * 3) % n) / n) * 0.45,
        span: 0.17,
        rc: 0.1,
        zoff: ring ? -0.012 : 0,
        r0: 0.08,
        center: [240, 168, 18],
        base: ring ? [255, 190, 25] : [255, 206, 36],
        tip: ring ? [244, 164, 14] : [250, 186, 20],
        rib: 0.35,
        dark: ring ? 0.05 : 0,
      });
    }
  }
  return {
    x, y, z, size, yaw, pitch: 0.3, roll, petals, round: false, cup: 2,
    disc: { radius: 0.085, count: 900, inner: [60, 34, 12], mid: [106, 62, 20], rim: [170, 132, 30] },
  };
}

function rose(x: number, y: number, z: number, size: number, yaw: number, roll: number): BloomSpec {
  const petals: PetalSpec[] = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    petals.push({
      az: i * 2.399963,
      len: 0.055 + 0.085 * f,
      wid: 0.03 + 0.034 * f,
      th0c: 0.06 + 0.04 * f,
      th0o: 0.12 + 0.95 * Math.pow(f, 1.3),
      curl: 0.7 * f * f * f,
      oMax: smoothstep01(0.3, 0.95, f) * 0.95,
      start: (1 - f) * 0.4,
      span: 1.25,
      rc: 0.02 + 0.05 * f,
      zoff: -0.03 * f,
      r0: 0.004,
      center: [92, 0, 12],
      base: [176, 12, 30],
      tip: [216, 36, 54],
      rib: 0.06,
      dark: 0.14 * (1 - f),
    });
  }
  const green: RGB = [78, 138, 60];
  for (let k = 0; k < 5; k++) {
    petals.push({
      az: (k / 5) * TAU + 0.3, len: 0.075, wid: 0.014, th0c: 0.25, th0o: 2.1, curl: 0.3, oMax: 1, start: 0, span: 0.5, rc: 0.03,
      zoff: -0.03, r0: 0.01, center: [70, 120, 55], base: green, tip: [60, 110, 50], rib: 0.1, dark: 0,
    });
  }
  return { x, y, z, size, yaw, pitch: 0.25, roll, petals, round: true, cup: 14, sp: 0.0036 };
}

/** Margarida pequena e colorida, de miolo amarelo. */
function daisy(x: number, y: number, z: number, yaw: number, pitch: number, roll: number, color: RGB): BloomSpec {
  const n = 15;
  const light = color.map((c) => c + (255 - c) * 0.45) as unknown as RGB;
  const petals: PetalSpec[] = Array.from({ length: n }, (_, i) => ({
    az: (i / n) * TAU,
    len: 0.085,
    wid: 0.0155,
    th0c: 0.1,
    th0o: 1.45,
    curl: 0.12,
    oMax: 1,
    start: (((i * 7) % n) / n) * 0.4,
    span: 0.2,
    rc: 0.036,
    zoff: 0,
    r0: 0.03,
    center: light,
    base: color,
    tip: color,
    rib: 0.2,
    dark: 0,
  }));
  return {
    x, y, z, size: 0.58, yaw, pitch, roll, petals, round: false, cup: 2,
    disc: { radius: 0.032, count: 130, inner: [196, 126, 10], mid: [244, 188, 30], rim: [255, 216, 64] },
  };
}

// ── Composição ────────────────────────────────────────────────────────────────
// Buquê de mão visto de frente: as flores ficam numa cúpula. No centro a cúpula
// avança para o espectador (z maior) e nas bordas recua; as flores se inclinam
// para fora conforme a posição. As margaridas ocupam os maiores vãos.
const DOME = { cy: 0.62, a: 0.55, b: 0.42 };
const domeZ = (x: number, y: number) => 0.34 * Math.max(0, 1 - (x / DOME.a) ** 2 - ((y - DOME.cy) / DOME.b) ** 2);
const lean = (x: number, y: number) => ({
  yaw: clamp((x / DOME.a) * 0.9, -1, 1),
  pitch: clamp(0.25 + ((y - DOME.cy) / DOME.b) * 0.35, -0.1, 0.7),
});
const at = (x: number, y: number, zBoost = 0) => ({ x, y, z: domeZ(x, y) + zBoost, ...lean(x, y) });

interface Focal {
  x: number;
  y: number;
  z: number;
  r: number; // raio aproximado na tela (unidades do modelo): mantém as margaridas afastadas
}

const SUN = at(0.0, 0.88);
const ROSE = at(0.0, 0.6);
const LILY_POS = at(-0.42, 0.66);
const HEAD_POS = at(0.43, 0.66);
const TULIP_POS = at(-0.17, 0.4, 0.08);

const FOCALS: Focal[] = [
  { ...SUN, r: 0.27 },
  { ...ROSE, r: 0.18 },
  { ...LILY_POS, r: 0.24 },
  { ...HEAD_POS, r: 0.17 },
  { ...TULIP_POS, r: 0.15 },
];

const SUNFLOWERS = [sunflower(SUN.x, SUN.y, SUN.z, 1.15, SUN.yaw, 0.4)];
const ROSES = [rose(ROSE.x, ROSE.y, ROSE.z, 1.3, ROSE.yaw, 0.0)];
const LILIES: LilySpec[] = [{ x: LILY_POS.x, y: LILY_POS.y, z: LILY_POS.z, size: 1.1, yaw: LILY_POS.yaw, pitch: 0.3, roll: 0.5, pal: "branco" }];
const TULIPS: LilySpec[] = [
  { x: TULIP_POS.x, y: TULIP_POS.y, z: TULIP_POS.z, size: 1.35, yaw: TULIP_POS.yaw, pitch: 1.15, roll: 0.0, pal: "roxo", ls: 1.0, maxOpen: 0.2, round: true },
];
const HEADS: HeadSpec[] = [
  { x: HEAD_POS.x, y: HEAD_POS.y, z: HEAD_POS.z, size: 1.05, yaw: HEAD_POS.yaw, pitch: HEAD_POS.pitch, roll: 0.5, flat: 0.88, pal: "azul" },
];

const DAISY_COUNT = 10;
const DAISY_Z = 0.48; // à frente de qualquer flor grande: nunca ficam atrás
const DAISY_R = 0.056; // raio da margarida
const GAP = 0.004; // folga mínima até as outras flores
const DAISY_COLORS: RGB[] = [
  [255, 112, 170], [118, 188, 255], [255, 150, 48], [190, 146, 244], [252, 252, 252], [232, 96, 190], [255, 98, 88], [255, 190, 70],
];

/** Escolhe as posições da cúpula mais distantes de todas as flores grandes e entre si (farthest-point). */
function placeDaisies(): { x: number; y: number }[] {
  const proj = (x: number, y: number, z: number) => {
    const k = CAM / (CAM - z);
    return { px: x * k, py: (y - MID) * k + MID, k };
  };
  const focals = FOCALS.map((f) => {
    const p = proj(f.x, f.y, f.z);
    return { px: p.px, py: p.py, r: f.r * p.k };
  });
  const rd = DAISY_R * (CAM / (CAM - DAISY_Z));
  const chosen: { x: number; y: number; px: number; py: number }[] = [];
  const cands: { x: number; y: number; px: number; py: number }[] = [];
  for (let x = -0.46; x <= 0.46; x += 0.02) {
    for (let y = 0.16; y <= 0.9; y += 0.02) {
      // dentro de uma elipse um pouco maior que a cúpula: as margaridas ficam no corpo do buquê
      if ((x / 0.34) ** 2 + ((y - 0.56) / 0.4) ** 2 > 1) continue;
      const p = proj(x, y, DAISY_Z);
      if (focals.every((f) => Math.hypot(f.px - p.px, f.py - p.py) >= f.r + rd + GAP)) cands.push({ x, y, px: p.px, py: p.py });
    }
  }
  for (let n = 0; n < DAISY_COUNT; n++) {
    let best = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      let ok = true;
      for (const o of chosen) {
        if (Math.hypot(o.px - c.px, o.py - c.py) < 2 * rd + 0.008) {
          ok = false;
          break;
        }
      }
      // empacota rente ao centro do feixe: quanto mais perto do miolo, melhor
      const d = -(1.6 * c.x * c.x + 0.45 * (c.y - 0.56) ** 2);
      if (ok && d > bestScore) {
        bestScore = d;
        best = i;
      }
    }
    if (best < 0) break;
    chosen.push(cands[best]);
  }
  return chosen;
}

const DAISIES = placeDaisies().map((p, i) => {
  const l = lean(p.x, p.y);
  return daisy(p.x, p.y, DAISY_Z, l.yaw, l.pitch, i * 1.7, DAISY_COLORS[i % DAISY_COLORS.length]);
});

/** Fita de cetim amarrando os talos, com laço e pontas caídas. */
function ribbon(add: StaticAdd, sid: number, rnd: () => number) {
  const Y0 = 0.2;
  const R = 0.075;
  const satin = (shade: number): RGB => [200 + 50 * shade, 52 + 70 * shade, 108 + 60 * shade];
  // faixa em volta do feixe
  for (let i = 0; i < 1500; i++) {
    const a = rnd() * TAU;
    const h = rnd();
    const shade = 0.5 + 0.5 * Math.cos(a - 0.9);
    add(R * Math.cos(a), Y0 + h * 0.05, R * Math.sin(a), sid, satin(shade), 0.55 + 0.3 * shade, 0, 0.12);
  }
  const Z = R + 0.015;
  // alças do laço: coroas elípticas inclinadas
  for (const dir of [-1, 1]) {
    const cx = dir * 0.062;
    const tilt = dir * 0.35;
    for (let i = 0; i < 520; i++) {
      const t = rnd() * TAU;
      const s = rnd();
      const k = 1 - 0.3 * s;
      const ex = 0.058 * k * Math.cos(t);
      const ey = 0.034 * k * Math.sin(t);
      const x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
      const y = Y0 + 0.032 + ex * Math.sin(tilt) + ey * Math.cos(tilt);
      add(x, y, Z + 0.01 * (1 - s), sid, satin(0.4 + 0.5 * (1 - s)), 0.6 + 0.3 * (1 - s), 0, 0.13);
    }
  }
  // pontas
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 420; i++) {
      const v = rnd();
      const u = rnd() * 2 - 1;
      const w = 0.011 * (0.7 + 0.5 * v);
      add(dir * (0.012 + 0.045 * v) + u * w, Y0 + 0.02 - 0.14 * v, Z + 0.004, sid, satin(0.35 + 0.3 * Math.abs(u)), 0.55 + 0.25 * v, 0, 0.14);
    }
  }
  // nó
  for (let i = 0; i < 90; i++) {
    const t = rnd() * TAU;
    const s = Math.sqrt(rnd());
    add(0.017 * s * Math.cos(t), Y0 + 0.032 + 0.017 * s * Math.sin(t), Z + 0.016, sid, satin(0.9), 0.85, 0, 0.14);
  }
}

/** Girassol, rosa, tulipa, hortênsia e lírio numa cúpula, com margaridas nos vãos e fita de cetim. */
export function buildMixed(seed = 31): BouquetOf<Mixed> {
  const rnd = mulberry32(seed);
  const ytop = Math.max(...FOCALS.map((f) => f.y), ...DAISIES.map((f) => f.y));
  const flowers: Mixed[] = [];
  const caps: number[] = [];
  const add = (f: Pick<Mixed, "cx" | "cy" | "cz" | "yaw" | "pitch" | "delay" | "stemBack" | "thick">, n: number, pose: Mixed["pose"]) => {
    flowers.push({ cx: f.cx, cy: f.cy, cz: f.cz, yaw: f.yaw, pitch: f.pitch, delay: f.delay, stemBack: f.stemBack, thick: f.thick, sid: flowers.length, pose });
    caps.push(n);
  };
  const sid = () => flowers.length;
  const addBloom = (spec: BloomSpec, thick = false) => {
    const bl = buildBloom(spec, ytop, rnd, sid());
    add(
      { cx: bl.cx, cy: bl.cy, cz: bl.cz, yaw: bl.yaw, pitch: bl.pitch, delay: bl.delay, thick },
      bl.n + bl.dn,
      (o, P, t, term, g, out) => poseBloom(bl, o, P, t, term, g, out),
    );
  };

  for (const spec of [...SUNFLOWERS, ...ROSES]) addBloom(spec);
  for (const spec of [...LILIES, ...TULIPS]) {
    const f = buildFlower(spec, ytop, rnd, sid());
    add({ cx: f.cx, cy: f.cy, cz: f.cz, yaw: f.yaw, pitch: f.pitch, delay: f.delay }, f.n + f.m, (o, P, t, term, g, out) => poseFlower(f, o, P, t, term, g, out));
  }
  for (const spec of HEADS) {
    const h = buildHead(spec, ytop, rnd, sid());
    add({ cx: h.cx, cy: h.cy, cz: h.cz, yaw: h.yaw, pitch: h.pitch, delay: h.delay }, h.n, (o, P, t, term, g, out) => poseHead(h, o, P, t, term, g, out));
  }
  // Margaridas por último: só os talos das flores grandes recebem folhas.
  const mainCount = flowers.length;
  for (const spec of DAISIES) addBloom(spec, true);

  const statics = buildStatics(flowers, ytop, rnd, { ...LEAVES, stemPool: mainCount }, ribbon);
  const capacity = statics.n + caps.reduce((a, b) => a + b, 0);
  const bq: BouquetOf<Mixed> = { flowers, statics, stems: flowers.length + 1, capacity, bounds: { xmin: 0, xmax: 0, ymin: 0, ymax: 0 } };

  const tmp = new PointBuffer(capacity);
  poseStatics(statics, 2, 0, new Float32Array(bq.stems), 0, tmp);
  for (const f of flowers) f.pose(1, 2, 0, 0, 0, tmp);
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (let i = 0; i < tmp.n; i++) {
    xmin = Math.min(xmin, tmp.x[i]);
    xmax = Math.max(xmax, tmp.x[i]);
    ymin = Math.min(ymin, tmp.y[i]);
    ymax = Math.max(ymax, tmp.y[i]);
  }
  bq.bounds = { xmin, xmax, ymin, ymax };
  return bq;
}

export const poseMixed = (f: Mixed, open: number, P: number, t: number, term: number, gate: number, out: PointBuffer) =>
  f.pose(open, P, t, term, gate, out);
