import type { Metadata } from "next";
import Link from "next/link";
import AsciiRain from "@/components/AsciiRain";

export const metadata: Metadata = {
  title: "Página não encontrada · Letraria",
  robots: { index: false },
};

const GLYPHS: Record<string, string[]> = {
  "4": ["#   #", "#   #", "#####", "    #", "    #"],
  "0": [" ### ", "#   #", "#   #", "#   #", " ### "],
};

// Mesma textura do logo: cada "#" vira duas letras variadas.
const NUMBER = [0, 1, 2, 3, 4]
  .map((r) =>
    [..."404"]
      .map((c) => GLYPHS[c][r])
      .join("  ")
      .split("")
      .map((c, i) => (c === "#" ? "@#%&"[(2 * i + r) % 4] + "@#%&"[(2 * i + 1 + r) % 4] : "  "))
      .join(""),
  )
  .join("\n");

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <AsciiRain className="pointer-events-none absolute inset-0 h-full w-full opacity-25" />
      <main className="relative z-10 flex flex-col items-center text-center">
        <h1 aria-label="404" className="m-0">
          <pre
            aria-hidden
            className="gold-text inline-block font-mono text-[min(18px,calc((100vw-2.5rem)/38))] font-bold leading-[1.1]"
          >
            {NUMBER}
          </pre>
        </h1>
        <p className="mt-8 font-display text-2xl text-slate-100 sm:text-3xl">Essa página se perdeu entre as letras.</p>
        <p className="mt-3 max-w-md text-slate-400">O endereço não existe ou foi trocado. Volte à galeria para ver as obras.</p>
        <Link
          href="/"
          className="mt-8 rounded-full border border-gold/40 px-5 py-2 font-mono text-sm text-gold transition hover:border-gold hover:bg-gold/10"
        >
          ← Galeria
        </Link>
      </main>
    </div>
  );
}
