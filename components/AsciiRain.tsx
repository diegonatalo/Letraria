"use client";

import { useEffect, useRef } from "react";
import { FONT } from "@/lib/ascii";

const CELL = 16;
const GLYPHS = "LETRARIA·TEAMO♥*+:.";

/** Chuva de letras bem discreta, só para dar vida ao fundo da galeria. */
export default function AsciiRain({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cols = 0;
    let heads: number[] = [];
    let rows = 0;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      cols = Math.ceil(canvas.width / CELL);
      rows = Math.ceil(canvas.height / CELL);
      heads = Array.from({ length: cols }, () => -Math.floor(Math.random() * rows));
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let last = 0;
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 110) return;
      last = now;
      ctx.fillStyle = "rgba(2,4,10,0.16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `bold ${CELL - 2}px ${FONT}`;
      ctx.textBaseline = "top";
      for (let i = 0; i < cols; i++) {
        const y = heads[i];
        if (y >= 0 && y < rows) {
          ctx.fillStyle = "rgb(245,199,106)";
          ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * CELL, y * CELL);
        }
        // Colunas sorteadas esperam um pouco antes de recomeçar.
        if (y <= rows + 2) heads[i] = y + 1;
        else if (Math.random() < 0.04) heads[i] = -1;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
