import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Letraria — obras e formas desenhadas com letras";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const painting = await readFile(path.join(process.cwd(), "public", "obras", "noite-estrelada.jpg"));
  const src = `data:image/jpeg;base64,${painting.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#07020a" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px", width: 560 }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#fcd34d", letterSpacing: -2 }}>Letraria</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 32, lineHeight: 1.3, color: "#cbd5e1" }}>
            Obras e formas desenhadas com letras: arte ASCII colorida e animada.
          </div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 28, color: "#ff3d5a" }}>TE AMO · AMOR · CARINHO</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={640} height={630} style={{ objectFit: "cover" }} alt="" />
      </div>
    ),
    size,
  );
}
