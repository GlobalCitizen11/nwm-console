import type { ExportModulePayload } from "../types/export";

export const groupModulesForPages = (modules: ExportModulePayload[], targetUnits: number) => {
  const pages: ExportModulePayload[][] = [];
  let current: ExportModulePayload[] = [];
  let currentUnits = 0;

  for (const module of modules) {
    if (currentUnits + module.estimatedHeight > targetUnits && current.length > 0) {
      pages.push(current);
      current = [];
      currentUnits = 0;
    }
    current.push(module);
    currentUnits += module.estimatedHeight;
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
};
