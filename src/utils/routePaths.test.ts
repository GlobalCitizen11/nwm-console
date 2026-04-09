import { describe, expect, it } from "vitest";
import { buildConsoleRoute, getConsoleBasePath, isExportPreviewRoute } from "./routePaths";

describe("route paths", () => {
  it("uses the root path when the console is opened from the default URL", () => {
    expect(getConsoleBasePath("/")).toBe("");
    expect(buildConsoleRoute("/", "/export/executive-brief")).toBe("/export/executive-brief");
    expect(isExportPreviewRoute("/export/presentation-brief")).toBe(true);
  });

  it("preserves the console alias when the app is opened from /nwm-console", () => {
    expect(getConsoleBasePath("/nwm-console")).toBe("/nwm-console");
    expect(getConsoleBasePath("/nwm-console/")).toBe("/nwm-console");
    expect(buildConsoleRoute("/nwm-console", "/export/board-onepager")).toBe("/nwm-console/export/board-onepager");
    expect(isExportPreviewRoute("/nwm-console/export/executive-brief")).toBe(true);
  });

  it("does not treat unrelated routes as export previews", () => {
    expect(isExportPreviewRoute("/nwm-console")).toBe(false);
    expect(isExportPreviewRoute("/inception-gate")).toBe(false);
  });
});
