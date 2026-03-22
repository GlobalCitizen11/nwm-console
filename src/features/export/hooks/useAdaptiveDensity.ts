import { useMemo } from "react";
import type { DensityMode, ExportMode } from "../types/export";

export function useAdaptiveDensity(mode: ExportMode) {
  return useMemo<DensityMode>(() => {
    if (mode === "board-onepager") {
      return "compact";
    }
    if (mode === "presentation-brief") {
      return "expanded";
    }
    return "standard";
  }, [mode]);
}
