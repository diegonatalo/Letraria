import Link from "next/link";

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

const WORKS = [
  {
    href: "/noite-estrelada",
    title: "A Noite Estrelada",
    note: "Van Gogh, 1889 · zoom até a obra inteira, com moldura dourada",
  },
  {
    href: "/coracao",
    title: "Coração",
    note: "Um contorno que se preenche de baixo para cima com palavras de carinho",
  },
];

export default function Galeria() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
      <header className="mb-10">
        <h1 className="font-mono text-4xl font-bold tracking-tight text-amber-100">Letraria</h1>
        <p className="mt-2 max-w-xl text-slate-400">Obras e formas desenhadas com letras: arte ASCII colorida e animada.</p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2">
        {WORKS.map((w) => (
          <li key={w.href}>
            <Link
              href={w.href}
              className="group block overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 transition hover:border-amber-200/60"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                {w.href === "/coracao" ? (
                  <pre
                    aria-hidden
                    className="grid h-full w-full place-items-center bg-[#07020a] font-mono text-[clamp(6px,1.55vw,12px)] font-bold leading-[1.05] text-rose-500 transition group-hover:text-rose-300"
                  >
                    {heartPreview}
                  </pre>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/noite-estrelada.jpg"
                    alt=""
                    className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-slate-100 group-hover:text-amber-200">{w.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{w.note}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
