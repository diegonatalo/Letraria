import { smoothstep, SWAY_AMP } from "./animation";
import { clamp } from "./ascii";
import { CAM, LIGHT, MID, mix, type PointBuffer, rotation, type RGB } from "./lily";

/** Flor genérica de pétalas (girassol, rosa): cada pétala tem a sua própria forma, abertura e cor. */
export interface PetalSpec {
  az: number; // azimute (rad)
  len: number;
  wid: number; // meia-largura
  th0c: number; // ângulo com o eixo, fechada
  th0o: number; // ... aberta
  curl: number; // curvatura para trás (aberta)
  oMax: number; // até onde esta pétala se abre (0 fica sempre fechada)
  start: number; // atraso da abertura (0..0.5)
  span: number; // arco que cobre quando enrolada em volta do eixo
  rc: number; // raio do cilindro quando fechada
  zoff: number; // altura da base no eixo
  r0: number; // raio onde a base nasce
  center: RGB;
  base: RGB;
  tip: RGB;
  rib: number; // força da nervura clara
  dark: number; // escurece o brilho (pétalas internas)
}

export interface DiscSpec {
  radius: number;
  count: number;
  inner: RGB;
  mid: RGB;
  rim: RGB;
}

export interface BloomSpec {
  x: number; y: number; z: number; size: number; yaw: number; pitch: number; roll: number;
  petals: PetalSpec[];
  round: boolean;
  cup: number; // bordas levantadas
  sp?: number; // espaçamento das amostras (menor = mais denso)
  disc?: DiscSpec;
}

export interface Bloom {
  cx: number; cy: number; cz: number; size: number; yaw: number; pitch: number; roll: number;
  h: number; gKey: number; delay: number; phase: number; sid: number;
  cup: number;
  np: number;
  az: Float32Array; len: Float32Array; wid: Float32Array; th0c: Float32Array; th0o: Float32Array; curl: Float32Array;
  oMax: Float32Array; start: Float32Array; span: Float32Array; rc: Float32Array; zoff: Float32Array; r0: Float32Array;
  n: number;
  u: Float32Array; v: Float32Array; w: Float32Array; pid: Uint8Array;
  r: Uint8Array; g: Uint8Array; b: Uint8Array; pl: Float32Array;
  dn: number;
  dx: Float32Array; dy: Float32Array; dz: Float32Array;
  dr: Uint8Array; dg: Uint8Array; db: Uint8Array; dl: Float32Array;
}

const SP = 0.004;
const N = 12;
const WHITE: RGB = [255, 244, 214];

const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function buildBloom(spec: BloomSpec, ytop: number, rnd: () => number, sid: number): Bloom {
  const sp = (spec.sp ?? SP) / spec.size;
  const u: number[] = [], v: number[] = [], w: number[] = [], pid: number[] = [];
  const r: number[] = [], g: number[] = [], b: number[] = [], pl: number[] = [];

  spec.petals.forEach((p, id) => {
    const nv = Math.max(2, Math.ceil(p.len / sp));
    const nu = Math.max(2, Math.ceil((2 * p.wid) / sp));
    for (let iv = 0; iv < nv; iv++) {
      for (let iu = 0; iu < nu; iu++) {
        const vv = (iv + rnd()) / nv;
        const uu = -1 + (2 * (iu + rnd())) / nu;
        const au = Math.abs(uu);
        let c: RGB = mix(p.center, p.base, smoothstep(0, 0.6, vv));
        c = mix(c, p.tip, smoothstep(0.7, 1, vv));
        let lum = 0.1 + 0.28 * Math.sin(Math.PI * Math.min(1, vv * 1.1)) - p.dark;
        if (au < 0.1 + 0.05 * (1 - vv)) {
          c = mix(c, WHITE, p.rib);
          lum += 0.1 * p.rib * 3;
        } else if (au > 0.86) lum -= 0.08;
        const vein = Math.cos(uu * 11 + id);
        if (vein > 0.8) lum += 0.05;
        u.push(uu); v.push(vv);
        w.push(
          spec.round
            ? p.wid * Math.pow(Math.sin(Math.PI * Math.pow(vv, 0.9)), 0.45)
            : p.wid * Math.pow(Math.sin(Math.PI * Math.pow(vv, 0.8)), 0.7),
        );
        pid.push(id);
        r.push(c[0]); g.push(c[1]); b.push(c[2]);
        pl.push(lum);
      }
    }
  });

  // Miolo (girassol): pontos em espiral de Fibonacci, levemente abaulado.
  const dx: number[] = [], dy: number[] = [], dz: number[] = [];
  const dr: number[] = [], dg: number[] = [], db: number[] = [], dl: number[] = [];
  if (spec.disc) {
    const D = spec.disc;
    for (let i = 0; i < D.count; i++) {
      const f = Math.sqrt((i + 0.5) / D.count);
      const a = i * 2.399963;
      const rad = D.radius * f;
      dx.push(Math.cos(a) * rad); dy.push(Math.sin(a) * rad);
      dz.push(0.014 * (1 - f * f));
      let c: RGB = f < 0.55 ? mix(D.inner, D.mid, f / 0.55) : mix(D.mid, D.rim, (f - 0.55) / 0.45);
      let lum = 0.3 + 0.12 * f;
      // sementes: alternância escura/clara ao longo da espiral
      const seed = hash(Math.floor(i / 3), Math.floor(Math.sqrt(i) * 2.2));
      if (seed < 0.4) {
        c = [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6];
        lum -= 0.1;
      } else if (seed > 0.85) lum += 0.12;
      dr.push(c[0]); dg.push(c[1]); db.push(c[2]); dl.push(lum);
    }
  }

  const P = spec.petals;
  const f32 = (k: (p: PetalSpec) => number) => Float32Array.from(P.map(k));
  return {
    cx: spec.x, cy: spec.y, cz: spec.z, size: spec.size, yaw: spec.yaw, pitch: spec.pitch, roll: spec.roll,
    h: spec.y / ytop, gKey: (spec.y / ytop) * 0.85, delay: rnd() * 1.5, phase: rnd() * Math.PI * 2, sid,
    cup: spec.cup,
    np: P.length,
    az: f32((p) => p.az), len: f32((p) => p.len), wid: f32((p) => p.wid), th0c: f32((p) => p.th0c), th0o: f32((p) => p.th0o),
    curl: f32((p) => p.curl), oMax: f32((p) => p.oMax), start: f32((p) => p.start), span: f32((p) => p.span),
    rc: f32((p) => p.rc), zoff: f32((p) => p.zoff), r0: f32((p) => p.r0),
    n: u.length,
    u: Float32Array.from(u), v: Float32Array.from(v), w: Float32Array.from(w), pid: Uint8Array.from(pid),
    r: Uint8Array.from(r), g: Uint8Array.from(g), b: Uint8Array.from(b), pl: Float32Array.from(pl),
    dn: dx.length,
    dx: Float32Array.from(dx), dy: Float32Array.from(dy), dz: Float32Array.from(dz),
    dr: Uint8Array.from(dr), dg: Uint8Array.from(dg), db: Uint8Array.from(db), dl: Float32Array.from(dl),
  };
}

const R = new Float64Array(9);
const RAD = new Float32Array(64 * (N + 1));
const AX = new Float32Array(64 * (N + 1));
const LAMB = new Float32Array(64 * N);
const WRAP = new Float32Array(64);
const CD = new Float32Array(64);
const SD = new Float32Array(64);

export function poseBloom(f: Bloom, open: number, P: number, t: number, term: number, gate: number, out: PointBuffer) {
  const bud = smoothstep(f.gKey - 0.03, f.gKey + 0.12, P);
  if (bud <= 0) return;
  const wob = gate * term;
  const sway = SWAY_AMP * wob * Math.pow(f.h, 1.5);
  const cx = f.cx + sway;
  const cz = f.cz + sway * 0.3;
  const cy = f.cy;
  const sc = f.size * (0.55 + 0.45 * bud);
  rotation(f.yaw + 0.1 * wob, f.pitch + 0.04 * wob, f.roll, R);
  const R0 = R[0], R1 = R[1], R2 = R[2], R3 = R[3], R4 = R[4], R5 = R[5], R6 = R[6], R7 = R[7], R8 = R[8];

  for (let p = 0; p < f.np; p++) {
    const cd = Math.cos(f.az[p]), sd = Math.sin(f.az[p]);
    CD[p] = cd;
    SD[p] = sd;
    const oi = f.oMax[p] * smoothstep(f.start[p], f.start[p] + 0.5, open);
    const th0 = f.th0c[p] + (f.th0o[p] - f.th0c[p]) * oi;
    const cu = f.curl[p] * oi;
    const st = f.len[p] / N;
    let rad = f.r0[p];
    let ax = f.zoff[p];
    const o = p * (N + 1);
    RAD[o] = rad;
    AX[o] = ax;
    for (let k = 0; k < N; k++) {
      const vm = (k + 0.5) / N;
      const th = th0 + cu * vm * vm;
      const s = Math.sin(th), c = Math.cos(th);
      rad += st * s;
      ax += st * c;
      RAD[o + k + 1] = rad;
      AX[o + k + 1] = ax;
      const nx = -c * cd, ny = -c * sd, nz = s;
      const wx = R0 * nx + R1 * ny + R2 * nz, wy = R3 * nx + R4 * ny + R5 * nz, wz = R6 * nx + R7 * ny + R8 * nz;
      LAMB[p * N + k] = Math.abs(wx * LIGHT[0] + wy * LIGHT[1] + wz * LIGHT[2]);
    }
    WRAP[p] = 1 - smoothstep(0, 0.55, oi);
  }

  const breath = 1.6 * t + f.phase;
  for (let i = 0; i < f.n; i++) {
    const p = f.pid[i];
    const vf = f.v[i] * N;
    let k = vf | 0;
    if (k >= N) k = N - 1;
    const fr = vf - k;
    const o = p * (N + 1) + k;
    const rad = RAD[o] + (RAD[o + 1] - RAD[o]) * fr;
    const ax = AX[o] + (AX[o + 1] - AX[o]) * fr;
    const lat = f.u[i] * f.w[i];
    const cup = f.cup * lat * lat;
    const cd = CD[p], sd = SD[p];
    let lamb = LAMB[p * N + k];
    let lx = cd * (rad - cup * 0.3) - sd * lat;
    let ly = sd * (rad - cup * 0.3) + cd * lat;
    let lz = ax + cup;
    const wr = WRAP[p];
    if (wr > 0.001) {
      const ang = f.az[p] + f.u[i] * f.span[p];
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const Rb = f.rc[p] * (f.w[i] / f.wid[p]);
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

  if (f.dn) {
    const lambD = Math.abs(R2 * LIGHT[0] + R5 * LIGHT[1] + R8 * LIGHT[2]);
    for (let i = 0; i < f.dn; i++) {
      const lx = f.dx[i], ly = f.dy[i], lz = f.dz[i];
      const wx = cx + sc * (R0 * lx + R1 * ly + R2 * lz);
      const wy = cy + sc * (R3 * lx + R4 * ly + R5 * lz);
      const wz = cz + sc * (R6 * lx + R7 * ly + R8 * lz);
      const j = out.n++;
      const q = CAM / (CAM - wz);
      out.x[j] = wx * q;
      out.y[j] = (wy - MID) * q + MID;
      out.z[j] = wz;
      out.lum[j] = clamp(0.2 + 0.45 * lambD + f.dl[i], 0, 1) * (1 + 0.04 * Math.sin(breath + i));
      out.r[j] = f.dr[i];
      out.g[j] = f.dg[i];
      out.b[j] = f.db[i];
      out.ch[j] = 0;
    }
  }
}
