import type { ExportModulePayload, LayoutScore } from "../types/export";

export const scoreWhitespaceBalance = (modules: ExportModulePayload[], targetUnits: number) => {
  const used = modules.reduce((sum, module) => sum + module.estimatedHeight, 0);
  return Math.max(0, 100 - Math.abs(targetUnits - used) * 5);
};

export const scoreVisualHierarchy = (modules: ExportModulePayload[]) => {
  const hasDominant = modules.some((module) => module.estimatedHeight >= 6);
  const supportCount = modules.length;
  return hasDominant && supportCount <= 4 ? 100 : Math.max(60, 100 - Math.max(0, supportCount - 4) * 8);
};

export const scoreDensityFit = (modules: ExportModulePayload[], targetUnits: number) =>
  Math.max(0, 100 - Math.abs(targetUnits - modules.reduce((sum, module) => sum + module.estimatedHeight, 0)) * 6);

export const scoreSectionCompleteness = (modules: ExportModulePayload[]) => (modules.every((module) => module.content.length > 0) ? 100 : 70);

export const scoreBreakIntegrity = (modules: ExportModulePayload[]) =>
  modules.every((module) => !module.keepTogether || module.estimatedHeight <= 8) ? 100 : 72;

export const scoreLayoutBalance = (modules: ExportModulePayload[], targetUnits: number): LayoutScore => ({
  whitespaceBalance: scoreWhitespaceBalance(modules, targetUnits),
  visualHierarchy: scoreVisualHierarchy(modules),
  densityFit: scoreDensityFit(modules, targetUnits),
  sectionCompleteness: scoreSectionCompleteness(modules),
  breakIntegrity: scoreBreakIntegrity(modules),
});
