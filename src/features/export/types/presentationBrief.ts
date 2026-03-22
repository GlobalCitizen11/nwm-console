import type { ExportModulePayload } from "./export";

export interface PresentationSlide {
  id: string;
  title: string;
  modules: ExportModulePayload[];
}
