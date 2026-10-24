"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WORDS = [
  "TE AMO",
  "AMOR",
  "CARINHO",
  "MEU MUNDO",
  "SAUDADE",
  "ABRAÇO",
  "BEIJO",
  "TERNURA",
  "PARA SEMPRE",
  "AFETO",
  "PAIXÃO",
  "SORRISO",
  "CUIDADO",
  "MEU LAR",
  "<3",
  "COMPANHIA",
  "SONHO",
  "ENCANTO",
];

// Tons de vermelho, do bordô ao rosa-claro (t em 0..1).
const REDS: [number, number, number][] = [
  [70, 6, 16],
  [125, 10, 28],
  [178, 18, 42],
  [222, 30, 58],
  [255, 61, 90],
  [255, 110, 135],
  [255, 170, 185],
];

const HEART_ASPECT = 1.1; // largura/altura física do coração
const GLYPH_RATIO = 0.6; // largura/altura de um glifo monoespaçado
const FONT = 'Consolas, "Cascadia Mono", "Courier New", monospace';

const OUTLINE_START = 0.3; // s
const OUTLINE_TIME = 3.6;
const FILL_START = 3.4;
const FILL_TIME = 7.5;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** (x, y) matemáticos, y para cima: dentro do coração? */
const insideHeart = (x: number, y: number) => (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0;

const red = (t: number): [number, number, number] => {
  const f = clamp(t, 0, 1) * (REDS.length - 1);
  const i = Math.min(Math.floor(f), REDS.length - 2);
  const k = f - i;
  const a = REDS[i];
  const b = REDS[i + 1];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
};

export default function AsciiHeart() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef(0);
  const [done, setDone] = useState(false);

  const replay = useCallback(() => {
    startRef.current = performance.now();
    setDone(false);
  }, []);

  useEffect(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startRef.current = performance.now();

    let cols = 0;
    let rows = 0;
    let cw = 0;
    let ch = 0;
    let fontPx = 0;
    let offX = 0;
    let offY = 0;
    let dpr = 1;
    // Por célula: 0 fora, 1 interior, 2 contorno.
    let kind = new Uint8Array(0);
    // Texto: um fluxo circular de letras por linha, que desliza devagar depois de pronto.
    let rowChar: string[][] = [];
    let rowTone: Float32Array[] = []; // sorteio por palavra (0..1)
    let rowStart: number[] = [];
    let outlineKey = new Float32Array(0); // 0 (ponta de baixo) .. 1 (reentrância de cima)
    let depth = new Float32Array(0); // 0 na borda .. 1 no miolo
    let radial = new Float32Array(0); // 0 no centro .. 1 nas bordas (atraso do batimento)
    let spiral = new Float32Array(0); // 0 .. 1: raio relativo à borda naquela direção (ordem do preenchimento)
    const colorCache = new Map<number, string>();

    const rgb = (r: number, g: number, b: number) => {
      r = clamp(r, 0, 255) & 0xf8;
      g = clamp(g, 0, 255) & 0xf8;
      b = clamp(b, 0, 255) & 0xf8;
      const key = (r << 16) | (g << 8) | b;
      let s = colorCache.get(key);
      if (!s) colorCache.set(key, (s = `rgb(${r},${g},${b})`));
      return s;
    };

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = box.clientWidth;
      const H = box.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      cols = clamp(Math.floor(W / 9), 50, 130);
      rows = Math.round((cols * GLYPH_RATIO) / HEART_ASPECT);
      fontPx = Math.min(W / (cols * GLYPH_RATIO), H / rows);
      ctx.font = `bold ${fontPx * dpr}px ${FONT}`;
      cw = ctx.measureText("M").width / dpr;
      ch = fontPx;
      offX = (W - cols * cw) / 2;
      offY = (H - rows * ch) / 2;

      const n = cols * rows;
      kind = new Uint8Array(n);
      rowChar = [];
      rowTone = [];
      rowStart = [];
      outlineKey = new Float32Array(n);
      depth = new Float32Array(n);
      radial = new Float32Array(n);
      spiral = new Float32Array(n);

      const inside = (i: number, j: number) =>
        i >= 0 && j >= 0 && i < cols && j < rows && insideHeart(((i + 0.5) / cols - 0.5) * 2.4, -((j + 0.5) / rows) * 2.35 + 1.3);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          if (!inside(i, j)) continue;
          const edge = !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1);
          kind[j * cols + i] = edge ? 2 : 1;
          // Ângulo a partir da ponta de baixo: os dois lados sobem juntos até a reentrância.
          const mx = ((i + 0.5) / cols - 0.5) * 2.4;
          const my = -((j + 0.5) / rows) * 2.35 + 1.3;
          outlineKey[j * cols + i] = Math.atan2(Math.abs(mx), -(my - 0.35)) / Math.PI;
        }
      }

      // Profundidade: distância (em células) até o contorno, por varredura a partir das bordas.
      const dist = new Int16Array(n).fill(-1);
      const queue: number[] = [];
      for (let k = 0; k < n; k++) {
        if (kind[k] === 2) {
          dist[k] = 0;
          queue.push(k);
        }
      }
      let maxDist = 1;
      for (let q = 0; q < queue.length; q++) {
        const k = queue[q];
        const i = k % cols;
        const j = (k - i) / cols;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = i + di;
          const b = j + dj;
          if (a < 0 || b < 0 || a >= cols || b >= rows) continue;
          const m = b * cols + a;
          if (kind[m] !== 1 || dist[m] >= 0) continue;
          dist[m] = dist[k] + 1;
          maxDist = Math.max(maxDist, dist[m]);
          queue.push(m);
        }
      }
      let maxRadial = 1e-6;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          if (!kind[k]) continue;
          depth[k] = Math.max(0, dist[k]) / maxDist;
          radial[k] = Math.hypot((i + 0.5) / cols - 0.5, ((j + 0.5) / rows - 0.45) * 0.9);
          maxRadial = Math.max(maxRadial, radial[k]);
        }
      }
      for (let k = 0; k < n; k++) radial[k] /= maxRadial;

      // Distância relativa ao raio do coração naquela direção: a frente chega à borda junta em todas as direções.
      const BINS = 90;
      const edgeR = new Float32Array(BINS).fill(1e-6);
      const angle = new Float32Array(n);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          if (!kind[k]) continue;
          const a = Math.atan2(((j + 0.5) / rows - 0.45) * 0.9, (i + 0.5) / cols - 0.5); // cresce no sentido horário na tela
          angle[k] = a;
          const bin = Math.floor(((a + Math.PI) / (2 * Math.PI)) * BINS) % BINS;
          edgeR[bin] = Math.max(edgeR[bin], radial[k]);
        }
      }
      for (let k = 0; k < n; k++) {
        if (!kind[k]) continue;
        const bin = Math.floor(((angle[k] + Math.PI) / (2 * Math.PI)) * BINS) % BINS;
        const rn = Math.min(1, radial[k] / Math.max(edgeR[bin], (edgeR[(bin + BINS - 1) % BINS] + edgeR[(bin + 1) % BINS]) / 2));
        spiral[k] = rn;
      }

      // Texto: um fluxo de palavras por linha, embaralhado e deslocado para não alinhar na vertical.
      const rnd = mulberry32(14);
      for (let j = 0; j < rows; j++) {
        const chars: string[] = [];
        const tones: number[] = [];
        let w = Math.floor(rnd() * WORDS.length);
        while (chars.length < cols + 300) {
          const word = WORDS[w % WORDS.length];
          const t = word === "TE AMO" ? 0.95 : rnd();
          for (const c of word) {
            chars.push(c);
            tones.push(t);
          }
          chars.push(" ", " ");
          tones.push(t, t);
          w += 1 + Math.floor(rnd() * 5);
        }
        rowChar.push(chars);
        rowTone.push(Float32Array.from(tones));
        rowStart.push(Math.floor(rnd() * 12));
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(box);

    const gx: number[] = [];
    const gy: number[] = [];
    const gs: string[] = [];
    const gc: string[] = [];

    let raf = 0;
    let finished = false;

    const frame = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const outP = reduced ? 1 : easeInOut(clamp((t - OUTLINE_START) / OUTLINE_TIME, 0, 1));
      const fillP = reduced ? 1 : easeInOut(clamp((t - FILL_START) / FILL_TIME, 0, 1));
      const end = reduced || t > FILL_START + FILL_TIME + 0.5;
      if (end && !finished) {
        finished = true;
        setDone(true);
      } else if (!end) finished = false;

      // Batimento depois de pronto: dois pulsos curtos por ciclo, saindo do centro e chegando à borda.
      const beatAt = (r: number) => {
        // Começa a pulsar quando o preenchimento está quase no fim, entrando aos poucos.
        const gate = reduced ? 1 : clamp((t - (FILL_START + FILL_TIME * 0.75)) / 1.2, 0, 1);
        if (!gate) return 0;
        const ph = (((t * 0.9 - r * 0.1) % 1) + 1) % 1;
        return gate * Math.max(Math.exp(-(((ph - 0.05) / 0.05) ** 2)), 0.7 * Math.exp(-(((ph - 0.28) / 0.06) ** 2)));
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#07020a";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.font = `bold ${fontPx}px ${FONT}`;
      ctx.textBaseline = "top";

      // A cada pulso as letras do miolo são empurradas um pouco para longe do centro e voltam.
      const push = reduced ? 0 : ch * 0.2;
      const pcx = offX + (cols * cw) / 2;
      const pcy = offY + rows * ch * 0.45;
      const frontR = fillP * 1.12; // raio da frente do preenchimento: nasce no centro e chega à borda junta
      const pad = outP < 1 ? 0.03 : 0;
      let ng = 0; // letras do miolo ficam para depois dos fundos, para o empurrão do pulso não ser cortado pelas células vizinhas
      for (let j = 0; j < rows; j++) {
        const chars = rowChar[j];
        const tones = rowTone[j];
        const hv = 1 - j / rows; // 1 no topo, 0 embaixo: o vermelho clareia para cima
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          const kd = kind[k];
          if (!kd) continue;
          const x = offX + i * cw;
          const y = offY + j * ch;

          if (kd === 2) {
            const q = outlineKey[k];
            if (q > outP + pad) continue;
            // "Caneta": ponta quase branca e um rastro que esmaece até o rubi.
            const since = outP < 1 ? outP - q : 1;
            const m = outP < 1 ? Math.exp(-since * 9) : 0;
            const tip = m > 0.55;
            const beat = beatAt(radial[k]);
            const shine = 0.85 + 0.15 * Math.sin(t * 2 + i * 0.4 + j * 0.3);
            const f = (0.95 + 0.22 * beat) * shine;
            const [r, g, b] = red(0.62 + 0.2 * (1 - hv) + 0.05 * beat);
            const mm = Math.min(1, m * 1.15);
            ctx.fillStyle = rgb((r + (255 - r) * mm) * f, (g + (245 - g) * mm) * f, (b + (240 - b) * mm) * f);
            if (tip) {
              ctx.shadowColor = "rgba(255,170,190,0.95)";
              ctx.shadowBlur = 14;
            }
            ctx.fillText((i + j) % 2 ? "#" : "@", x, y);
            if (tip) ctx.shadowBlur = 0;
            continue;
          }

          const age = (frontR - spiral[k]) * rows * 0.5; // "linhas" desde que a frente passou por esta célula
          if (age < 0) continue;
          const flash = Math.exp(-age / 1.8) * (end ? 0 : 1);
          const si = (((i + rowStart[j]) % chars.length) + chars.length) % chars.length;
          const wv = tones[si];
          const beat = beatAt(radial[k]);
          // Luz de dentro: miolo bordô profundo, borda rosa-clara; a palavra só varia um pouco.
          const dp = depth[k];
          const base = clamp(0.9 - 0.62 * Math.pow(dp, 0.7) + 0.1 * (hv - 0.5) + 0.14 * (wv - 0.5) + 0.08 * beat, 0, 1);
          const wave = end ? 0.08 * Math.sin(t * 2.2 - j * 0.35 + i * 0.12) : 0;
          const f = (0.85 + 0.22 * wv + wave + 0.25 * beat) * Math.min(1, 0.4 + age * 0.3);
          const [r, g, b] = red(base);
          ctx.fillStyle = rgb(r * 0.16, g * 0.1, b * 0.12);
          ctx.fillRect(x, y, cw + 0.5, ch + 0.5);
          const c = chars[si];
          if (c !== " ") {
            const ux = x - pcx;
            const uy = y - pcy;
            const un = push * beat / (Math.hypot(ux, uy) || 1);
            gx[ng] = x + ux * un;
            gy[ng] = y + uy * un;
            gs[ng] = rgb((r + (255 - r) * flash) * f, (g + (235 - g) * flash) * f, (b + (240 - b) * flash) * f);
            gc[ng++] = c;
          }
        }
      }
      for (let g = 0; g < ng; g++) {
        ctx.fillStyle = gs[g];
        ctx.fillText(gc[g], gx[g], gy[g]);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div ref={boxRef} className="relative min-h-0 flex-1" onClick={replay}>
        <canvas ref={canvasRef} className="block" aria-label="Um coração desenhado com palavras de amor e carinho" role="img" />
      </div>
      <footer
        className={`flex items-center justify-between gap-4 px-4 py-3 transition-opacity duration-1000 sm:px-6 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div>
          <h1 className="font-display text-xl leading-tight text-rose-100 sm:text-2xl">Coração</h1>
          <p className="font-mono text-xs text-rose-200/60">palavras de amor e carinho</p>
        </div>
        <button
          onClick={replay}
          className="inline-flex items-center gap-2 rounded-full border border-rose-900 px-4 py-1.5 font-mono text-xs text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
        >
          <span aria-hidden>↻</span> Repetir
        </button>
      </footer>
    </div>
  );
}
