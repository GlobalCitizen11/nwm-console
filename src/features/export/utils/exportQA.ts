import type { ExportModulePayload, ExportQaIssue, ExportQaResult } from "../types/export";
import { scoreLayoutBalance } from "./scoreLayoutBalance";
import { scoreOnePagerDensity } from "./scoreOnePagerDensity";

export const exportQA = (mode: "executive-brief" | "presentation-brief" | "board-onepager", modules: ExportModulePayload[], targetUnits: number): ExportQaResult => {
  const issues: ExportQaIssue[] = [];
  const score = mode === "board-onepager" ? scoreOnePagerDensity(modules) : scoreLayoutBalance(modules, targetUnits);

  if (score.whitespaceBalance < 62) {
    issues.push({ level: "warning", code: "spacing", message: "Whitespace balance is uneven for this composition." });
  }
  if (score.densityFit < 60) {
    issues.push({ level: "warning", code: "density", message: "Content density is outside the preferred target for this export mode." });
  }
  if (score.breakIntegrity < 80) {
    issues.push({ level: "warning", code: "broken-card", message: "One or more modules may be too tall to guarantee clean page integrity." });
  }
  if (score.sectionCompleteness < 90) {
    issues.push({ level: "warning", code: "underfill", message: "One or more sections look structurally thin." });
  }
  if (score.visualHierarchy < 68) {
    issues.push({ level: "warning", code: "spacing", message: "Visual hierarchy is too flat for a premium export composition." });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};
