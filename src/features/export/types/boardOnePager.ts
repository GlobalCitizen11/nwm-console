import type { ExportModulePayload } from "./export";

export interface BoardOnePagerLayout {
  header: ExportModulePayload[];
  insightGrid: ExportModulePayload[];
  kpis: ExportModulePayload[];
  implications: ExportModulePayload[];
  evidence: ExportModulePayload[];
}
