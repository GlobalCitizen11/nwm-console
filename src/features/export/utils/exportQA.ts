import type { ExportModulePayload, ExportQaResult } from "../types/export";

// Soft composition scoring is intentionally disabled.
// Artifact QA now comes from explicit content/spec validation rather than
// aesthetic page-balance heuristics.
export const exportQA = (
  mode: "executive-brief" | "presentation-brief" | "board-onepager",
  modules: ExportModulePayload[],
  targetUnits: number,
): ExportQaResult => {
  void mode;
  void modules;
  void targetUnits;
  return {
    ok: true,
    issues: [],
  };
};
