import type { ExportPreviewPayload } from "../types";

const PREFIX = "nwm-export-preview:";

export const saveExportPreviewPayload = (payload: ExportPreviewPayload) => {
  const token = `${payload.mode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(`${PREFIX}${token}`, JSON.stringify(payload));
  return token;
};

export const readExportPreviewPayload = (token: string) => {
  const raw = window.localStorage.getItem(`${PREFIX}${token}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ExportPreviewPayload;
  } catch {
    return null;
  }
};
