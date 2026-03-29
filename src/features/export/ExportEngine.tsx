import { renderToStaticMarkup } from "react-dom/server";
import exportBaseCss from "./styles/export-base.css?raw";
import exportPrintCss from "./styles/export-print.css?raw";
import type { CanonicalExportSummary, ExportContentByMode, ExportMode, ExportPreviewBundle, ExportQaResult, ExportSemanticData } from "./types/export";
import type { VoiceBriefIntelligence } from "../../types/voiceBriefIntelligence";
import { buildPdfFilename } from "./utils/pdfMetadata";
import { ExportRouter } from "./ExportRouter";
import { exportTokenCssText } from "./design-tokens/cssVariables";
import { exportLayouts } from "./config/exportLayouts";
import { buildCanonicalSummary } from "./utils/canonicalSummary";
import { renderBoardOnePager, renderExecutiveBrief, renderPresentationBrief } from "./utils/renderArtifactContent";
import { validateBoardOnePager, validateCanonicalSummary, validateExecutiveBrief, validatePresentationBrief } from "./utils/validateArtifacts";
import { buildAssistedIntelligenceFromSummary } from "../../lib/artifactSpecBuilders";

const renderModeHtml = (mode: ExportMode, contentByMode: ExportContentByMode) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${exportTokenCssText}\n${exportBaseCss}\n${exportPrintCss}</style>
  </head>
  <body class="export-root export-root--${mode} export-root--${exportLayouts[mode].orientation}">
    <div class="export-document export-document--${mode} export-document--${exportLayouts[mode].orientation}">${renderToStaticMarkup(
      <ExportRouter mode={mode} contentByMode={contentByMode} />,
    )}</div>
  </body>
</html>`;

const buildArtifactContent = (
  summary: CanonicalExportSummary,
  assistedIntelligence: VoiceBriefIntelligence,
): {
  contentByMode: ExportContentByMode;
  qaByMode: Record<ExportMode, ExportQaResult>;
} => {
  const board = renderBoardOnePager(summary, assistedIntelligence);
  const executive = renderExecutiveBrief(summary, assistedIntelligence);
  const presentation = renderPresentationBrief(summary, assistedIntelligence);

  return {
    contentByMode: {
      "board-onepager": board,
      "executive-brief": executive,
      "presentation-brief": presentation,
    },
    qaByMode: {
      "board-onepager": validateBoardOnePager(board),
      "executive-brief": validateExecutiveBrief(executive),
      "presentation-brief": validatePresentationBrief(presentation),
    },
  };
};

export const buildExportBundle = ({
  data,
  scenarioId,
  month,
}: {
  data: ExportSemanticData;
  scenarioId: string;
  month: number;
}): ExportPreviewBundle => {
  const canonicalSummary = buildCanonicalSummary(data);
  const assistedIntelligence = buildAssistedIntelligenceFromSummary(canonicalSummary);
  const canonicalQa = validateCanonicalSummary(canonicalSummary);
  const { contentByMode, qaByMode: contentQaByMode } = buildArtifactContent(canonicalSummary, assistedIntelligence);

  const htmlByMode = {
    "executive-brief": renderModeHtml("executive-brief", contentByMode),
    "presentation-brief": renderModeHtml("presentation-brief", contentByMode),
    "board-onepager": renderModeHtml("board-onepager", contentByMode),
  } as const;

  const mergeQa = (mode: ExportMode): ExportQaResult => ({
    ok: canonicalQa.ok && contentQaByMode[mode].ok,
    issues: [...canonicalQa.issues, ...contentQaByMode[mode].issues],
  });

  return {
    mode: "executive-brief",
    data,
    canonicalSummary,
    intelligenceSource: "canonical-assisted",
    voiceIntelligence: assistedIntelligence,
    contentByMode,
    htmlByMode,
    qaByMode: {
      "executive-brief": mergeQa("executive-brief"),
      "presentation-brief": mergeQa("presentation-brief"),
      "board-onepager": mergeQa("board-onepager"),
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
