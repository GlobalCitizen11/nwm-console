import type { ExportModulePayload, OnePagerScore } from "../types/export";
import { scoreBreakIntegrity, scoreDensityFit, scoreSectionCompleteness, scoreVisualHierarchy, scoreWhitespaceBalance } from "./scoreLayoutBalance";

export const scoreSignalDensity = (modules: ExportModulePayload[]) =>
  Math.max(0, 100 - Math.abs(27 - modules.reduce((sum, module) => sum + module.estimatedHeight, 0)) * 4);

export const scoreGridBalance = (modules: ExportModulePayload[]) => (modules.length >= 5 && modules.length <= 6 ? 100 : 72);

export const scoreScanability = (modules: ExportModulePayload[]) =>
  modules.every((module) => module.content.length <= 4 && module.estimatedHeight <= 6) ? 100 : 68;

export const scoreDecisionReadiness = (modules: ExportModulePayload[]) =>
  modules.some((module) => module.title.toLowerCase().includes("implication")) ? 100 : 70;

export const scoreOnePagerDensity = (modules: ExportModulePayload[]): OnePagerScore => ({
  whitespaceBalance: scoreWhitespaceBalance(modules, 18),
  visualHierarchy: scoreVisualHierarchy(modules),
  densityFit: scoreDensityFit(modules, 18),
  sectionCompleteness: scoreSectionCompleteness(modules),
  breakIntegrity: scoreBreakIntegrity(modules),
  signalDensity: scoreSignalDensity(modules),
  gridBalance: scoreGridBalance(modules),
  scanability: scoreScanability(modules),
  decisionReadiness: scoreDecisionReadiness(modules),
});
