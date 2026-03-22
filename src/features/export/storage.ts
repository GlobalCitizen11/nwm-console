import type { ExportPreviewBundle } from "./types/export";

const PREFIX = "nwm-feature-export:";

export const saveExportPreviewPayload = (payload: ExportPreviewBundle) => {
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
    return JSON.parse(raw) as ExportPreviewBundle;
  } catch {
    return null;
  }
};
