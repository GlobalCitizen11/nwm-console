import type { ExportModulePayload } from "../types/export";

export const groupModulesForSlides = (modules: ExportModulePayload[]) => modules.map((module) => [module]);
