import { renderToStaticMarkup } from "react-dom/server";
import exportBaseCss from "./styles/export-base.css?raw";
import exportPrintCss from "./styles/export-print.css?raw";
import type { ExportMode, ExportModulePayload, ExportPreviewBundle, ExportSemanticData } from "./types/export";
import { buildPdfFilename } from "./utils/pdfMetadata";
import { exportQA } from "./utils/exportQA";
import { ExportRouter } from "./ExportRouter";
import { exportLayouts } from "./config/exportLayouts";
import { fitExportDataForMode } from "./utils/fitExportData";

const buildQaPlans = (mode: ExportMode, data: ExportSemanticData): ExportModulePayload[][] => {
  switch (mode) {
    case "executive-brief":
      return [
        [
          { id: "cover-hero", title: "Hero state", density: "standard", estimatedHeight: 5, keepTogether: true, content: data.keyInsights.slice(0, 1) },
          { id: "cover-kpis", title: "System snapshot", density: "standard", estimatedHeight: 3, keepTogether: true, content: data.systemStats.slice(0, 4) },
          { id: "cover-rail", title: "Signal rail", density: "standard", estimatedHeight: 4, keepTogether: true, content: data.keyInsights.slice(1, 3) },
        ],
        [
          { id: "development-body", title: "Narrative development", density: "standard", estimatedHeight: 9, keepTogether: true, content: data.timeline.slice(0, 3) },
          { id: "development-rail", title: "Signal rail", density: "standard", estimatedHeight: 4, keepTogether: true, content: data.crossDomainEffects.slice(0, 1) },
        ],
        [
          { id: "interpretation-body", title: "Structural interpretation", density: "standard", estimatedHeight: 8, keepTogether: true, content: data.implications.slice(0, 2) },
          { id: "interpretation-rail", title: "Signal rail", density: "standard", estimatedHeight: 4, keepTogether: true, content: data.containmentSignals.slice(0, 1) },
        ],
        [
          { id: "forward-body", title: "Forward orientation", density: "standard", estimatedHeight: 8, keepTogether: true, content: data.scenarioPaths },
          { id: "forward-rail", title: "Signal rail", density: "standard", estimatedHeight: 4, keepTogether: true, content: data.scenarioPaths.slice(1, 2) },
        ],
        [
          { id: "positioning-body", title: "Strategic positioning", density: "standard", estimatedHeight: 8, keepTogether: true, content: data.monitoringPriorities.slice(0, 2) },
          { id: "positioning-rail", title: "Signal rail", density: "standard", estimatedHeight: 4, keepTogether: true, content: data.risks.slice(0, 1) },
        ],
        [
          { id: "evidence-body", title: "Evidence anchors", density: "standard", estimatedHeight: 6, keepTogether: true, content: data.evidenceAnchors.slice(0, 3) },
        ],
      ];
    case "presentation-brief":
      return [
        [{ id: "slide-title", title: "Title", density: "expanded", estimatedHeight: 6, keepTogether: true, content: [data.title, data.subtitle] }],
        [
          { id: "slide-system", title: "System state", density: "expanded", estimatedHeight: 4, keepTogether: true, content: data.systemStats },
          { id: "slide-state-hero", title: "State interpretation", density: "expanded", estimatedHeight: 4, keepTogether: true, content: [data.executiveLead] },
        ],
        [{ id: "slide-takeaways", title: "Takeaways", density: "expanded", estimatedHeight: 7, keepTogether: true, content: data.keyInsights }],
        [{ id: "slide-timeline", title: "Narrative progression", density: "expanded", estimatedHeight: 7, keepTogether: true, content: data.timeline }],
        [{ id: "slide-inflections", title: "Inflection points", density: "expanded", estimatedHeight: 6, keepTogether: true, content: data.evidenceAnchors }],
        [{ id: "slide-implications", title: "Strategic implications", density: "expanded", estimatedHeight: 7, keepTogether: true, content: data.implications }],
        [{ id: "slide-paths", title: "Scenario paths", density: "expanded", estimatedHeight: 6, keepTogether: true, content: data.scenarioPaths }],
        [{ id: "slide-risks", title: "Risk and monitoring", density: "expanded", estimatedHeight: 6, keepTogether: true, content: data.risks }],
        [{ id: "slide-closing", title: "Closing synthesis", density: "expanded", estimatedHeight: 5, keepTogether: true, content: [data.closingSynthesis] }],
      ];
    case "board-onepager":
      return [
        [
          { id: "board-left", title: "State and implications", density: "compact", estimatedHeight: 8, keepTogether: true, content: [...data.keyInsights.slice(0, 1), ...data.implications.slice(0, 2)] },
          { id: "board-right", title: "Signal stack", density: "compact", estimatedHeight: 7, keepTogether: true, content: [data.metadata.phase, ...data.systemStats.slice(1, 4).map((stat) => stat.value), ...data.scenarioPaths.slice(0, 1).map((item) => item.headline)] },
          { id: "board-monitoring", title: "Monitoring", density: "compact", estimatedHeight: 4, keepTogether: true, content: data.risks.slice(0, 2) },
          { id: "board-evidence", title: "Evidence anchors", density: "compact", estimatedHeight: 3, keepTogether: true, content: data.evidenceAnchors.slice(0, 3) },
        ],
      ];
  }
};

const runDocumentQa = (mode: ExportMode, data: ExportSemanticData) => {
  const plans = buildQaPlans(mode, data);
  const issues = plans.flatMap((modules) => exportQA(mode, modules, modules.reduce((sum, module) => sum + module.estimatedHeight, 0)).issues);
  return {
    ok: issues.length === 0,
    issues,
  };
};

const renderModeHtml = (mode: ExportMode, data: ExportSemanticData) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${exportBaseCss}\n${exportPrintCss}</style>
  </head>
  <body>
    <div class="export-document">${renderToStaticMarkup(<ExportRouter mode={mode} data={data} />)}</div>
  </body>
</html>`;

export const buildExportBundle = ({
  data,
  scenarioId,
  month,
}: {
  data: ExportSemanticData;
  scenarioId: string;
  month: number;
}): ExportPreviewBundle => {
  const fittedByMode = {
    "executive-brief": fitExportDataForMode(data, "executive-brief"),
    "presentation-brief": fitExportDataForMode(data, "presentation-brief"),
    "board-onepager": fitExportDataForMode(data, "board-onepager"),
  } as const;

  const htmlByMode = {
    "executive-brief": renderModeHtml("executive-brief", fittedByMode["executive-brief"]),
    "presentation-brief": renderModeHtml("presentation-brief", fittedByMode["presentation-brief"]),
    "board-onepager": renderModeHtml("board-onepager", fittedByMode["board-onepager"]),
  } as const;

  return {
    mode: "executive-brief",
    data: fittedByMode["executive-brief"],
    htmlByMode,
    qaByMode: {
      "executive-brief": runDocumentQa("executive-brief", fittedByMode["executive-brief"]),
      "presentation-brief": runDocumentQa("presentation-brief", fittedByMode["presentation-brief"]),
      "board-onepager": runDocumentQa("board-onepager", fittedByMode["board-onepager"]),
    },
    filenameByMode: {
      "executive-brief": buildPdfFilename(scenarioId, "executive-brief", month),
      "presentation-brief": buildPdfFilename(scenarioId, "presentation-brief", month),
      "board-onepager": buildPdfFilename(scenarioId, "board-onepager", month),
    },
    orientationByMode: {
      "executive-brief": exportLayouts["executive-brief"].orientation,
      "presentation-brief": exportLayouts["presentation-brief"].orientation,
      "board-onepager": exportLayouts["board-onepager"].orientation,
    },
  };
};
