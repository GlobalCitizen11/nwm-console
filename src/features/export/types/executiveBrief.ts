import type { ExportModulePayload } from "./export";

export interface ExecutiveBriefPage {
  id: string;
  title: string;
  modules: ExportModulePayload[];
}
