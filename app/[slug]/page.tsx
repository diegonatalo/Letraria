import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AsciiArtwork from "@/components/AsciiArtwork";
import { WORKS, getWork, workImage } from "@/lib/works";

export const dynamicParams = false;

export function generateStaticParams() {
  return WORKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const work = getWork((await params).slug);
  if (!work) return {};
  const title = `${work.title} · Letraria`;
  const description = `${work.title}, de ${work.artist} (${work.year}), em ASCII colorido: um zoom do centro até a obra inteira.`;
  return {
    title,
    description,
    alternates: { canonical: `/${work.slug}` },
    openGraph: { title, description, url: `/${work.slug}` },
    twitter: { title, description },
  };
}

export default async function ObraPage({ params }: { params: Promise<{ slug: string }> }) {
  const work = getWork((await params).slug);
  if (!work) notFound();

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Link href="/" className="absolute left-4 top-3 z-10 text-sm text-slate-400 transition hover:text-amber-200">
        ← Galeria
      </Link>
      <AsciiArtwork
        key={work.slug}
        src={workImage(work)}
        title={work.title}
        credit={`${work.artist}, ${work.year}`}
      />
    </main>
  );
}
