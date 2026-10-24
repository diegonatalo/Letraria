import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AsciiArtwork from "@/components/AsciiArtwork";
import BackLink from "@/components/BackLink";
import { WORKS, getWork, workImage, workThumb } from "@/lib/works";

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

  const i = WORKS.findIndex((w) => w.slug === work.slug);
  const prev = WORKS[(i - 1 + WORKS.length) % WORKS.length];
  const next = WORKS[(i + 1) % WORKS.length];

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <BackLink />
      <AsciiArtwork
        key={work.slug}
        src={workImage(work)}
        thumb={workThumb(work)}
        title={work.title}
        credit={`${work.artist}, ${work.year}`}
        about={work.about}
        source={work.source}
        nav={{
          prev: { href: `/${prev.slug}`, title: prev.title },
          next: { href: `/${next.slug}`, title: next.title },
        }}
      />
    </main>
  );
}
