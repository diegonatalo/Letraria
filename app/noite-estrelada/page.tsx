import Link from "next/link";
import AsciiStarryNight from "@/components/AsciiStarryNight";

const TITLE = "A Noite Estrelada · Letraria";
const DESCRIPTION = "A Noite Estrelada, de Van Gogh, em ASCII colorido: um zoom do centro até a obra inteira.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/noite-estrelada" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/noite-estrelada" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function NoiteEstrelada() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Link href="/" className="absolute left-4 top-3 z-10 text-sm text-slate-400 transition hover:text-amber-200">
        ← Galeria
      </Link>
      <AsciiStarryNight />
    </main>
  );
}
