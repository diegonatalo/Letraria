"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_ROWS = 130; // limita a grade em obras verticais

const RAMP = ".,:;-=+*xo#%&@";
const ZOOM_START = 16;
const DELAY = 0.8; // segundos parado no zoom máximo
const DURATION = 11; // segundos até a obra completa
const FRAME_X = 5; // espessura da moldura em células (as células são ~0,6x mais estreitas que altas)
const FRAME_Y = 3;
const FONT = 'Consolas, "Cascadia Mono", "Courier New", monospace';

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type Props = {
  /** Imagem de origem (caminho em /public). */
  src: string;
  title: string;
  /** Linha de crédito exibida ao final, ex.: "Vincent van Gogh, 1889". */
  credit: string;
  /** Texto "Sobre a obra": um parágrafo por item. */
  about?: string[];
  /** Link do arquivo de origem da imagem. */
  source?: string;
};

export default function AsciiArtwork({ src, title, credit, about, source }: Props) {
  const dimsRef = useRef({ w: 1, h: 1 });
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Uint8ClampedArray | null>(null);
  const startRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (!aboutOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAboutOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen]);

  const replay = useCallback(() => {
    startRef.current = performance.now();
    setDone(false);
  }, []);

  // Carrega a pintura e lê seus pixels uma vez.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const SRC_W = img.naturalWidth;
      const SRC_H = img.naturalHeight;
      dimsRef.current = { w: SRC_W, h: SRC_H };
      c.width = SRC_W;
      c.height = SRC_H;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0, SRC_W, SRC_H);
      pixelsRef.current = cx.getImageData(0, 0, SRC_W, SRC_H).data;
      startRef.current = performance.now();
      setReady(true);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!ready) return;
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pixels = pixelsRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { w: SRC_W, h: SRC_H } = dimsRef.current;
    const aspect = SRC_W / SRC_H;

    let cols = 0;
    let rows = 0;
    let cw = 0;
    let ch = 0;
    let fontPx = 0;
    let offX = 0;
    let offY = 0;
    let frameX = 0;
    let frameY = 0;
    let totalCols = 0;
    let totalRows = 0;
    let dpr = 1;
    const colorCache = new Map<number, string>();
    const bgCache = new Map<number, string>();

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = box.clientWidth;
      const H = box.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      const ratio = 0.6; // largura/altura do glifo monoespaçado
      totalCols = clamp(Math.floor(W / 6), 70, 230);
      cols = Math.min(totalCols - 2 * FRAME_X, Math.floor((MAX_ROWS * aspect) / ratio));
      totalCols = cols + 2 * FRAME_X;
      rows = Math.round((cols * ratio) / aspect);
      totalRows = rows + 2 * FRAME_Y;
      fontPx = Math.min(W / (totalCols * ratio), H / totalRows);
      ctx.font = `bold ${fontPx * dpr}px ${FONT}`;
      cw = ctx.measureText("M").width / dpr;
      ch = fontPx;
      frameX = (W - totalCols * cw) / 2;
      frameY = (H - totalRows * ch) / 2;
      offX = frameX + FRAME_X * cw;
      offY = frameY + FRAME_Y * ch;
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(box);

    const sample = (u: number, v: number, out: number[]) => {
      const x = clamp(Math.floor(u * SRC_W), 0, SRC_W - 1);
      const y = clamp(Math.floor(v * SRC_H), 0, SRC_H - 1);
      const i = (y * SRC_W + x) * 4;
      out[0] += pixels[i];
      out[1] += pixels[i + 1];
      out[2] += pixels[i + 2];
    };

    // Moldura dourada: anéis concêntricos com chanfro (claro em cima/esquerda, escuro embaixo/direita).
    const drawFrame = (t: number) => {
      ctx.textBaseline = "top";
      for (let j = 0; j < totalRows; j++) {
        const dy = Math.min(j, totalRows - 1 - j);
        for (let i = 0; i < totalCols; i++) {
          const dx = Math.min(i, totalCols - 1 - i);
          if (dx >= FRAME_X && dy >= FRAME_Y) continue;
          const d = Math.min(dx * 0.6, dy); // distância física até a borda externa
          const corner = dx < FRAME_X && dy < FRAME_Y;
          const lit = i + j < (totalCols + totalRows) / 2 ? 1 : 0.55; // luz vinda do canto superior esquerdo
          let ch2: string;
          let tone: number;
          if (d < 0.6) {
            ch2 = (i + j) % 2 ? "#" : "@";
            tone = 0.8;
          } else if (d < 1.5) {
            ch2 = corner ? "&" : "~o"[(i + j) % 2];
            tone = 1;
          } else if (d < 2.4) {
            ch2 = corner ? "%" : "=-"[(i >> 1) % 2];
            tone = 0.9;
          } else {
            ch2 = (i + j) % 2 ? "'" : ".";
            tone = 0.6;
          }
          const shine = 0.85 + 0.15 * Math.sin(t * 1.6 + (i + j) * 0.25);
          const f = tone * lit * shine;
          const r = clamp(255 * f, 0, 255) | 0;
          const g = clamp(200 * f, 0, 255) | 0;
          const b = clamp(70 * f, 0, 255) | 0;
          const x = frameX + i * cw;
          const y = frameY + j * ch;
          ctx.fillStyle = `rgb(${r * 0.28 | 0},${g * 0.24 | 0},${b * 0.2 | 0})`;
          ctx.fillRect(x, y, cw + 0.5, ch + 0.5);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(ch2, x, y);
        }
      }
    };

    let raf = 0;
    let finished = false;
    const acc = [0, 0, 0];

    const frame = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const p = reduced ? 1 : clamp((t - DELAY) / DURATION, 0, 1);
      if (p >= 1 && !finished) {
        finished = true;
        setDone(true);
      } else if (p < 1) finished = false;

      const e = easeInOut(p);
      const z = Math.exp(Math.log(ZOOM_START) * (1 - e));
      // O zoom é sempre centrado no meio da obra, sem deslocamento.
      const cx = 0.5;
      const cy = 0.5;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.font = `bold ${fontPx}px ${FONT}`;
      ctx.textBaseline = "top";

      const sub = z > 4 ? 1 : 2; // subamostras por eixo (antialiasing quando afastado)
      const n = RAMP.length;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const nu = (i + 0.5) / cols - 0.5;
          const nv = (j + 0.5) / rows - 0.5;
          // Ondulação suave, como se o céu respirasse.
          const wob = 0.0016 / Math.sqrt(z);
          const u = cx + nu / z + wob * Math.sin(nv * 22 + t * 1.3);
          const v = cy + nv / z + wob * Math.sin(nu * 18 - t * 1.1);
          acc[0] = acc[1] = acc[2] = 0;
          const stepU = 1 / (cols * z * sub);
          const stepV = 1 / (rows * z * sub);
          for (let sy = 0; sy < sub; sy++)
            for (let sx = 0; sx < sub; sx++) sample(u + (sx - (sub - 1) / 2) * stepU, v + (sy - (sub - 1) / 2) * stepV, acc);
          const k = sub * sub;
          let r = acc[0] / k;
          let g = acc[1] / k;
          let b = acc[2] / k;
          let lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          // Cintilação nas partes claras (estrelas, lua, janelas).
          const tw = lum > 0.55 ? 0.12 * Math.sin(t * 3 + i * 1.7 + j * 2.3) : 0;
          lum = clamp(Math.pow(lum, 0.55) + tw, 0, 1);
          const idx = clamp(Math.floor(lum * n), 0, n - 1);
          // Fundo: a cor da célula escurecida mantém a pintura legível; o glifo vai por cima, vivo.
          const bgKey = ((r * 0.42) << 16) | ((g * 0.42) << 8) | (b * 0.42);
          let bg = bgCache.get(bgKey);
          if (!bg) {
            bg = `rgb(${bgKey >> 16},${(bgKey >> 8) & 255},${bgKey & 255})`;
            bgCache.set(bgKey, bg);
          }
          ctx.fillStyle = bg;
          ctx.fillRect(offX + i * cw, offY + j * ch, cw + 0.5, ch + 0.5);
          const mx = Math.max(r, g, b, 1);
          const boost = clamp(215 / mx, 1, 2.2);
          r = clamp(r * boost, 0, 255) & 0xf8;
          g = clamp(g * boost, 0, 255) & 0xf8;
          b = clamp(b * boost, 0, 255) & 0xf8;
          const key = (r << 16) | (g << 8) | b;
          let style = colorCache.get(key);
          if (!style) {
            style = `rgb(${r},${g},${b})`;
            colorCache.set(key, style);
          }
          ctx.fillStyle = style;
          ctx.fillText(RAMP[idx], offX + i * cw, offY + j * ch);
        }
      }
      drawFrame(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ready]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div ref={boxRef} className="relative min-h-0 flex-1" onClick={replay}>
        <canvas ref={canvasRef} className="block" aria-label={`${title} em arte ASCII animada`} role="img" />
        {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-slate-400">carregando a pintura…</p>}
      </div>
      <footer
        className={`flex items-center justify-between gap-4 px-6 py-3 text-sm text-slate-300 transition-opacity duration-1000 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <span>
          <strong className="font-semibold text-amber-200">{title}</strong> · {credit}
        </span>
        <span className="flex gap-2">
          {about && (
            <button
              onClick={() => setAboutOpen(true)}
              className="rounded-full border border-amber-200/60 px-4 py-1 text-amber-100 transition hover:bg-amber-200/10"
            >
              Sobre a obra
            </button>
          )}
          <button
            onClick={replay}
            className="rounded-full border border-slate-600 px-4 py-1 text-slate-200 transition hover:border-amber-200 hover:text-amber-200"
          >
            ↻ Repetir zoom
          </button>
        </span>
      </footer>

      {about && aboutOpen && (
        <div className="absolute inset-0 z-20 flex justify-end bg-black/60" onClick={() => setAboutOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Sobre ${title}`}
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-950 p-6 text-slate-300 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-amber-100">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{credit}</p>
              </div>
              <button
                onClick={() => setAboutOpen(false)}
                aria-label="Fechar"
                className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 transition hover:border-amber-200 hover:text-amber-200"
              >
                ✕
              </button>
            </div>
            <div className="mt-6 space-y-5 text-[15px] leading-relaxed">
              {about.map((text, i) => (
                <section key={i}>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                    {["O contexto", "A mensagem", "Curiosidade"][i] ?? "Mais"}
                  </h3>
                  <p>{text}</p>
                </section>
              ))}
            </div>
            {source && (
              <p className="mt-8 text-xs text-slate-500">
                Imagem em domínio público,{" "}
                <a href={source} target="_blank" rel="noreferrer" className="underline hover:text-amber-200">
                  arquivo na Wikimedia Commons
                </a>
                .
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
