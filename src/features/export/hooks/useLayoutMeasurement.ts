import { useMemo } from "react";
import type { ExportModulePayload } from "../types/export";

export function useLayoutMeasurement(modules: ExportModulePayload[]) {
  return useMemo(() => modules.reduce((sum, module) => sum + module.estimatedHeight, 0), [modules]);
}
