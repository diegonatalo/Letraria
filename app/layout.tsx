import type { Metadata } from "next";
import "./globals.css";

const SITE = "https://letraria.vercel.app";
const DESCRIPTION = "Obras e formas desenhadas com letras: arte ASCII colorida e animada.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Letraria", template: "%s" },
  description: DESCRIPTION,
  applicationName: "Letraria",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Letraria",
    title: "Letraria",
    description: DESCRIPTION,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Letraria",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
