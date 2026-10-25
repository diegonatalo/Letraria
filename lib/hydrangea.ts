import { smoothstep, SWAY_AMP } from "./animation";
import { clamp } from "./ascii";
import {
  buildStatics, type BouquetOf, CAM, type LeafStyle, LIGHT, MID, mix, mulberry32, PointBuffer, poseStatics, type RGB, rotation,
} from "./lily";

interface Palette {
  a: RGB;
  b: RGB;
}

const PALETTES = {
  azul: { a: [74, 118, 236], b: [140, 176, 250] },
  celeste: { a: [96, 170, 244], b: [168, 214, 252] },
  cobalto: { a: [40, 90, 214], b: [92, 142, 240] },
  pervinca: { a: [112, 128, 232], b: [168, 178, 248] },
  marinho: { a: [26, 52, 164], b: [70, 100, 214] },
  gelo: { a: [190, 220, 248], b: [232, 244, 254] },
  turquesa: { a: [52, 150, 220], b: [110, 200, 240] },
} satisfies Record<string, Palette>;

// Cabeças esféricas (mopheads): posição, raio relativo e pose.
export interface HeadSpec {
  x: number; y: number; z: number; size: number; yaw: number; pitch: number; roll: number; flat: number; pal: keyof typeof PALETTES;
}

const SPECS: HeadSpec[] = [
  { x: 0.0, y: 0.82, z: 0.05, size: 1.1, yaw: 0.0, pitch: 0.3, roll: 0.2, flat: 1.0, pal: "cobalto" },
  { x: -0.314, y: 0.7, z: 0.1, size: 1.0, yaw: -0.5, pitch: 0.2, roll: 1.0, flat: 0.85, pal: "pervinca" },
  { x: 0.325, y: 0.72, z: 0.08, size: 1.0, yaw: 0.5, pitch: 0.25, roll: 0.5, flat: 0.9, pal: "celeste" },
  { x: -0.112, y: 0.54, z: 0.24, size: 0.95, yaw: -0.2, pitch: 0.1, roll: 2.0, flat: 0.8, pal: "gelo" },
  { x: 0.179, y: 0.52, z: 0.27, size: 0.9, yaw: 0.25, pitch: 0.1, roll: 0.8, flat: 0.85, pal: "marinho" },
  { x: -0.482, y: 0.5, z: 0.0, size: 0.82, yaw: -0.9, pitch: 0.1, roll: 0.3, flat: 0.9, pal: "turquesa" },
  { x: 0.493, y: 0.52, z: 0.0, size: 0.82, yaw: 0.9, pitch: 0.15, roll: 1.4, flat: 0.8, pal: "pervinca" },
];

const HEAD_R = 0.125; // raio da esfera de florzinhas
const FLORETS = 34;
const SEP = 0.056; // comprimento da sépala
const SEP_W = 0.042; // meia-largura da sépala
const SP = 0.0048;
const GREEN: RGB = [92, 150, 80];
const EYE: RGB = [236, 240, 150];

export const LEAVES: LeafStyle = {
  stem: 15, base: 6, stemLen: [0.26, 0.14], stemW: [0.05, 0.016], baseLen: [0.3, 0.16], baseW: [0.055, 0.02],
  stemLean: [0.7, 0.5], baseLean: [0.6, 0.45], droop: [0.0, 0.22], ovate: true, spacing: 0.0045,
  attach: [0.3, 0.3], tone: 0.3, lumBoost: 0.12,
};

export interface Head {
  cx: number;
  cy: number;
  cz: number;
  size: number;
  yaw: number;
  pitch: number;
  roll: number;
  h: number;
  gKey: number;
  delay: number;
  phase: number;
  sid: number;
  nf: number;
  d: Float32Array; // direção de cada florzinha (3 por florzinha)
  t1: Float32Array;
  t2: Float32Array;
  st: Float32Array; // atraso da abertura (0..1)
  ao: Float32Array;
  fs: Uint32Array; // início das amostras de cada florzinha (nf + 1)
  n: number;
  cs: Float32Array;
  sn: Float32Array;
  u: Float32Array;
  v: Float32Array;
  w: Float32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  pl: Float32Array;
}

const hash2 = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function buildHead(spec: HeadSpec, ytop: number, rnd: () => number, sid: number): Head {
  const pal: Palette = PALETTES[spec.pal];
  const maxPolar = 1.9;
  const d: number[] = [], t1: number[] = [], t2: number[] = [], st: number[] = [], ao: number[] = [], fs: number[] = [];
  const cs: number[] = [], sn: number[] = [], u: number[] = [], v: number[] = [], w: number[] = [];
  const r: number[] = [], g: number[] = [], b: number[] = [], pl: number[] = [];
  const sp = SP / spec.size;

  for (let i = 0; i < FLORETS; i++) {
    const cz = 1 - ((i + 0.5) / FLORETS) * (1 - Math.cos(maxPolar));
    const polar = Math.acos(cz);
    const phi = i * 2.399963 + rnd() * 0.3;
    const sT = Math.sin(polar);
    let dx = sT * Math.cos(phi) + (rnd() - 0.5) * 0.18;
    let dy = sT * Math.sin(phi) + (rnd() - 0.5) * 0.18;
    let dz = cz + (rnd() - 0.5) * 0.18;
    const dl = Math.hypot(dx, dy, dz);
    dx /= dl; dy /= dl; dz /= dl;
    // base tangente
    let ax = 0, ay = 1, az = 0;
    if (Math.abs(dy) > 0.9) { ax = 1; ay = 0; }
    let tx = dy * az - dz * ay, ty = dz * ax - dx * az, tz = dx * ay - dy * ax;
    const tl = Math.hypot(tx, ty, tz);
    tx /= tl; ty /= tl; tz /= tl;
    const ux = dy * tz - dz * ty, uy = dz * tx - dx * tz, uz = dx * ty - dy * tx;
    const depth = HEAD_R * (1 + 0.1 * rnd() + (rnd() < 0.1 ? 0.16 : 0)); // algumas florzinhas saltam da borda
    d.push(dx * depth, dy * depth * (dy < 0 ? spec.flat : 1), dz * depth);
    t1.push(tx, ty, tz);
    t2.push(ux, uy, uz);
    st.push(clamp((polar / maxPolar) * 0.6 + rnd() * 0.4, 0, 1));
    ao.push((1 - 0.4 * smoothstep(0.9, 1.9, polar)) * (0.8 + 0.2 * rnd()));
    fs.push(cs.length);

    const c0 = mix(pal.a, pal.b, rnd());
    const roll = rnd() * Math.PI;
    for (let k = 0; k < 4; k++) {
      const ang = roll + k * (Math.PI / 2);
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const nv = Math.ceil(SEP / sp);
      for (let iv = 0; iv < nv; iv++) {
        const vv = (iv + rnd()) / nv;
        const wv = SEP_W * Math.pow(Math.sin(Math.PI * Math.pow(vv, 0.8)), 0.55);
        const nu = Math.max(1, Math.ceil((2 * wv) / sp));
        for (let iu = 0; iu < nu; iu++) {
          const uu = -1 + (2 * (iu + rnd())) / nu;
          const au = Math.abs(uu);
          let c: RGB = mix(c0, [255, 255, 255], 0.22 * (1 - vv));
          let lum = 0.1 + 0.12 * vv;
          if (vv < 0.16) {
            c = EYE;
            lum += 0.2;
          } else if (au < 0.09) {
            c = mix(c, [255, 255, 255], 0.18);
            lum += 0.08;
          } else if (au > 0.8 || vv > 0.86) lum -= 0.2;
          if (hash2(i * 3 + k, Math.floor(vv * 9) + Math.floor(uu * 5) * 13) < 0.1) lum -= 0.08;
          cs.push(ca);
          sn.push(sa);
          u.push(uu);
          v.push(vv);
          w.push(wv);
          r.push(c[0]);
          g.push(c[1]);
          b.push(c[2]);
          pl.push(lum);
        }
      }
    }
  }
  fs.push(cs.length);

  return {
    cx: spec.x, cy: spec.y, cz: spec.z, size: spec.size, yaw: spec.yaw, pitch: spec.pitch, roll: spec.roll,
    h: spec.y / ytop,
    gKey: (spec.y / ytop) * 0.85,
    delay: rnd() * 1.5,
    phase: rnd() * Math.PI * 2,
    sid,
    nf: FLORETS,
    d: Float32Array.from(d), t1: Float32Array.from(t1), t2: Float32Array.from(t2),
    st: Float32Array.from(st), ao: Float32Array.from(ao), fs: Uint32Array.from(fs),
    n: cs.length,
    cs: Float32Array.from(cs), sn: Float32Array.from(sn), u: Float32Array.from(u), v: Float32Array.from(v), w: Float32Array.from(w),
    r: Uint8Array.from(r), g: Uint8Array.from(g), b: Uint8Array.from(b), pl: Float32Array.from(pl),
  };
}

const R = new Float64Array(9);

/** Uma cabeça de hortênsia: as florzinhas se abrem de dentro para fora conforme `open` vai de 0 a 1. */
export function poseHead(f: Head, open: number, P: number, t: number, term: number, gate: number, out: PointBuffer) {
  const bud = smoothstep(f.gKey - 0.03, f.gKey + 0.12, P);
  if (bud <= 0) return;
  const wob = gate * term;
  const sway = SWAY_AMP * wob * Math.pow(f.h, 1.5);
  const cx = f.cx + sway;
  const cz = f.cz + sway * 0.3;
  const cy = f.cy;
  const sc = f.size * (0.6 + 0.4 * bud);
  rotation(f.yaw + 0.1 * wob, f.pitch + 0.04 * wob, f.roll, R);
  const R0 = R[0], R1 = R[1], R2 = R[2], R3 = R[3], R4 = R[4], R5 = R[5], R6 = R[6], R7 = R[7], R8 = R[8];
  const breath = 1.6 * t + f.phase;

  for (let fl = 0; fl < f.nf; fl++) {
    const dx = f.d[fl * 3], dy = f.d[fl * 3 + 1], dz = f.d[fl * 3 + 2];
    const dl = HEAD_R * 1.025;
    const nz = (R6 * dx + R7 * dy + R8 * dz) / dl;
    if (nz < -0.3) continue; // virada para trás
    const nx = (R0 * dx + R1 * dy + R2 * dz) / dl;
    const ny = (R3 * dx + R4 * dy + R5 * dz) / dl;
    const lamb = 0.5 + 0.5 * (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const base = (0.16 + 0.55 * lamb + 0.2 * lamb * lamb * lamb) * f.ao[fl];

    const o = smoothstep(f.st[fl] * 0.55, f.st[fl] * 0.55 + 0.45, open);
    const theta = 0.12 + 1.2 * o;
    const sT = Math.sin(theta), cT = Math.cos(theta);
    const sz = SEP * (0.6 + 0.4 * o);
    const ws = sz / SEP;
    const gk = (1 - o) * 0.75;
    const t1x = f.t1[fl * 3], t1y = f.t1[fl * 3 + 1], t1z = f.t1[fl * 3 + 2];
    const t2x = f.t2[fl * 3], t2y = f.t2[fl * 3 + 1], t2z = f.t2[fl * 3 + 2];
    const ndx = dx / HEAD_R, ndy = dy / HEAD_R, ndz = dz / HEAD_R;

    for (let s = f.fs[fl]; s < f.fs[fl + 1]; s++) {
      const vv = f.v[s];
      const rad = sz * vv * sT;
      const lat = f.u[s] * f.w[s] * ws;
      const lift = sz * vv * cT + 9 * lat * lat;
      const ca = f.cs[s], sa = f.sn[s];
      const ex = ca * t1x + sa * t2x, ey = ca * t1y + sa * t2y, ez = ca * t1z + sa * t2z;
      const lx = dx + ex * rad + ndx * lift + (-sa * t1x + ca * t2x) * lat;
      const ly = dy + ey * rad + ndy * lift + (-sa * t1y + ca * t2y) * lat;
      const lz = dz + ez * rad + ndz * lift + (-sa * t1z + ca * t2z) * lat;
      const wx = cx + sc * (R0 * lx + R1 * ly + R2 * lz);
      const wy = cy + sc * (R3 * lx + R4 * ly + R5 * lz);
      const wz = cz + sc * (R6 * lx + R7 * ly + R8 * lz);
      const j = out.n++;
      const q = CAM / (CAM - wz);
      out.x[j] = wx * q;
      out.y[j] = (wy - MID) * q + MID;
      out.z[j] = wz;
      out.lum[j] = clamp(base + f.pl[s], 0, 1) * (1 + 0.05 * Math.sin(breath + vv * 3 + fl));
      const r0 = f.r[s], g0 = f.g[s], b0 = f.b[s];
      out.r[j] = r0 + (GREEN[0] - r0) * gk;
      out.g[j] = g0 + (GREEN[1] - g0) * gk;
      out.b[j] = b0 + (GREEN[2] - b0) * gk;
      out.ch[j] = 0;
    }
  }
}

/** Gera o buquê de hortênsias: cabeças redondas, talos e folhas largas serrilhadas. */
export function buildHydrangeas(seed = 21): BouquetOf<Head> {
  const rnd = mulberry32(seed);
  const ytop = Math.max(...SPECS.map((s) => s.y));
  const flowers = SPECS.map((s, i) => buildHead(s, ytop, rnd, i));
  const statics = buildStatics(flowers, ytop, rnd, LEAVES);
  const capacity = statics.n + flowers.reduce((a, f) => a + f.n, 0);
  const bq: BouquetOf<Head> = { flowers, statics, stems: flowers.length + 1, capacity, bounds: { xmin: 0, xmax: 0, ymin: 0, ymax: 0 } };

  const tmp = new PointBuffer(capacity);
  poseStatics(statics, 2, 0, new Float32Array(bq.stems), 0, tmp);
  for (const f of flowers) poseHead(f, 1, 2, 0, 0, 0, tmp);
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
