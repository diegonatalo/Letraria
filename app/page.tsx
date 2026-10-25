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

// Miniatura em texto de um lírio: seis pétalas pontudas e o talo.
const lilyPreview = (() => {
  const chars = "o*#%@";
  const lines: string[] = [];
  for (let j = 0; j < 17; j++) {
    let line = "";
    for (let i = 0; i < 38; i++) {
      const x = ((i + 0.5) / 38 - 0.5) * 2.4;
      const y = ((8.5 - (j + 0.5)) / 8.5) * 1.0;
      const yc = y - 0.3;
      const r = Math.hypot(x * 0.5, yc);
      const a = Math.atan2(yc, x * 0.5) + Math.PI / 6;
      const petal = Math.pow(Math.abs(Math.cos(3 * a)), 1.6) * 0.62;
      if (r < petal) line += chars[Math.min(4, Math.floor((1 - r / petal) * 5))];
      else if (yc < -0.1 && Math.abs(x) < 0.07) line += "|";
      else line += " ";
    }
    lines.push(line);
  }
  return lines.join("\n");
})();

// Miniatura colorida do buquê: manchas elípticas de letras, da base para a frente.
const bouquetPreview = (() => {
  const W = 38;
  const H = 17;
  // [coluna, linha, raio x, raio y, cor, caracteres do mais claro ao mais denso]
  const blobs: [number, number, number, number, string, string][] = [
    [9, 6.5, 5.5, 3.3, "text-blue-500", "+x*o#"],
    [29, 6.5, 5.5, 3.3, "text-sky-400", "+x*o#"],
    [4, 10.5, 3.6, 2.4, "text-blue-700", "+x*o#"],
    [34, 10.5, 3.6, 2.4, "text-indigo-400", "+x*o#"],
    [19, 3.2, 6.6, 3.2, "text-yellow-400", "*o#%@"],
    [19, 3.4, 2.4, 1.2, "text-amber-900", "#@@@@"],
    [13, 9.5, 3.4, 2.1, "text-slate-100", ".*+o@"],
    [25.5, 9.2, 2.2, 2.5, "text-purple-500", "o#%@@"],
    [19, 8.8, 4.2, 2.7, "text-red-600", "o#%@@"],
  ];
  const rows: { text: string; cls: string }[][] = [];
  for (let j = 0; j < H; j++) {
    const row: { text: string; cls: string }[] = [];
    for (let i = 0; i < W; i++) {
      let ch = " ";
      let cls = "";
      if (j >= 10 && Math.abs(i - 19) < (16 - j) * 1.5 + 1) {
        ch = ";:=+"[(i + j) % 4];
        cls = "text-green-600";
      }
      for (const [cx, cy, rx, ry, c, chars] of blobs) {
        const r = Math.hypot((i - cx) / rx, (j - cy) / ry);
        if (r < 1) {
          ch = chars[Math.min(chars.length - 1, Math.floor((1 - r) * chars.length * 1.2 + ((i * 7 + j * 3) % 2)))];
          cls = c;
        }
      }
      const last = row[row.length - 1];
      if (last && last.cls === cls) last.text += ch;
      else row.push({ text: ch, cls });
    }
    rows.push(row);
  }
  return rows;
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
          <li>
            <Link href="/lirios" className={CARD}>
              <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#050505]">
                <pre
                  aria-hidden
                  className="font-mono text-[clamp(6px,1.55vw,12px)] font-bold leading-[1.05] text-pink-500 transition group-hover:text-amber-300"
                >
                  {lilyPreview}
                </pre>
                <Corners tone="text-pink-400/70" />
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg font-semibold text-slate-100 transition group-hover:text-gold">
                  Lírios
                </h2>
                <p className="font-mono text-xs text-slate-400">um buquê de letras</p>
                <p className="mt-2 text-sm text-slate-400">
                  Talos que crescem, flores que se abrem e letras que se afastam do mouse.
                </p>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/buque" className={CARD}>
              <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[#050505]">
                <pre aria-hidden className="font-mono text-[clamp(6px,1.55vw,12px)] font-bold leading-[1.05]">
                  {bouquetPreview.map((row, j) => (
                    <span key={j}>
                      {row.map((seg, k) => (
                        <span key={k} className={seg.cls}>
                          {seg.text}
                        </span>
                      ))}
                      {"\n"}
                    </span>
                  ))}
                </pre>
                <Corners tone="text-blue-300/70" />
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg font-semibold text-slate-100 transition group-hover:text-gold">
                  Buquê de flores
                </h2>
                <p className="font-mono text-xs text-slate-400">hortênsia, girassol, rosa, tulipa, lírio e margaridas</p>
                <p className="mt-2 text-sm text-slate-400">
                  Um buquê misto, com margaridas coloridas entre as flores grandes, que cresce e desabrocha flor por flor, desenhado só com letras.
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
