import type { ExportPreviewBundle } from "./types/export";

const PREFIX = "nwm-feature-export:";
const STORAGE_VERSION = 4;
const MAX_PREVIEW_PAYLOADS = 6;

interface StoredExportPreviewPayload {
  version: number;
  bundle: ExportPreviewBundle;
}

const isValidBundle = (value: unknown): value is ExportPreviewBundle => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const bundle = value as Partial<ExportPreviewBundle>;
  return Boolean(
    bundle.mode &&
      bundle.data &&
      bundle.htmlByMode &&
      bundle.qaByMode &&
      bundle.filenameByMode &&
      bundle.orientationByMode,
  );
};

const pruneLegacyPayloads = () => {
  const keysToDelete: string[] = [];
  const currentPayloadKeys: Array<{ key: string; updatedAt: number }> = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(PREFIX)) {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        keysToDelete.push(key);
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as StoredExportPreviewPayload | ExportPreviewBundle;
        if (!("version" in parsed) || parsed.version !== STORAGE_VERSION) {
          keysToDelete.push(key);
          continue;
        }
        const tokenParts = key.split("-");
        currentPayloadKeys.push({
          key,
          updatedAt: Number(tokenParts[tokenParts.length - 2] ?? 0),
        });
      } catch {
        keysToDelete.push(key);
      }
    }
  }

  currentPayloadKeys
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(MAX_PREVIEW_PAYLOADS)
    .forEach((entry) => {
      if (!keysToDelete.includes(entry.key)) {
        keysToDelete.push(entry.key);
      }
    });

  keysToDelete.forEach((key) => window.localStorage.removeItem(key));
};

export const saveExportPreviewPayload = (payload: ExportPreviewBundle) => {
  pruneLegacyPayloads();
  const token = `${payload.mode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const stored: StoredExportPreviewPayload = {
    version: STORAGE_VERSION,
    bundle: payload,
  };
  try {
    window.localStorage.setItem(`${PREFIX}${token}`, JSON.stringify(stored));
  } catch {
    pruneLegacyPayloads();
    const previewKeys = Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .sort();

    while (previewKeys.length > 0) {
      const oldestKey = previewKeys.shift();
      if (oldestKey) {
        window.localStorage.removeItem(oldestKey);
      }
      try {
        window.localStorage.setItem(`${PREFIX}${token}`, JSON.stringify(stored));
        return token;
      } catch {
        continue;
      }
    }

    throw new Error("Unable to persist export preview payload");
  }
  return token;
};

export const readExportPreviewPayload = (token: string) => {
  const raw = window.localStorage.getItem(`${PREFIX}${token}`);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredExportPreviewPayload | ExportPreviewBundle;
    if ("version" in parsed) {
      if (parsed.version !== STORAGE_VERSION || !isValidBundle(parsed.bundle)) {
        window.localStorage.removeItem(`${PREFIX}${token}`);
        return null;
      }
      return parsed.bundle;
    }
    if (!isValidBundle(parsed)) {
      window.localStorage.removeItem(`${PREFIX}${token}`);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(`${PREFIX}${token}`);
    return null;
  }
};
