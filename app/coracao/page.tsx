import Link from "next/link";
import AsciiHeart from "@/components/AsciiHeart";

const TITLE = "Coração · Letraria";
const DESCRIPTION = "Um coração que se desenha em contorno e se preenche com palavras de amor e carinho.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/coracao" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/coracao" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Coracao() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#07020a]">
      <Link href="/" className="absolute left-4 top-3 z-10 text-sm text-rose-300/70 transition hover:text-rose-100">
        ← Galeria
      </Link>
      <AsciiHeart />
    </main>
  );
}
