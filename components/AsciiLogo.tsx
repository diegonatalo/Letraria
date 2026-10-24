const GLYPHS: Record<string, string[]> = {
  L: ["#    ", "#    ", "#    ", "#    ", "#####"],
  E: ["#####", "#    ", "#### ", "#    ", "#####"],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  "],
  R: ["#### ", "#   #", "#### ", "#  # ", "#   #"],
  A: [" ### ", "#   #", "#####", "#   #", "#   #"],
  I: ["###", " # ", " # ", " # ", "###"],
};

const TEXT = "LETRARIA";

// Cada linha é montada letra a letra; os "#" ganham caracteres variados para dar textura.
const LOGO = [0, 1, 2, 3, 4]
  .map((r) =>
    // Cada coluna vale duas células, para o traço das letras ficar cheio.
    [...[...TEXT].map((c) => GLYPHS[c][r]).join("  ")]
      .map((c, i) => (c === "#" ? "@#%&"[(2 * i + r) % 4] + "@#%&"[(2 * i + 1 + r) % 4] : "  "))
      .join(""),
  )
  .join("\n");

export default function AsciiLogo({ className = "" }: { className?: string }) {
  return (
    <h1 aria-label="Letraria" className={className}>
      <pre
        aria-hidden
        className="gold-text inline-block font-mono text-[min(18px,calc((100vw-2.5rem)/63))] font-bold leading-[1.1]"
      >
        {LOGO}
      </pre>
    </h1>
  );
}
