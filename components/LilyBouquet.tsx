"use client";

import BouquetCanvas from "@/components/BouquetCanvas";
import { buildBouquet, poseFlower } from "@/lib/lily";

const ENGINE = { build: buildBouquet, poseFlower };

export default function LilyBouquet() {
  return (
    <BouquetCanvas
      engine={ENGINE}
      title="Lírios"
      subtitle="um buquê feito de letras"
      label="Um buquê de lírios desenhado com caracteres coloridos"
    />
  );
}
