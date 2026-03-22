import type { ExportMode } from "../types/export";

export const buildPdfFilename = (scenarioId: string, mode: ExportMode, month: number) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${scenarioId}-${mode}-m${month}-${timestamp}.pdf`;
};
