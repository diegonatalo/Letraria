"use client";

import { useEffect, useRef } from "react";
import { FONT, RAMP, clamp } from "@/lib/ascii";

const COLS = 72;

/** Miniatura em ASCII: desenha a pintura uma vez e, com o mouse em cima do cartão, faz ela cintilar. */
export default function AsciiThumb({ src }: { src: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let cancelled = false;
    let raf = 0;
    let ro: ResizeObserver | undefined;
    const host: HTMLElement = box.closest("a") ?? box;
    const cache = new Map<number, string>();
    const color = (r: number, g: number, b: number) => {
      const key = (r << 16) | (g << 8) | b;
      let s = cache.get(key);
      if (!s) cache.set(key, (s = `rgb(${r},${g},${b})`));
      return s;
    };

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const W0 = img.naturalWidth;
      const H0 = img.naturalHeight;
      const c = document.createElement("canvas");
      c.width = W0;
      c.height = H0;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const px = cx.getImageData(0, 0, W0, H0).data;

      let dpr = 1;
      let W = 0;
      let H = 0;
      let rows = 0;
      let cw = 0;
      let ch = 0;
      let fontPx = 0;
      let offY = 0;

      const render = (t: number, live: boolean) => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#02040a";
        ctx.fillRect(0, 0, W, H);
        ctx.font = `bold ${fontPx}px ${FONT}`;
        ctx.textBaseline = "top";
        // Recorte "cover": a imagem preenche o cartão sem distorcer.
        const boxAspect = (COLS * cw) / (rows * ch);
        const imgAspect = W0 / H0;
        const ur = imgAspect > boxAspect ? boxAspect / imgAspect : 1;
        const vr = imgAspect > boxAspect ? 1 : imgAspect / boxAspect;
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < COLS; i++) {
            let r = 0;
            let g = 0;
            let b = 0;
            for (let s = 0; s < 4; s++) {
              const u = 0.5 + (((i + 0.25 + (s & 1) * 0.5) / COLS - 0.5) * ur);
              const v = 0.5 + (((j + 0.25 + (s >> 1) * 0.5) / rows - 0.5) * vr);
              const wob = live ? 0.004 * Math.sin(v * 40 + t * 2.4) : 0;
              const x = clamp(Math.floor((u + wob) * W0), 0, W0 - 1);
              const y = clamp(Math.floor(v * H0), 0, H0 - 1);
              const k = (y * W0 + x) * 4;
              r += px[k];
              g += px[k + 1];
              b += px[k + 2];
            }
            r /= 4;
            g /= 4;
            b /= 4;
            let lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            if (live && lum > 0.55) lum += 0.12 * Math.sin(t * 3 + i * 1.7 + j * 2.3);
            lum = clamp(Math.pow(clamp(lum, 0, 1), 0.55), 0, 1);
            const x0 = i * cw;
            const y0 = offY + j * ch;
            ctx.fillStyle = color((r * 0.42) & 0xf8, (g * 0.42) & 0xf8, (b * 0.42) & 0xf8);
            ctx.fillRect(x0, y0, cw + 0.5, ch + 0.5);
            const boost = clamp(215 / Math.max(r, g, b, 1), 1, 2.2);
            ctx.fillStyle = color(clamp(r * boost, 0, 255) & 0xf8, clamp(g * boost, 0, 255) & 0xf8, clamp(b * boost, 0, 255) & 0xf8);
            ctx.fillText(RAMP[clamp(Math.floor(lum * RAMP.length), 0, RAMP.length - 1)], x0, y0);
          }
        }
      };

      const layout = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = box.clientWidth;
        H = box.clientHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        fontPx = W / (COLS * 0.6);
        ctx.font = `bold ${fontPx * dpr}px ${FONT}`;
        cw = W / COLS;
        ch = fontPx;
        rows = Math.max(1, Math.floor(H / ch));
        offY = (H - rows * ch) / 2;
        render(0, false);
      };
      layout();
      ro = new ResizeObserver(layout);
      ro.observe(box);

      const loop = (now: number) => {
        render(now / 1000, true);
        raf = requestAnimationFrame(loop);
      };
      const start = () => {
        if (!raf && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) raf = requestAnimationFrame(loop);
      };
      const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        render(0, false);
      };
      host.addEventListener("mouseenter", start);
      host.addEventListener("mouseleave", stop);
      host.addEventListener("focus", start);
      host.addEventListener("blur", stop);
      cleanup = () => {
        host.removeEventListener("mouseenter", start);
        host.removeEventListener("mouseleave", stop);
        host.removeEventListener("focus", start);
        host.removeEventListener("blur", stop);
      };
    };
    let cleanup = () => {};
    img.src = src;

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      cleanup();
    };
  }, [src]);

  return (
    <div ref={boxRef} className="absolute inset-0 bg-night">
      <canvas ref={canvasRef} aria-hidden className="block" />
    </div>
  );
}
