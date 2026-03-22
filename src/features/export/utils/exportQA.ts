import type { ExportModulePayload, ExportQaIssue, ExportQaResult } from "../types/export";
import { scoreLayoutBalance } from "./scoreLayoutBalance";
import { scoreOnePagerDensity } from "./scoreOnePagerDensity";

export const exportQA = (mode: "executive-brief" | "presentation-brief" | "board-onepager", modules: ExportModulePayload[], targetUnits: number): ExportQaResult => {
  const issues: ExportQaIssue[] = [];
  const score = mode === "board-onepager" ? scoreOnePagerDensity(modules) : scoreLayoutBalance(modules, targetUnits);

  if (mode !== "board-onepager" && score.whitespaceBalance < 58) {
    issues.push({ level: "warning", code: "spacing", message: "Whitespace balance is uneven for this composition." });
  }
  if (score.densityFit < (mode === "board-onepager" ? 52 : 58)) {
    issues.push({ level: "warning", code: "density", message: "Content density is outside the preferred target for this export mode." });
  }
  if (score.breakIntegrity < (mode === "board-onepager" ? 72 : 80)) {
    issues.push({ level: "warning", code: "broken-card", message: "One or more modules may be too tall to guarantee clean page integrity." });
  }
  if (score.sectionCompleteness < 90) {
    issues.push({ level: "warning", code: "underfill", message: "One or more sections look structurally thin." });
  }
  if (score.visualHierarchy < (mode === "board-onepager" ? 60 : 68)) {
    issues.push({ level: "warning", code: "spacing", message: "Visual hierarchy is too flat for a premium export composition." });
  }
  if (mode === "board-onepager") {
    const boardScore = scoreOnePagerDensity(modules);
    if (boardScore.scanability < 84) {
      issues.push({ level: "warning", code: "density", message: "Board surface is carrying too much copy to remain scan-safe." });
    }
    if (boardScore.breakIntegrity < 90) {
      issues.push({ level: "warning", code: "overflow", message: "Board one-pager integrity is at risk; compress before rendering." });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};
