import BackLink from "@/components/BackLink";
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
      <BackLink tone="rose" />
      <AsciiHeart />
    </main>
  );
}
