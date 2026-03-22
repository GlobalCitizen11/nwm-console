import { useMemo } from "react";
import type { BriefingState } from "../../../types";
import { normalizeExportData } from "../utils/normalizeExportData";

export function useExportData(state: BriefingState, currentViewName: string) {
  return useMemo(() => normalizeExportData(state, currentViewName), [state, currentViewName]);
}
