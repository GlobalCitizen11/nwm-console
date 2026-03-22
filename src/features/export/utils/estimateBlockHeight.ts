import type { DensityMode } from "../types/export";

export const estimateBlockHeight = (contentLength: number, density: DensityMode) => {
  const multiplier = density === "compact" ? 0.8 : density === "expanded" ? 1.15 : 1;
  return Math.max(2, Math.ceil((contentLength / 120) * multiplier));
};
