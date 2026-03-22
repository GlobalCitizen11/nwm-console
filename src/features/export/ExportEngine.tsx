import { renderToStaticMarkup } from "react-dom/server";
import exportBaseCss from "./styles/export-base.css?raw";
import exportPrintCss from "./styles/export-print.css?raw";
import type { ExportMode, ExportPreviewBundle, ExportSemanticData } from "./types/export";
import { buildPdfFilename } from "./utils/pdfMetadata";
import { exportQA } from "./utils/exportQA";
import { ExportRouter } from "./ExportRouter";
import { exportLayouts } from "./config/exportLayouts";

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
  const htmlByMode = {
    "executive-brief": renderModeHtml("executive-brief", data),
    "presentation-brief": renderModeHtml("presentation-brief", data),
    "board-onepager": renderModeHtml("board-onepager", data),
  } as const;

  return {
    mode: "executive-brief",
    data,
    htmlByMode,
    qaByMode: {
      "executive-brief": exportQA("executive-brief", [
        { id: "exec-1", title: "Key insights", density: "standard", estimatedHeight: 6, content: data.keyInsights },
        { id: "exec-2", title: "System stats", density: "standard", estimatedHeight: 4, content: data.systemStats },
        { id: "exec-3", title: "Implications", density: "standard", estimatedHeight: 5, content: data.implications },
      ], exportLayouts["executive-brief"].targetUnits),
      "presentation-brief": exportQA("presentation-brief", [
        { id: "pres-1", title: "System state", density: "expanded", estimatedHeight: 4, content: data.systemStats },
        { id: "pres-2", title: "Takeaways", density: "expanded", estimatedHeight: 4, content: data.keyInsights },
      ], exportLayouts["presentation-brief"].targetUnits),
      "board-onepager": exportQA("board-onepager", [
        { id: "board-1", title: "Topline", density: "compact", estimatedHeight: 5, content: data.keyInsights.slice(0, 4) },
        { id: "board-2", title: "System", density: "compact", estimatedHeight: 4, content: data.systemStats.slice(0, 4) },
        { id: "board-3", title: "Implications", density: "compact", estimatedHeight: 4, content: data.implications.slice(0, 3) },
        { id: "board-4", title: "Evidence", density: "compact", estimatedHeight: 3, content: data.evidenceAnchors.slice(0, 3) },
      ], exportLayouts["board-onepager"].targetUnits),
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
