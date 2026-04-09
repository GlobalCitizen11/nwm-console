import { useMemo, useState } from "react";
import { exportModes } from "./config/exportModes";
import type { ExportMode } from "./types/export";
import { readExportPreviewPayload } from "./storage";
import { browserPrintFallback } from "./pdf/browserPrintFallback";
import { playwrightPdf } from "./pdf/playwrightPdf";
import { StatusChip } from "./components/primitives/StatusChip";
import {
  mapBoardOnePagerSpecToRenderedSections,
  mapExecutiveBriefSpecToRenderedSections,
  mapPresentationBriefSpecToRenderedSections,
} from "../../lib/artifactSpecBuilders";
import {
  inspectBoardOnePagerSpecFields,
  inspectExecutiveBodyRailSimilarity,
  inspectExecutiveBriefSpecFields,
  inspectPresentationBriefSpecFields,
  validateBoardOnePagerSpec,
  validateExecutiveBriefSpec,
  validatePresentationBriefSpec,
} from "../../lib/validateArtifactSpecs";
import "./styles/export-base.css";
import "./styles/export-print.css";
import "./styles/export-screen-preview.css";

const getToken = () => new URLSearchParams(window.location.search).get("token") ?? "";
const getDebugMode = () => new URLSearchParams(window.location.search).get("debug") ?? "";
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
        <div className="export-preview-empty-card">
          <p className="export-meta-label">Export Preview</p>
          <h1>Preview unavailable</h1>
          <p className="export-subtitle">The export payload is missing. Return to the console and regenerate the preview.</p>
        </div>
      </main>
    );
  }

  const html = bundle.htmlByMode[mode];
  const modeAvailability = bundle.availabilityByMode?.[mode] ?? { exportable: true };
  const showBoardSpecDebug = getDebugMode() === "board-spec" && mode === "board-onepager";
  const showExecutiveSpecDebug = getDebugMode() === "executive-spec" && mode === "executive-brief";
  const showPresentationSpecDebug = getDebugMode() === "presentation-spec" && mode === "presentation-brief";
  const boardContent = bundle.contentByMode["board-onepager"];
  const executiveContent = bundle.contentByMode["executive-brief"];
  const presentationContent = bundle.contentByMode["presentation-brief"];
  const boardSpecValidation = showBoardSpecDebug ? validateBoardOnePagerSpec(boardContent.spec) : null;
  const boardFieldValidation = showBoardSpecDebug ? inspectBoardOnePagerSpecFields(boardContent.spec) : null;
  const boardRenderedMapping = showBoardSpecDebug ? mapBoardOnePagerSpecToRenderedSections(boardContent.spec) : null;
  const executiveSpecValidation = showExecutiveSpecDebug ? validateExecutiveBriefSpec(executiveContent.spec) : null;
  const executiveFieldValidation = showExecutiveSpecDebug ? inspectExecutiveBriefSpecFields(executiveContent.spec) : null;
  const executiveRenderedMapping = showExecutiveSpecDebug ? mapExecutiveBriefSpecToRenderedSections(executiveContent.spec) : null;
  const executiveBodyRailSimilarity = showExecutiveSpecDebug ? inspectExecutiveBodyRailSimilarity(executiveContent.spec) : null;
  const presentationSpecValidation = showPresentationSpecDebug ? validatePresentationBriefSpec(presentationContent.spec) : null;
  const presentationFieldValidation = showPresentationSpecDebug ? inspectPresentationBriefSpecFields(presentationContent.spec) : null;
  const presentationRenderedMapping = showPresentationSpecDebug ? mapPresentationBriefSpecToRenderedSections(presentationContent.spec) : null;
  const debugPanels = (
    items: Array<{ label: string; value: unknown }>,
  ) => (
    <section className="export-debug-grid">
      {items.map((item) => (
        <article key={item.label} className="export-debug-card">
          <p className="export-meta-label">{item.label}</p>
          <pre className="export-debug-pre">{JSON.stringify(item.value, null, 2)}</pre>
        </article>
      ))}
    </section>
  );

  return (
    <main className="export-preview-shell">
      <div className="export-preview-toolbar">
        <div className="export-preview-toolbar-inner">
          <div className="export-preview-toolbar-copy">
            <p className="export-meta-label">NWM Console Preview</p>
            <h2 className="export-preview-title">{bundle.data.metadata.scenarioName}</h2>
            <p className="export-subtitle">
              {bundle.data.metadata.phase} | {bundle.data.metadata.asOf}
            </p>
          </div>
          <div className="export-preview-toolbar-rail">
            <StatusChip label="Scenario" value={bundle.data.metadata.scenarioName} />
            <StatusChip label="Artifact" value={exportModes.find((item) => item.id === mode)?.label ?? mode} tone="accent" />
            <StatusChip label="Phase" value={bundle.data.metadata.phase} />
            <StatusChip label="Source" value="Canonical + Assisted" />
            <StatusChip
              label="Exportability"
              value={modeAvailability.exportable ? "Exportable" : "Withheld"}
              tone={modeAvailability.exportable ? "default" : "warning"}
            />
          </div>
          <div className="export-preview-toolbar-controls">
            <div className="export-mode-tabs">
              {exportModes.map((item) => (
                <button key={item.id} className={`export-mode-tab ${mode === item.id ? "is-active" : ""}`} onClick={() => setMode(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="export-preview-statusRow">
              <button
                className="export-mode-tab is-active"
                disabled={!modeAvailability.exportable}
                onClick={async () => {
                  if (!modeAvailability.exportable) {
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
                {modeAvailability.exportable ? "Download PDF" : "Artifact Withheld"}
              </button>
            </div>
            {!modeAvailability.exportable && modeAvailability.reason ? (
              <p className="export-subtitle">{modeAvailability.reason}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="export-preview-stage">
        <div className="export-preview-canvas" dangerouslySetInnerHTML={{ __html: new DOMParser().parseFromString(html, "text/html").body.innerHTML }} />
        {showBoardSpecDebug
          ? debugPanels([
              { label: "Source scenario intelligence", value: bundle.canonicalSummary },
              { label: "Built BoardOnePagerSpec", value: boardContent.spec },
              { label: "Spec validation results", value: boardSpecValidation },
              { label: "Field validation by path", value: boardFieldValidation },
              { label: "Rendered section mapping", value: boardRenderedMapping },
            ])
          : null}
        {showExecutiveSpecDebug
          ? debugPanels([
              { label: "Source scenario intelligence", value: bundle.canonicalSummary },
              { label: "Built ExecutiveBriefSpec", value: executiveContent.spec },
              { label: "Spec validation results", value: executiveSpecValidation },
              { label: "Field validation by path", value: executiveFieldValidation },
              { label: "Rendered section mapping", value: executiveRenderedMapping },
              { label: "Body vs rail similarity", value: executiveBodyRailSimilarity },
            ])
          : null}
        {showPresentationSpecDebug
          ? debugPanels([
              { label: "Source scenario intelligence", value: bundle.canonicalSummary },
              { label: "Built PresentationBriefSpec", value: presentationContent.spec },
              { label: "Spec validation results", value: presentationSpecValidation },
              { label: "Field validation by path", value: presentationFieldValidation },
              { label: "Rendered slide mapping", value: presentationRenderedMapping },
            ])
          : null}
      </div>
    </main>
  );
}
