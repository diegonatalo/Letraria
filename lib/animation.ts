import { clamp } from "./ascii";

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Linha do tempo (s): talos crescem, depois os botões se abrem um a um.
export const GROW_START = 0.15;
export const GROW_END = 2.1;
export const OPEN_START = 2.1;
export const OPEN_TIME = 2.4;
export const MAX_DELAY = 1.5;
export const TIMELINE_END = OPEN_START + OPEN_TIME + MAX_DELAY; // 6 s

/** Progresso do crescimento dos talos (0..1), de baixo para cima. */
export const growthProgress = (t: number) => easeInOut(clamp((t - GROW_START) / (GROW_END - GROW_START), 0, 1));

/** Abertura de uma flor (0 botão fechado .. 1 aberta). */
export const openProgress = (t: number, delay: number) => easeOutCubic(clamp((t - OPEN_START - delay) / OPEN_TIME, 0, 1));

/** Balanço: deslocamento máximo (unidades do modelo) na ponta de um talo. */
export const SWAY_AMP = 0.02;
export const swayTerm = (t: number, phase: number) => Math.sin(t * 0.9 + phase) + 0.5 * Math.sin(t * 1.57 + phase * 2.3);
/** Entra devagar depois que o buquê cresceu. */
export const swayGate = (t: number) => smoothstep(1.5, 5.5, t);
