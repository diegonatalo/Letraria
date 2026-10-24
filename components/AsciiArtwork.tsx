"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FONT, RAMP, clamp } from "@/lib/ascii";

const MAX_ROWS = 130; // limita a grade em obras verticais

const ZOOM_START = 16;
const INTRO = 1.8; // segundos: a moldura se desenha e a pintura surge
const DELAY = 0.6; // segundos parado no zoom máximo, depois da introdução
const DURATION = 11; // segundos até a obra completa
const FRAME_X = 5; // espessura da moldura em células (as células são ~0,6x mais estreitas que altas)
const FRAME_Y = 3;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Neighbor = { href: string; title: string };

const SECTIONS = ["O contexto", "A mensagem", "Curiosidade"];

const ICON = "h-4 w-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]";
const ROUND_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-gold hover:text-gold";

type Props = {
  /** Imagem de origem (caminho em /public). */
  src: string;
  /** Miniatura, usada no topo do painel "Sobre a obra". */
  thumb?: string;
  /** Obra anterior e próxima, para percorrer a coleção. */
  nav?: { prev: Neighbor; next: Neighbor };
  title: string;
  /** Linha de crédito exibida ao final, ex.: "Vincent van Gogh, 1889". */
  credit: string;
  /** Texto "Sobre a obra": um parágrafo por item. */
  about?: string[];
  /** Link do arquivo de origem da imagem. */
  source?: string;
};

export default function AsciiArtwork({ src, thumb, nav, title, credit, about, source }: Props) {
  const dimsRef = useRef({ w: 1, h: 1 });
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Uint8ClampedArray | null>(null);
  const startRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [canFullscreen, setCanFullscreen] = useState(false);

  // iPhone/Safari não oferece tela cheia em páginas: nesse caso o botão nem aparece.
  useEffect(() => setCanFullscreen(!!document.fullscreenEnabled), []);

  useEffect(() => {
    if (!aboutOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAboutOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen]);

  // Repetir pula a introdução: a moldura já está pronta, só o zoom recomeça.
  const replay = useCallback(() => {
    startRef.current = performance.now() - INTRO * 1000;
    setDone(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const op = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    op.catch(() => {}); // o navegador pode recusar (ex.: janelas embutidas)
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
    const drawFrame = (t: number, ip: number) => {
      ctx.textBaseline = "top";
      for (let j = 0; j < totalRows; j++) {
        const dy = Math.min(j, totalRows - 1 - j);
        for (let i = 0; i < totalCols; i++) {
          const dx = Math.min(i, totalCols - 1 - i);
          if (dx >= FRAME_X && dy >= FRAME_Y) continue;
          // Na introdução a moldura se desenha em diagonal, do canto superior esquerdo, com uma "caneta" brilhante.
          const key = (i / totalCols + j / totalRows) / 2;
          if (key > ip) continue;
          const pen = ip < 1 ? clamp(1 - (ip - key) * 14, 0, 1) : 0;
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
          const f = tone * lit * shine * (1 + pen * 0.9);
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
      const p = reduced ? 1 : clamp((t - INTRO - DELAY) / DURATION, 0, 1);
      const ip = reduced ? 1 : clamp(t / (INTRO * 0.8), 0, 1) * 1.1; // progresso da moldura (passa de 1 para fechar os cantos)
      const alpha = reduced ? 1 : clamp((t - INTRO * 0.6) / 0.9, 0, 1); // a pintura surge de dentro da moldura
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
      ctx.globalAlpha = alpha;
      for (let j = 0; alpha > 0 && j < rows; j++) {
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
      ctx.globalAlpha = 1;
      drawFrame(t, ip);
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
        {!ready && (
          <p className="absolute inset-0 grid place-items-center font-mono text-sm text-slate-400">carregando a pintura…</p>
        )}
      </div>
      <footer
        className={`flex flex-col gap-3 px-4 pb-4 pt-2 transition-opacity duration-1000 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="min-w-0">
          <h1 className="font-display text-xl leading-tight text-gold-light sm:text-2xl">{title}</h1>
          <p className="font-mono text-xs text-slate-400">{credit}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {nav && (
            <>
              <Link href={nav.prev.href} aria-label={`Obra anterior: ${nav.prev.title}`} title={nav.prev.title} className={ROUND_BTN}>
                <svg viewBox="0 0 24 24" className={ICON} aria-hidden>
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </Link>
              <Link href={nav.next.href} aria-label={`Próxima obra: ${nav.next.title}`} title={nav.next.title} className={ROUND_BTN}>
                <svg viewBox="0 0 24 24" className={ICON} aria-hidden>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          )}
          {about && (
            <button
              onClick={() => setAboutOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 font-mono text-xs text-gold-light transition hover:bg-gold/20"
            >
              <span aria-hidden>✦</span> Sobre a obra
            </button>
          )}
          <button onClick={replay} aria-label="Repetir o zoom" title="Repetir o zoom" className={ROUND_BTN}>
            <svg viewBox="0 0 24 24" className={ICON} aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>
          {canFullscreen && (
            <button onClick={toggleFullscreen} aria-label="Tela cheia" title="Tela cheia" className={ROUND_BTN}>
              <svg viewBox="0 0 24 24" className={ICON} aria-hidden>
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </button>
          )}
        </div>
      </footer>

      {about && aboutOpen && (
        <div
          className="sheet-backdrop absolute inset-0 z-20 flex justify-end bg-black/70 backdrop-blur-[2px] max-sm:items-end"
          onClick={() => setAboutOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Sobre ${title}`}
            onClick={(e) => e.stopPropagation()}
            className="sheet overflow-y-auto border-gold/20 bg-night-2 text-slate-300 shadow-2xl max-sm:max-h-[88%] max-sm:w-full max-sm:rounded-t-2xl max-sm:border-t sm:h-full sm:w-full sm:max-w-md sm:border-l"
          >
            {thumb && (
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb} alt="" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-night-2 via-night-2/40 to-transparent" />
              </div>
            )}
            <div className={`px-6 pb-8 ${thumb ? "-mt-14 relative" : "pt-6"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl leading-tight text-gold-light">{title}</h2>
                  <p className="mt-1 font-mono text-xs text-slate-400">{credit}</p>
                </div>
                <button ref={closeRef} onClick={() => setAboutOpen(false)} aria-label="Fechar" className={ROUND_BTN}>
                  <svg viewBox="0 0 24 24" className={ICON} aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <p aria-hidden className="my-5 font-mono text-xs tracking-widest text-gold/50">
                ──── ✦ ────
              </p>
              <div className="space-y-6 text-[15px] leading-relaxed">
                {about.map((text, i) => (
                  <section key={i}>
                    <h3 className="mb-1.5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-gold">
                      <span className="text-gold/50">{String(i + 1).padStart(2, "0")}</span>
                      {SECTIONS[i] ?? "Mais"}
                    </h3>
                    <p>{text}</p>
                  </section>
                ))}
              </div>
              {source && (
                <p className="mt-8 text-xs text-slate-400">
                  Imagem em domínio público,{" "}
                  <a href={source} target="_blank" rel="noreferrer" className="underline hover:text-gold">
                    arquivo na Wikimedia Commons
                  </a>
                  .
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
