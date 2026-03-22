import { useMemo, useState } from "react";
import { exportModes } from "./config/exportModes";
import type { ExportMode } from "./types/export";
import { readExportPreviewPayload } from "./storage";
import { browserPrintFallback } from "./pdf/browserPrintFallback";
import { playwrightPdf } from "./pdf/playwrightPdf";
import "./styles/export-base.css";
import "./styles/export-print.css";
import "./styles/export-screen-preview.css";

const getToken = () => new URLSearchParams(window.location.search).get("token") ?? "";
const getRouteMode = (): ExportMode => {
  if (window.location.pathname.includes("presentation")) return "presentation-brief";
  if (window.location.pathname.includes("board")) return "board-onepager";
  return "executive-brief";
};

export function ExportPreviewPage() {
  const token = getToken();
  const bundle = useMemo(() => readExportPreviewPayload(token), [token]);
  const [mode, setMode] = useState<ExportMode>(getRouteMode());

  if (!bundle) {
    return (
      <main className="export-preview-shell export-preview-empty">
        <div>
          <p className="export-meta-label">Export Preview</p>
          <h1>Preview unavailable</h1>
          <p className="export-subtitle">The export payload is missing. Return to the console and regenerate the preview.</p>
        </div>
      </main>
    );
  }

  const html = bundle.htmlByMode[mode];
  const qa = bundle.qaByMode[mode];

  return (
    <main className="export-preview-shell">
      <div className="export-preview-toolbar">
        <div>
          <p className="export-meta-label">Export Preview</p>
          <h2 style={{ margin: "8px 0 6px", fontSize: 22 }}>{bundle.data.metadata.scenarioName}</h2>
          <p className="export-subtitle">
            {bundle.data.metadata.phase} | {bundle.data.metadata.asOf}
          </p>
        </div>
        <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
          <div className="export-mode-tabs">
            {exportModes.map((item) => (
              <button key={item.id} className={`export-mode-tab ${mode === item.id ? "is-active" : ""}`} onClick={() => setMode(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: qa.ok ? "#87c08d" : "#d7b56c", fontSize: 12 }}>
              {qa.ok ? "Layout QA passed" : `${qa.issues.length} layout warning${qa.issues.length === 1 ? "" : "s"}`}
            </span>
            <button
              className="export-mode-tab is-active"
              disabled={!qa.ok}
              onClick={async () => {
                if (!qa.ok) {
                  return;
                }
                try {
                  await playwrightPdf({
                    mode,
                    html,
                    filename: bundle.filenameByMode[mode],
                    orientation: bundle.orientationByMode[mode],
                  });
                } catch {
                  browserPrintFallback();
                }
              }}
            >
              {qa.ok ? "Download PDF" : "Fix validation errors"}
            </button>
          </div>
        </div>
      </div>
      <div className="export-preview-canvas" dangerouslySetInnerHTML={{ __html: new DOMParser().parseFromString(html, "text/html").body.innerHTML }} />
    </main>
  );
}
