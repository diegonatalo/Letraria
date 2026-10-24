import type { MetadataRoute } from "next";

const BASE = "https://letraria.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/noite-estrelada`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE}/coracao`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];
}
