import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Letraria",
  description: "Obras e formas desenhadas com letras: arte ASCII colorida e animada.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
