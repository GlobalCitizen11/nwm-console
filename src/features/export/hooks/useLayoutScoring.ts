import { useMemo } from "react";
import type { ExportMode, ExportModulePayload } from "../types/export";
import { exportQA } from "../utils/exportQA";

export function useLayoutScoring(mode: ExportMode, modules: ExportModulePayload[], targetUnits: number) {
  return useMemo(() => exportQA(mode, modules, targetUnits), [mode, modules, targetUnits]);
}
