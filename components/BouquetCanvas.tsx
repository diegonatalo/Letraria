"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { growthProgress, openProgress, swayGate, swayTerm, TIMELINE_END } from "@/lib/animation";
import { clamp, FONT, RAMP } from "@/lib/ascii";
import { type Engine, PointBuffer, poseStatics } from "@/lib/lily";

const BG = "#050505";
const RADIUS = 80; // raio de repulsão do mouse (px)
const STARS = 140;
const GLYPHS = Array.from({ length: 128 }, (_, i) => String.fromCharCode(i));

interface Props<F extends { delay: number; sid: number }> {
  engine: Engine<F>;
  title: string;
  subtitle: string;
  label: string;
  mouse?: boolean; // letras fogem do cursor
  grid?: { div: number; min: number; max: number }; // tamanho da fonte: altura / div, entre min e max (px)
}

const DEFAULT_GRID = { div: 170, min: 5, max: 8 };

export default function BouquetCanvas<F extends { delay: number; sid: number }>({ engine, title, subtitle, label, mouse: mouseFx = true, grid = DEFAULT_GRID }: Props<F>) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef(0);
  const [done, setDone] = useState(false);
  const [reduced, setReduced] = useState(false);

  const replay = useCallback(() => {
    startRef.current = performance.now();
    setDone(false);
  }, []);

  useEffect(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const motionOff = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(motionOff);
    startRef.current = performance.now();

    const bq = engine.build();
    const out = new PointBuffer(bq.capacity);
    const terms = new Float32Array(bq.stems);
    const phases = Float32Array.from({ length: bq.stems }, (_, i) => (i * 2.399) % (Math.PI * 2));

    const rnd = (() => {
      let a = 99;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })();
    const stars = Array.from({ length: STARS }, () => ({ x: rnd(), y: rnd(), ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.8, s: rnd() < 0.15 ? 2 : 1 }));

    let W = 0;
    let H = 0;
    let dpr = 1;
    let fontPx = 10;
    let cw = 6;
    let cols = 0;
    let rows = 0;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let owner = new Int32Array(0);
    let zbuf = new Float32Array(0);
    let dispX = new Float32Array(0);
    let dispY = new Float32Array(0);
    let velX = new Float32Array(0);
    let velY = new Float32Array(0);
    let bKey = new Int32Array(0);
    let bX = new Float32Array(0);
    let bY = new Float32Array(0);
    let bCh = new Uint8Array(0);
    let order = new Int32Array(0);
    const counts = new Int32Array(32769);
    const mouse = { x: -1e4, y: -1e4, on: false };

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.clientWidth;
      H = box.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      fontPx = clamp(Math.round(H / grid.div), grid.min, grid.max);
      ctx.font = `bold ${fontPx * dpr}px ${FONT}`;
      cw = ctx.measureText("M").width / dpr;
      cols = Math.max(1, Math.floor(W / cw));
      rows = Math.max(1, Math.floor(H / fontPx));
      const n = cols * rows;
      owner = new Int32Array(n);
      zbuf = new Float32Array(n);
      dispX = new Float32Array(n);
      dispY = new Float32Array(n);
      velX = new Float32Array(n);
      velY = new Float32Array(n);
      bKey = new Int32Array(n);
      bX = new Float32Array(n);
      bY = new Float32Array(n);
      bCh = new Uint8Array(n);
      order = new Int32Array(n);

      const b = bq.bounds;
      scale = Math.min((H * 0.7) / (b.ymax - b.ymin), (W * 0.92) / (b.xmax - b.xmin));
      ox = W / 2 - ((b.xmin + b.xmax) / 2) * scale;
      oy = H / 2 + ((b.ymin + b.ymax) / 2) * scale;
      if (motionOff) frame(performance.now(), true);
    };

    const render = (t: number, still: boolean) => {
      const P = still ? 1.2 : growthProgress(t);
      const gate = still ? 0 : swayGate(t);
      for (let i = 0; i < terms.length; i++) terms[i] = swayTerm(t, phases[i]);
      out.n = 0;
      poseStatics(bq.statics, P, t, terms, gate, out);
      for (const f of bq.flowers) engine.poseFlower(f, still ? 1 : openProgress(t, f.delay), P, t, terms[f.sid], gate, out);

      // Um caractere por célula: vence o ponto mais próximo do espectador.
      owner.fill(-1);
      zbuf.fill(-1e9);
      const ix = 1 / cw;
      const iy = 1 / fontPx;
      for (let i = 0; i < out.n; i++) {
        const c = ((ox + out.x[i] * scale) * ix) | 0;
        const r = ((oy - out.y[i] * scale) * iy) | 0;
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        const k = r * cols + c;
        if (out.z[i] > zbuf[k]) {
          zbuf[k] = out.z[i];
          owner[k] = i;
        }
      }

      // Mola: os caracteres perto do cursor são empurrados e voltam.
      const dt = 1 / 60;
      const n = cols * rows;
      if (mouse.on && !still) {
        const c0 = Math.max(0, Math.floor((mouse.x - RADIUS) / cw));
        const c1 = Math.min(cols - 1, Math.ceil((mouse.x + RADIUS) / cw));
        const r0 = Math.max(0, Math.floor((mouse.y - RADIUS) / fontPx));
        const r1 = Math.min(rows - 1, Math.ceil((mouse.y + RADIUS) / fontPx));
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const dx = (c + 0.5) * cw - mouse.x;
            const dy = (r + 0.5) * fontPx - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d >= RADIUS) continue;
            const f = 1 - d / RADIUS;
            const k = r * cols + c;
            const push = (f * f * 5200 * dt) / (d || 1);
            velX[k] += dx * push;
            velY[k] += dy * push;
          }
        }
      }
      if (!still) {
        for (let k = 0; k < n; k++) {
          if (dispX[k] === 0 && dispY[k] === 0 && velX[k] === 0 && velY[k] === 0) continue;
          velX[k] += (-130 * dispX[k] - 12 * velX[k]) * dt;
          velY[k] += (-130 * dispY[k] - 12 * velY[k]) * dt;
          dispX[k] += velX[k] * dt;
          dispY[k] += velY[k] * dt;
          if (Math.abs(dispX[k]) < 0.02 && Math.abs(dispY[k]) < 0.02 && Math.abs(velX[k]) < 0.05 && Math.abs(velY[k]) < 0.05) {
            dispX[k] = dispY[k] = velX[k] = velY[k] = 0;
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#fff";
      for (const s of stars) {
        ctx.globalAlpha = still ? 0.4 : 0.12 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
        ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
      }
      ctx.globalAlpha = 1;

      ctx.font = `bold ${fontPx}px ${FONT}`;
      ctx.textBaseline = "top";
      const hover = mouse.on && !still;
      // Agrupa as células por cor (ordenação por contagem): uma troca de fillStyle por cor, não por caractere.
      let m = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = r * cols + c;
          const i = owner[k];
          if (i < 0) continue;
          const x = c * cw;
          const y = r * fontPx;
          let lum = out.lum[i];
          let hv = 0;
          if (hover) {
            const d = Math.hypot(x + cw / 2 - mouse.x, y + fontPx / 2 - mouse.y);
            if (d < RADIUS) hv = 1 - d / RADIUS;
          }
          lum = clamp(lum + hv * 0.4, 0, 1);
          const f = 0.5 + 0.7 * lum;
          const w = hv * 70;
          let rr = out.r[i] * f + w;
          let gg = out.g[i] * f + w;
          let bb = out.b[i] * f + w;
          rr = rr > 255 ? 255 : rr;
          gg = gg > 255 ? 255 : gg;
          bb = bb > 255 ? 255 : bb;
          const key = (((rr as number) >> 3) << 10) | ((gg >> 3) << 5) | (bb >> 3);
          bKey[m] = key;
          bX[m] = x + dispX[k];
          bY[m] = y + dispY[k];
          const code = out.ch[i];
          bCh[m] = code || RAMP.charCodeAt(Math.min(RAMP.length - 1, (lum * RAMP.length) | 0));
          counts[key + 1]++;
          m++;
        }
      }
      for (let k = 0; k < 32768; k++) counts[k + 1] += counts[k];
      for (let j = 0; j < m; j++) order[counts[bKey[j]]++] = j;
      let last = -1;
      for (let q = 0; q < m; q++) {
        const j = order[q];
        const key = bKey[j];
        if (key !== last) {
          last = key;
          ctx.fillStyle = `rgb(${(key >> 10) << 3},${((key >> 5) & 31) << 3},${(key & 31) << 3})`;
        }
        ctx.fillText(GLYPHS[bCh[j]], bX[j], bY[j]);
      }
      counts.fill(0);
    };

    let raf = 0;
    let finished = false;
    function frame(now: number, still = false) {
      const t = (now - startRef.current) / 1000;
      render(t, still);
      if (still) return;
      const end = t > TIMELINE_END + 0.5;
      if (end && !finished) {
        finished = true;
        setDone(true);
      } else if (!end) finished = false;
      raf = requestAnimationFrame((n) => frame(n));
    }

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(box);
    if (!motionOff) raf = requestAnimationFrame((n) => frame(n));

    const rect = () => canvas.getBoundingClientRect();
    const move = (e: PointerEvent) => {
      const b = rect();
      mouse.x = e.clientX - b.left;
      mouse.y = e.clientY - b.top;
      mouse.on = true;
    };
    const leave = () => {
      mouse.on = false;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") leave();
    };
    if (mouseFx) {
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerdown", move);
      canvas.addEventListener("pointerleave", leave);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", leave);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", leave);
    };
  }, [engine, mouseFx, grid]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div ref={boxRef} className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="block touch-none"
          aria-label={label}
          role="img"
        />
      </div>
      <footer
        className={`flex items-center justify-between gap-4 px-4 py-3 transition-opacity duration-1000 sm:px-6 ${done || reduced ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div>
          <h1 className="font-display text-xl leading-tight text-rose-100 sm:text-2xl">{title}</h1>
          <p className="font-mono text-xs text-rose-200/60">{subtitle}</p>
        </div>
        {!reduced && (
          <button
            onClick={replay}
            className="inline-flex items-center gap-2 rounded-full border border-rose-900 px-4 py-1.5 font-mono text-xs text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
          >
            <span aria-hidden>↻</span> Repetir
          </button>
        )}
      </footer>
    </div>
  );
}
