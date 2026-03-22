import type { ExportMode } from "../types/export";

export const exportLayouts: Record<ExportMode, { targetUnits: number; orientation: "portrait" | "landscape" }> = {
  "executive-brief": {
    targetUnits: 20,
    orientation: "portrait",
  },
  "presentation-brief": {
    targetUnits: 12,
    orientation: "landscape",
  },
  "board-onepager": {
    targetUnits: 18,
    orientation: "portrait",
  },
};
