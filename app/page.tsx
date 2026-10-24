import Link from "next/link";
import AsciiLogo from "@/components/AsciiLogo";
import AsciiRain from "@/components/AsciiRain";
import AsciiThumb from "@/components/AsciiThumb";
import { WORKS, workThumb } from "@/lib/works";

// Miniatura em texto do coração, gerada na hora da renderização.
const heartPreview = (() => {
  const words = "TE AMO AMOR CARINHO ABRAÇO BEIJO ";
  const lines: string[] = [];
  let k = 0;
  for (let j = 0; j < 17; j++) {
    let line = "";
    for (let i = 0; i < 38; i++) {
      const x = ((i + 0.5) / 38 - 0.5) * 2.4;
      const y = 1.3 - ((j + 0.5) / 17) * 2.35;
      line += (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0 ? words[k++ % words.length] : " ";
    }
    lines.push(line);
  }
  return lines.join("\n");
})();

const CARD =
  "group relative flex h-full flex-col overflow-hidden rounded-xl border border-gold/15 bg-night-2/80 transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_8px_40px_-12px_rgba(245,199,106,0.35)]";

/** Cantos em ASCII, como uma moldura em miniatura. */
function Corners({ tone = "text-gold/70" }: { tone?: string }) {
  const base = `pointer-events-none absolute z-10 font-mono text-[11px] font-bold leading-none ${tone}`;
  return (
    <>
      <span aria-hidden className={`${base} left-1.5 top-1.5`}>
        +
      </span>
      <span aria-hidden className={`${base} right-1.5 top-1.5`}>
        +
      </span>
      <span aria-hidden className={`${base} bottom-1.5 left-1.5`}>
        +
      </span>
      <span aria-hidden className={`${base} bottom-1.5 right-1.5`}>
        +
      </span>
    </>
  );
}

export default function Galeria() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AsciiRain className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] w-full opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 py-12 sm:px-6">
        <header className="mb-14 pt-4">
          <AsciiLogo />
          <p className="mt-6 font-display text-2xl text-slate-100 sm:text-3xl">Pinturas escritas com letras.</p>
          <p className="mt-3 max-w-xl text-slate-400">
            Obras clássicas e formas desenhadas em arte ASCII colorida e animada. Escolha uma e veja o zoom revelar tudo.
          </p>
        </header>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORKS.map((w) => (
            <li key={w.slug}>
              <Link href={`/${w.slug}`} className={CARD}>
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  <AsciiThumb src={workThumb(w)} />
                  <Corners />
                </div>
                <div className="p-4">
                  <h2 className="font-display text-lg font-semibold text-slate-100 transition group-hover:text-gold">
                    {w.title}
                  </h2>
                  <p className="font-mono text-xs text-slate-400">
                    {w.artist}, {w.year}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{w.description}</p>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/coracao" className={CARD}>
              <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#07020a]">
                <pre
                  aria-hidden
                  className="heartbeat font-mono text-[clamp(6px,1.55vw,12px)] font-bold leading-[1.05] text-rose-500 transition group-hover:text-rose-300"
                >
                  {heartPreview}
                </pre>
                <Corners tone="text-rose-400/70" />
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg font-semibold text-slate-100 transition group-hover:text-gold">
                  Coração
                </h2>
                <p className="font-mono text-xs text-slate-400">palavras de carinho</p>
                <p className="mt-2 text-sm text-slate-400">
                  Um contorno que se preenche de baixo para cima com palavras de carinho.
                </p>
              </div>
            </Link>
          </li>
        </ul>

        <footer className="mt-16 border-t border-slate-800/80 pt-6 text-center font-mono text-xs text-slate-400">
          Feito com 💛 e letras · obras em domínio público, via Wikimedia Commons
        </footer>
      </main>
    </div>
  );
}
