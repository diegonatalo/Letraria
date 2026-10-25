"use client";

import BouquetCanvas from "@/components/BouquetCanvas";
import { buildMixed, poseMixed } from "@/lib/mixed";

const GRID = { div: 190, min: 4, max: 4 };
const ENGINE = { build: buildMixed, poseFlower: poseMixed };

export default function HydrangeaBouquet() {
  return (
    <BouquetCanvas
      engine={ENGINE}
      mouse={false}
      grid={GRID}
      title="Buquê de flores"
      subtitle="hortênsia, girassol, rosa, tulipa, lírio e margaridas"
      label="Um buquê de hortênsia, girassol, rosa, tulipa, lírio e margaridas desenhado com caracteres coloridos"
    />
  );
}
