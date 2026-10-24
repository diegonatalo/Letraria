import Link from "next/link";

const TONES = {
  gold: "text-slate-300 hover:border-gold/60 hover:text-gold",
  rose: "text-rose-200/80 hover:border-rose-300/60 hover:text-rose-100",
};

export default function BackLink({ tone = "gold" }: { tone?: keyof typeof TONES }) {
  return (
    <Link
      href="/"
      className={`absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-xs backdrop-blur transition ${TONES[tone]}`}
    >
      <span aria-hidden>←</span> Galeria
    </Link>
  );
}
