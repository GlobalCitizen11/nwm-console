import { useMemo } from "react";
import type { ExportMode, ExportModulePayload } from "../types/export";
import { groupModulesForPages } from "../utils/groupModulesForPages";
import { groupModulesForSlides } from "../utils/groupModulesForSlides";

export function usePaginatedSections(mode: ExportMode, modules: ExportModulePayload[], targetUnits: number) {
  return useMemo(() => {
    if (mode === "presentation-brief") {
      return groupModulesForSlides(modules);
    }
    return groupModulesForPages(modules, targetUnits);
  }, [mode, modules, targetUnits]);
}
