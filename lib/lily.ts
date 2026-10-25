import { smoothstep, SWAY_AMP } from "./animation";
import { clamp } from "./ascii";

export type RGB = readonly [number, number, number];

interface Palette {
  base: RGB; // cor da ponta da pétala
  center: RGB; // cor perto do miolo
  spots: boolean;
}

export const PALETTES = {
  vermelho: { base: [208, 22, 38], center: [255, 190, 80], spots: true },
  rosa: { base: [226, 52, 140], center: [255, 214, 168], spots: true },
  dourado: { base: [247, 178, 22], center: [255, 244, 170], spots: true },
  creme: { base: [252, 220, 186], center: [255, 246, 176], spots: false },
  vinho: { base: [120, 14, 48], center: [236, 150, 72], spots: true },
  branco: { base: [250, 250, 246], center: [226, 236, 150], spots: false },
  roxo: { base: [110, 42, 168], center: [178, 124, 216], spots: false },
} satisfies Record<string, Palette>;

// Posição (x, y, z do modelo; y para cima, z para o espectador) e pose de cada lírio.
export interface LilySpec {
  x: number; y: number; z: number; size: number; yaw: number; pitch: number; roll: number; pal: keyof typeof PALETTES;
  ls?: number; // comprimento das pétalas (1 = lírio)
  maxOpen?: number; // limite da abertura (tulipa fica em taça)
  round?: boolean; // pétala de ponta arredondada
}

const SPECS: LilySpec[] = [
  { x: 0.02, y: 0.88, z: 0.05, size: 1.0, yaw: 0.05, pitch: 0.45, roll: 0.2, pal: "vermelho" },
  { x: -0.31, y: 0.76, z: 0.1, size: 0.95, yaw: -0.55, pitch: 0.25, roll: 1.0, pal: "rosa" },
  { x: 0.31, y: 0.78, z: 0.08, size: 0.95, yaw: 0.55, pitch: 0.3, roll: 0.5, pal: "dourado" },
  { x: -0.12, y: 0.62, z: 0.22, size: 0.88, yaw: -0.2, pitch: 0.1, roll: 2.0, pal: "creme" },
  { x: 0.17, y: 0.61, z: 0.24, size: 0.85, yaw: 0.25, pitch: 0.12, roll: 0.8, pal: "vinho" },
  { x: -0.46, y: 0.54, z: 0.0, size: 0.8, yaw: -1.0, pitch: 0.1, roll: 0.3, pal: "vermelho" },
  { x: 0.47, y: 0.56, z: 0.0, size: 0.8, yaw: 1.0, pitch: 0.2, roll: 1.4, pal: "rosa" },
  { x: 0.0, y: 0.46, z: 0.32, size: 0.72, yaw: 0.1, pitch: -0.05, roll: 0.0, pal: "dourado" },
];

export const CAM = 3.4; // distância da câmera (perspectiva)
export const MID = 0.5; // altura do ponto de fuga
const SP = 0.0033; // espaçamento entre amostras (unidades do modelo)
const N = 16; // segmentos da linha central da pétala
const LP = [0.215, 0.2]; // comprimento: externa, interna
const WP = [0.036, 0.046]; // meia-largura
const BR = [(1.7 * WP[0]) / WP[0], (1.7 * WP[0] * 0.82) / WP[1]]; // raio do botão por perfil de pétala
const SL = [0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.15]; // comprimento dos estames e do pistilo
const SAZ = [0, 1, 2, 3, 4, 5, 0].map((k, i) => (i < 6 ? k * (Math.PI / 3) + Math.PI / 6 : 0));
const LX = -0.4;
const LY = 0.58;
const LZ = 0.55;
const LEN = Math.hypot(LX, LY, LZ);
export const LIGHT: RGB = [LX / LEN, LY / LEN, LZ / LEN];
const RIB: RGB = [255, 238, 214];
const G0: RGB = [46, 125, 50];
const G1: RGB = [156, 204, 101];

export interface Flower {
  cx: number;
  cy: number;
  cz: number;
  size: number;
  yaw: number;
  pitch: number;
  roll: number;
  ls: number;
  maxOpen: number;
  h: number; // altura relativa (peso do balanço)
  gKey: number; // progresso do crescimento em que o botão aparece
  delay: number; // atraso da abertura (s)
  phase: number;
  sid: number; // talo (índice do balanço)
  n: number;
  u: Float32Array;
  v: Float32Array;
  w: Float32Array;
  pid: Uint8Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  pl: Float32Array;
  wv: Float32Array; // ondulação da pétala (-1..1)
  m: number;
  ms: Float32Array;
  ml: Float32Array;
  mk: Uint8Array;
  mr: Uint8Array;
  mg: Uint8Array;
  mb: Uint8Array;
  mp: Float32Array;
}

export interface Statics {
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  grow: Float32Array;
  hw: Float32Array; // peso do balanço (altura^1,5)
  sid: Uint8Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  lum: Float32Array;
  ch: Uint8Array; // 0 = caractere pelo brilho; senão o código do caractere
  ph: Float32Array;
}

export interface BouquetOf<F> {
  flowers: F[];
  statics: Statics;
  stems: number; // talos + o "talo" da touceira de folhas
  capacity: number;
  bounds: { xmin: number; xmax: number; ymin: number; ymax: number };
}
export type Bouquet = BouquetOf<Flower>;

/** O que o componente precisa para animar um buquê: construir e posar uma flor. */
export interface Engine<F extends { delay: number; sid: number }> {
  build: () => BouquetOf<F>;
  poseFlower: (f: F, open: number, P: number, t: number, term: number, gate: number, out: PointBuffer) => void;
}

/** Forma e quantidade das folhas. */
export interface LeafStyle {
  stem: number; // folhas ao longo dos talos
  base: number; // folhas da touceira
  stemLen: [number, number]; // [mín, variação]
  stemW: [number, number];
  baseLen: [number, number];
  baseW: [number, number];
  stemLean: [number, number];
  baseLean: [number, number];
  droop: [number, number];
  ovate: boolean; // folha larga, de borda serrilhada
  spacing: number;
  attach?: [number, number]; // onde nascem no talo (0 base .. 1 flor)
  tone?: number; // clareia o verde
  lumBoost?: number;
  stemPool?: number; // só os N primeiros talos recebem folhas
}
export const LILY_LEAVES: LeafStyle = {
  stem: 32, base: 22, stemLen: [0.25, 0.22], stemW: [0.03, 0.012], baseLen: [0.42, 0.28], baseW: [0.036, 0.014],
  stemLean: [0.2, 0.25], baseLean: [0.3, 0.3], droop: [0.05, 0.15], ovate: false, spacing: 0.0042,
};

/** Pontos já projetados (x, y em unidades do modelo com perspectiva; z maior = mais perto). */
export class PointBuffer {
  n = 0;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  lum: Float32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  ch: Uint8Array;
  constructor(public cap: number) {
    this.x = new Float32Array(cap);
    this.y = new Float32Array(cap);
    this.z = new Float32Array(cap);
    this.lum = new Float32Array(cap);
    this.r = new Uint8Array(cap);
    this.g = new Uint8Array(cap);
    this.b = new Uint8Array(cap);
    this.ch = new Uint8Array(cap);
  }
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash2 = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const mix = (a: RGB, b: RGB, k: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

/** R = Ry(yaw) · Rx(-pitch) · Rz(roll). O eixo do lírio (0,0,1) aponta para o espectador e sobe com o pitch. */
export function rotation(yaw: number, pitch: number, roll: number, R: Float64Array) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(-pitch);
  const sx = Math.sin(-pitch);
  const cz = Math.cos(roll);
  const sz = Math.sin(roll);
  const a0 = cz, a1 = -sz, a2 = 0;
  const b0 = cx * sz, b1 = cx * cz, b2 = -sx;
  const c0 = sx * sz, c1 = sx * cz, c2 = cx;
  R[0] = cy * a0 + sy * c0;
  R[1] = cy * a1 + sy * c1;
  R[2] = cy * a2 + sy * c2;
  R[3] = b0;
  R[4] = b1;
  R[5] = b2;
  R[6] = -sy * a0 + cy * c0;
  R[7] = -sy * a1 + cy * c1;
  R[8] = -sy * a2 + cy * c2;
}

export function buildFlower(spec: LilySpec, ytop: number, rnd: () => number, sid: number): Flower {
  const pal: Palette = PALETTES[spec.pal];
  const u: number[] = [], v: number[] = [], w: number[] = [], pid: number[] = [];
  const r: number[] = [], g: number[] = [], b: number[] = [], pl: number[] = [], wv: number[] = [];
  const sp = SP / spec.size;

  for (let p = 0; p < 6; p++) {
    const inner = p & 1;
    const L = LP[inner] * (spec.ls ?? 1);
    const W = WP[inner];
    const nv = Math.ceil(L / sp);
    const nu = Math.ceil((2 * W) / sp);
    for (let iv = 0; iv < nv; iv++) {
      for (let iu = 0; iu < nu; iu++) {
        const vv = (iv + rnd()) / nv;
        const uu = -1 + (2 * (iu + rnd())) / nu;
        const au = Math.abs(uu);
        let c = mix(pal.center, pal.base, smoothstep(0, 0.78, vv));
        let lum = 0.1 + 0.3 * Math.sin(Math.PI * Math.min(1, vv * 1.15));
        if (au < 0.1 + 0.05 * (1 - vv)) {
          c = mix(c as unknown as RGB, RIB, 0.4);
          lum += 0.12;
        } else if (au > 0.86) lum -= 0.08;
        // nervuras longitudinais finas, mais claras
        const vein = Math.cos(uu * 15 + p);
        if (vein > 0.82 && au > 0.12) {
          c = mix(c as unknown as RGB, RIB, 0.18);
          lum += 0.07;
        }
        // papilas: pontinhos escuros e densos perto do miolo
        if (vv > 0.04 && vv < 0.42 && au < 0.8 && hash2(Math.floor(uu * 16) + p * 3, Math.floor(vv * 40)) < 0.2) {
          c = [c[0] * 0.5, c[1] * 0.4, c[2] * 0.45];
          lum -= 0.1;
        }
        if (pal.spots && vv > 0.1 && vv < 0.6 && au < 0.9 && hash2(Math.floor(uu * 6) + p * 7, Math.floor(vv * 13)) < 0.17) {
          c = [c[0] * 0.6, c[1] * 0.35, c[2] * 0.5];
          lum -= 0.16;
        }
        u.push(uu);
        v.push(vv);
        w.push(
          spec.round
            ? W * Math.pow(Math.sin(Math.PI * Math.pow(vv, 0.9)), 0.45)
            : W * Math.pow(Math.sin(Math.PI * Math.pow(vv, 0.75)), 0.8) * (1 + 0.07 * Math.sin(vv * 26 + p * 1.7)),
        );
        wv.push(Math.sin(vv * 20 + uu * 2.5 + p * 2));
        pid.push(p);
        r.push(c[0]);
        g.push(c[1]);
        b.push(c[2]);
        pl.push(lum);
      }
    }
  }

  // Estames (0..5) com anteras, e o pistilo (6).
  const ms: number[] = [], ml: number[] = [], mk: number[] = [];
  const mr: number[] = [], mg: number[] = [], mb: number[] = [], mp: number[] = [];
  const addM = (k: number, s: number, lat: number, c: RGB, lum: number) => {
    ms.push(s);
    ml.push(lat);
    mk.push(k);
    mr.push(c[0]);
    mg.push(c[1]);
    mb.push(c[2]);
    mp.push(lum);
  };
  for (let k = 0; k < 7; k++) {
    const ns = Math.ceil(SL[k] / sp);
    const tip = k < 6 ? 0.88 : 0.93;
    for (let i = 0; i < ns; i++) for (const lt of [-0.0015, 0.0015]) addM(k, (i + rnd()) / ns * tip, lt, k < 6 ? [238, 226, 170] : [214, 232, 150], 0.55);
    const nt = Math.ceil(((1 - tip) * SL[k]) / sp) + 1;
    const half = k < 6 ? 0.0035 : 0.003;
    for (let i = 0; i < nt; i++) {
      for (let j = -2; j <= 2; j++) {
        addM(k, tip + ((1 - tip) * (i + rnd())) / nt, j * half, k < 6 ? [176, 74, 22] : [214, 240, 150], 0.9);
      }
    }
  }

  return {
    cx: spec.x, cy: spec.y, cz: spec.z, size: spec.size, yaw: spec.yaw, pitch: spec.pitch, roll: spec.roll,
    ls: spec.ls ?? 1,
    maxOpen: spec.maxOpen ?? 1,
    h: spec.y / ytop,
    gKey: (spec.y / ytop) * 0.85,
    delay: rnd() * 1.5,
    phase: rnd() * Math.PI * 2,
    sid,
    n: u.length,
    u: Float32Array.from(u), v: Float32Array.from(v), w: Float32Array.from(w), pid: Uint8Array.from(pid),
    r: Uint8Array.from(r), g: Uint8Array.from(g), b: Uint8Array.from(b), pl: Float32Array.from(pl), wv: Float32Array.from(wv),
    m: ms.length,
    ms: Float32Array.from(ms), ml: Float32Array.from(ml), mk: Uint8Array.from(mk),
    mr: Uint8Array.from(mr), mg: Uint8Array.from(mg), mb: Uint8Array.from(mb), mp: Float32Array.from(mp),
  };
}

type Vec = [number, number, number];

/** Adiciona um ponto estático (talo, folha, fita...). `extra` atrasa o aparecimento durante o crescimento. */
export type StaticAdd = (x: number, y: number, z: number, sid: number, c: RGB, lum: number, ch: number, extra: number) => void;

export function buildStatics(flowers: (Pick<Flower, "cx" | "cy" | "cz" | "yaw" | "pitch"> & { stemBack?: boolean; thick?: boolean })[], ytop: number, rnd: () => number, style: LeafStyle = LILY_LEAVES, extras?: (add: StaticAdd, sid: number, rnd: () => number) => void): Statics {
  const X: number[] = [], Y: number[] = [], Z: number[] = [], GR: number[] = [], HW: number[] = [];
  const SID: number[] = [], R: number[] = [], G: number[] = [], B: number[] = [], LUM: number[] = [], CH: number[] = [], PH: number[] = [];
  const add = (x: number, y: number, z: number, sid: number, c: RGB, lum: number, ch: number, extra: number) => {
    const hh = clamp(y / ytop, 0, 1);
    X.push(x); Y.push(y); Z.push(z);
    GR.push(hh * 0.85 + extra);
    HW.push(Math.pow(hh, 1.5));
    SID.push(sid);
    R.push(c[0]); G.push(c[1]); B.push(c[2]);
    LUM.push(lum);
    CH.push(ch);
    PH.push(y * 5 + sid);
  };

  const stems = flowers.length;
  const curves: { p: Vec[]; pt: (s: number) => Vec; tan: (s: number) => Vec }[] = [];

  for (let i = 0; i < flowers.length; i++) {
    const f = flowers[i];
    const cyw = Math.cos(f.yaw);
    const cxp = Math.cos(-f.pitch);
    const axis: Vec = [Math.sin(f.yaw) * cxp, Math.sin(f.pitch), cyw * cxp];
    const p0: Vec = [(rnd() - 0.5) * 0.07, 0, (rnd() - 0.5) * 0.07];
    const p3: Vec = [f.cx, f.cy, f.cz];
    // flores baixas têm talo curto: as alças da curva encolhem com a altura
    const k1 = Math.min(0.3, f.cy * 0.8);
    const k2 = Math.min(0.26, f.cy * 0.7);
    // stemBack: o talo sobe por trás das flores e só aparece na ponta, junto à flor
    if (f.thick) {
      // talo de margarida: sobe do feixe e entra por baixo da flor, em curva suave
      var p1t: Vec = [p0[0] + (p3[0] - p0[0]) * 0.1, k1 * 1.2, p3[2] * 0.3];
      var p2t: Vec = [p3[0], p3[1] - k2 * 1.1, p3[2] * 0.85];
    }
    const p1: Vec = f.thick ? p1t! : [p0[0] + (p3[0] - p0[0]) * 0.12, k1, f.stemBack ? -0.15 : p0[2] + (p3[2] - p0[2]) * 0.12];
    const p2: Vec = f.thick ? p2t! : [p3[0] - axis[0] * k2, p3[1] - axis[1] * k2, f.stemBack ? -0.12 : p3[2] - axis[2] * k2];
    const pt = (s: number): Vec => {
      const q = 1 - s;
      const a = q * q * q, bb = 3 * q * q * s, c = 3 * q * s * s, d = s * s * s;
      return [a * p0[0] + bb * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + bb * p1[1] + c * p2[1] + d * p3[1], a * p0[2] + bb * p1[2] + c * p2[2] + d * p3[2]];
    };
    const tan = (s: number): Vec => {
      const q = 1 - s;
      const a = 3 * q * q, bb = 6 * q * s, c = 3 * s * s;
      const t: Vec = [0, 0, 0];
      for (let k = 0; k < 3; k++) t[k] = a * (p1[k] - p0[k]) + bb * (p2[k] - p1[k]) + c * (p3[k] - p2[k]);
      const l = Math.hypot(t[0], t[1], t[2]) || 1;
      return [t[0] / l, t[1] / l, t[2] / l];
    };
    curves.push({ p: [p0, p1, p2, p3], pt, tan });

    let len = 0;
    let prev = pt(0);
    for (let k = 1; k <= 24; k++) {
      const q = pt(k / 24);
      len += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]);
      prev = q;
    }
    const ns = Math.ceil(len / 0.003);
    for (let k = 0; k < ns; k++) {
      const s = (k + rnd()) / ns;
      const q = pt(s);
      const t = tan(s);
      const ax = Math.abs(t[0]), ay = Math.abs(t[1]);
      const ch = ay < 0.4 * ax ? 45 : ax < 0.4 * ay ? 124 : t[0] * t[1] > 0 ? 47 : 92; // - | / \
      for (const dx of f.thick ? [0, 0.0045, 0.009] : [0, 0.0045]) add(q[0] + dx, q[1], q[2], i, mix([70, 150, 70], [130, 195, 90], rnd()), (f.thick ? 0.8 : 0.65) + 0.2 * rnd(), ch, 0);
    }
  }

  const leaf = (A: Vec, out: Vec, Ll: number, Wl: number, sid: number, droop: number, lean: number) => {
    const sp2 = style.spacing;
    const tip: Vec = [A[0] + out[0] * Ll * lean, A[1] + Ll * (0.9 - droop), A[2] + out[2] * Ll * lean];
    const ctl: Vec = [A[0] + out[0] * Ll * lean * 0.15, A[1] + Ll * 0.65, A[2] + out[2] * Ll * lean * 0.15];
    const rv: Vec = [(rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.5, 1];
    const rl = Math.hypot(rv[0], rv[1], rv[2]);
    rv[0] /= rl; rv[1] /= rl; rv[2] /= rl;
    const tl = rnd();
    const nv = Math.ceil((Ll * 1.15) / sp2);
    const nu = Math.ceil((2 * Wl) / sp2);
    for (let iv = 0; iv < nv; iv++) {
      const vv = (iv + rnd()) / nv;
      const q = 1 - vv;
      const px = q * q * A[0] + 2 * q * vv * ctl[0] + vv * vv * tip[0];
      const py = q * q * A[1] + 2 * q * vv * ctl[1] + vv * vv * tip[1];
      const pz = q * q * A[2] + 2 * q * vv * ctl[2] + vv * vv * tip[2];
      let tx = 2 * q * (ctl[0] - A[0]) + 2 * vv * (tip[0] - ctl[0]);
      let ty = 2 * q * (ctl[1] - A[1]) + 2 * vv * (tip[1] - ctl[1]);
      let tz = 2 * q * (ctl[2] - A[2]) + 2 * vv * (tip[2] - ctl[2]);
      const tn = Math.hypot(tx, ty, tz) || 1;
      tx /= tn; ty /= tn; tz /= tn;
      // lateral = T x R; normal = lateral x T
      let lx = ty * rv[2] - tz * rv[1];
      let ly = tz * rv[0] - tx * rv[2];
      let lz = tx * rv[1] - ty * rv[0];
      const ln = Math.hypot(lx, ly, lz);
      if (ln < 1e-4) continue;
      lx /= ln; ly /= ln; lz /= ln;
      const nx = ly * tz - lz * ty, ny = lz * tx - lx * tz, nz = lx * ty - ly * tx;
      const lamb = Math.abs(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const wv = style.ovate
        ? Wl * Math.pow(Math.sin(Math.PI * Math.pow(vv, 0.65)), 0.6) * (1 + 0.09 * Math.sin(vv * 58))
        : Wl * Math.pow(Math.sin(Math.PI * Math.pow(vv, 0.7)), 0.9);
      for (let iu = 0; iu < nu; iu++) {
        const uu = -1 + (2 * (iu + rnd())) / nu;
        const au = Math.abs(uu);
        const off = uu * wv;
        const fold = au * wv * 0.35;
        const tt = clamp(tl + (style.tone ?? 0) + 0.25 * (vv - 0.5) + (uu > 0 ? 0.08 : -0.08), 0, 1);
        let c: RGB = mix(G0, G1, tt);
        let lum = 0.3 + (style.lumBoost ?? 0) + 0.6 * lamb - (au > 0.82 ? 0.22 : 0);
        if (au < 0.07) {
          c = mix(c as unknown as RGB, [200, 230, 150], 0.55);
          lum += 0.18;
        } else {
          // nervuras laterais oblíquas
          const ph = vv * 22 - au * 4;
          if (ph - Math.floor(ph) < 0.14) {
            c = mix(c as unknown as RGB, [190, 225, 140], 0.35);
            lum += 0.1;
          }
        }
        add(px + lx * off + nx * fold, py + ly * off + ny * fold, pz + lz * off + nz * fold, sid, c, lum, 0, 0.04);
      }
    }
  };

  if (extras) extras(add, stems, rnd);
  const span = (r: [number, number]) => r[0] + rnd() * r[1];
  // Folhas ao longo dos talos.
  for (let k = 0; k < style.stem; k++) {
    const i = Math.floor(rnd() * Math.min(stems, style.stemPool ?? stems));
    const A = curves[i].pt(style.attach ? style.attach[0] + rnd() * style.attach[1] : 0.1 + rnd() * 0.45);
    const a = rnd() * Math.PI * 2;
    leaf(A, [Math.cos(a), 0, Math.sin(a)], span(style.stemLen), span(style.stemW), i, span(style.droop), span(style.stemLean));
  }
  // Touceira na base: folhas maiores que caem para os lados.
  for (let k = 0; k < style.base; k++) {
    const a = (k / style.base) * Math.PI * 2 + rnd() * 0.4;
    const A: Vec = [(rnd() - 0.5) * 0.08, rnd() * 0.16, (rnd() - 0.5) * 0.08];
    leaf(A, [Math.cos(a), 0, Math.sin(a)], span(style.baseLen), span(style.baseW), stems, span(style.droop), span(style.baseLean));
  }

  return {
    n: X.length,
    x: Float32Array.from(X), y: Float32Array.from(Y), z: Float32Array.from(Z),
    grow: Float32Array.from(GR), hw: Float32Array.from(HW), sid: Uint8Array.from(SID),
    r: Uint8Array.from(R), g: Uint8Array.from(G), b: Uint8Array.from(B),
    lum: Float32Array.from(LUM), ch: Uint8Array.from(CH), ph: Float32Array.from(PH),
  };
}

/** Gera o buquê uma vez: nuvem de pontos de lírios, talos e folhas. */
export function buildBouquet(seed = 11): Bouquet {
  const rnd = mulberry32(seed);
  const ytop = Math.max(...SPECS.map((s) => s.y));
  const flowers = SPECS.map((s, i) => buildFlower(s, ytop, rnd, i));
  const statics = buildStatics(flowers, ytop, rnd);
  const capacity = statics.n + flowers.reduce((a, f) => a + f.n + f.m, 0);
  const bq: Bouquet = { flowers, statics, stems: flowers.length + 1, capacity, bounds: { xmin: 0, xmax: 0, ymin: 0, ymax: 0 } };

  // Limites no repouso (tudo aberto, sem balanço): servem para escalar e centralizar.
  const tmp = new PointBuffer(capacity);
  const terms = new Float32Array(bq.stems);
  poseStatics(statics, 2, 0, terms, 0, tmp);
  for (const f of flowers) poseFlower(f, 1, 2, 0, 0, 0, tmp);
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

const clamp8 = (v: number) => (v > 255 ? 255 : v);

/** Talos e folhas: aparecem de baixo para cima conforme o progresso P do crescimento. */
export function poseStatics(s: Statics, P: number, t: number, terms: Float32Array, gate: number, out: PointBuffer) {
  const amp = SWAY_AMP * gate;
  for (let i = 0; i < s.n; i++) {
    const grow = s.grow[i];
    if (grow > P) continue;
    const j = out.n++;
    const dx = amp * s.hw[i] * terms[s.sid[i]];
    const wx = s.x[i] + dx;
    const wy = s.y[i];
    const wz = s.z[i] + dx * 0.3;
    const k = CAM / (CAM - wz);
    out.x[j] = wx * k;
    out.y[j] = (wy - MID) * k + MID;
    out.z[j] = wz;
    let lum = s.lum[i] * (1 + 0.07 * Math.sin(1.4 * t + s.ph[i]));
    let r = s.r[i], g = s.g[i], b = s.b[i];
    if (P < 1 && P - grow < 0.02) {
      // ponta de crescimento: brilho claro
      lum = 1;
      r = 210; g = 255; b = 210;
    }
    out.lum[j] = lum;
    out.r[j] = r;
    out.g[j] = g;
    out.b[j] = b;
    out.ch[j] = s.ch[i];
  }
}

const R = new Float64Array(9);
const RAD = new Float32Array(6 * (N + 1));
const AX = new Float32Array(6 * (N + 1));
const LAMB = new Float32Array(6 * N);
const WRAP = new Float32Array(6);
const CD = new Float32Array(6);
const SD = new Float32Array(6);
for (let p = 0; p < 6; p++) {
  CD[p] = Math.cos(p * (Math.PI / 3));
  SD[p] = Math.sin(p * (Math.PI / 3));
}

/**
 * Uma flor com abertura `open` (0 botão .. 1 aberta). P é o progresso do crescimento (o botão aparece
 * quando o talo chega); `term` e `gate` dão o balanço.
 */
export function poseFlower(f: Flower, openIn: number, P: number, t: number, term: number, gate: number, out: PointBuffer) {
  const bud = smoothstep(f.gKey - 0.03, f.gKey + 0.12, P);
  if (bud <= 0) return;
  const open = Math.min(openIn, f.maxOpen);
  const wob = gate * term;
  const sway = SWAY_AMP * wob * Math.pow(f.h, 1.5);
  const cx = f.cx + sway;
  const cz = f.cz + sway * 0.3;
  const cy = f.cy;
  const sc = f.size * (0.55 + 0.45 * bud);
  rotation(f.yaw + 0.1 * wob, f.pitch + 0.04 * wob, f.roll, R);
  const R0 = R[0], R1 = R[1], R2 = R[2], R3 = R[3], R4 = R[4], R5 = R[5], R6 = R[6], R7 = R[7], R8 = R[8];

  // Linha central de cada pétala (aberta) e iluminação por segmento.
  for (let p = 0; p < 6; p++) {
    const inner = p & 1;
    const oi = inner ? clamp(open * 1.25 - 0.25, 0, 1) : open;
    const th0 = inner ? 0.07 + 0.7 * oi : 0.09 + 0.95 * oi;
    const curl = inner ? 0.9 * oi : 1.05 * oi;
    const st = (LP[inner] * f.ls) / N;
    const cd = CD[p], sd = SD[p];
    let rad = 0.004;
    let ax = 0;
    RAD[p * (N + 1)] = rad;
    AX[p * (N + 1)] = ax;
    for (let k = 0; k < N; k++) {
      const vm = (k + 0.5) / N;
      const th = th0 + curl * vm * vm;
      const s = Math.sin(th), c = Math.cos(th);
      rad += st * s;
      ax += st * c;
      RAD[p * (N + 1) + k + 1] = rad;
      AX[p * (N + 1) + k + 1] = ax;
      // normal local (-cos·cd, -cos·sd, sin) girada por R
      const nx = -c * cd, ny = -c * sd, nz = s;
      const wx = R0 * nx + R1 * ny + R2 * nz, wy = R3 * nx + R4 * ny + R5 * nz, wz = R6 * nx + R7 * ny + R8 * nz;
      LAMB[p * N + k] = Math.abs(wx * LIGHT[0] + wy * LIGHT[1] + wz * LIGHT[2]);
    }
    WRAP[p] = 1 - smoothstep(0, 0.55, oi);
  }

  const breath = 1.6 * t + f.phase;
  for (let i = 0; i < f.n; i++) {
    const p = f.pid[i];
    const inner = p & 1;
    const vf = f.v[i] * N;
    let k = vf | 0;
    if (k >= N) k = N - 1;
    const fr = vf - k;
    const o = p * (N + 1) + k;
    let rad = RAD[o] + (RAD[o + 1] - RAD[o]) * fr;
    let ax = AX[o] + (AX[o + 1] - AX[o]) * fr;
    const lat = f.u[i] * f.w[i];
    const cup = 5 * lat * lat; // bordas levantadas
    const cd = CD[p], sd = SD[p];
    let lamb = LAMB[p * N + k];
    let lx = cd * (rad - cup * 0.3) - sd * lat;
    let ly = sd * (rad - cup * 0.3) + cd * lat;
    let lz = ax + cup + f.wv[i] * 0.007 * (1 - WRAP[p]);
    const wr = WRAP[p];
    if (wr > 0.001) {
      // Botão: a pétala se enrola num cilindro (cada uma cobre 60°).
      const ang = p * (Math.PI / 3) + f.u[i] * 1.04;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const Rb = f.w[i] * BR[inner];
      lx += (Rb * ca - lx) * wr;
      ly += (Rb * sa - ly) * wr;
      lz += (ax - lz) * wr;
      const lc = Math.abs((R0 * ca + R1 * sa) * LIGHT[0] + (R3 * ca + R4 * sa) * LIGHT[1] + (R6 * ca + R7 * sa) * LIGHT[2]);
      lamb += (lc - lamb) * wr;
    }
    const wx = cx + sc * (R0 * lx + R1 * ly + R2 * lz);
    const wy = cy + sc * (R3 * lx + R4 * ly + R5 * lz);
    const wz = cz + sc * (R6 * lx + R7 * ly + R8 * lz);
    const j = out.n++;
    const q = CAM / (CAM - wz);
    out.x[j] = wx * q;
    out.y[j] = (wy - MID) * q + MID;
    out.z[j] = wz;
    out.lum[j] = clamp(0.25 + 0.5 * lamb + f.pl[i], 0, 1) * (1 + 0.06 * Math.sin(breath + f.v[i] * 3));
    out.r[j] = f.r[i];
    out.g[j] = f.g[i];
    out.b[j] = f.b[i];
    out.ch[j] = 0;
  }

  // Estames e pistilo surgem quando as pétalas já se afastaram.
  const sv = smoothstep(0.12, 0.45, open);
  if (sv <= 0.001 || f.maxOpen < 0.3) return;
  for (let i = 0; i < f.m; i++) {
    const k = f.mk[i];
    const S = SL[k] * sv;
    const psi = k < 6 ? 0.1 + 0.65 * open : 0.04 + 0.14 * open;
    const tt = f.ms[i];
    const rad = (S / psi) * (1 - Math.cos(psi * tt));
    const ax = (S / psi) * Math.sin(psi * tt);
    const lat = f.ml[i];
    const ca = Math.cos(SAZ[k]), sa = Math.sin(SAZ[k]);
    const lx = ca * rad - sa * lat;
    const ly = sa * rad + ca * lat;
    const wx = cx + sc * (R0 * lx + R1 * ly + R2 * ax);
    const wy = cy + sc * (R3 * lx + R4 * ly + R5 * ax);
    const wz = cz + sc * (R6 * lx + R7 * ly + R8 * ax) + 0.01;
    const j = out.n++;
    const q = CAM / (CAM - wz);
    out.x[j] = wx * q;
    out.y[j] = (wy - MID) * q + MID;
    out.z[j] = wz;
    out.lum[j] = f.mp[i];
    out.r[j] = clamp8(f.mr[i]);
    out.g[j] = f.mg[i];
    out.b[j] = f.mb[i];
    out.ch[j] = 0;
  }
}
