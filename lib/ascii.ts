/** Do mais apagado ao mais forte: o brilho de cada trecho da pintura escolhe o caractere. */
export const RAMP = ".,:;-=+*xo#%&@";

export const FONT = 'Consolas, "Cascadia Mono", "Courier New", monospace';

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Brilho (0..1) -> caractere da rampa. */
export const charFor = (lum: number) => RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(lum * RAMP.length)))];
