import BackLink from "@/components/BackLink";
import LilyBouquet from "@/components/LilyBouquet";

const TITLE = "Lírios · Letraria";
const DESCRIPTION = "Um buquê de lírios que cresce e se abre, desenhado só com caracteres coloridos. Passe o mouse para afastar as letras.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/lirios" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/lirios" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Lirios() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050505]">
      <BackLink tone="rose" />
      <LilyBouquet />
    </main>
  );
}
