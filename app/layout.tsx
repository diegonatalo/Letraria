import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--nf-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--nf-mono", display: "swap" });

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
    <html lang="pt-BR" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
