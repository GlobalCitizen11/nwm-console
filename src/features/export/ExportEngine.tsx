import { renderToStaticMarkup } from "react-dom/server";
import exportBaseCss from "./styles/export-base.css?raw";
import exportPrintCss from "./styles/export-print.css?raw";
import type { BoardOnePagerContent, CanonicalExportSummary, ExecutiveBriefContent, ExportContentByMode, ExportMode, ExportPreviewBundle, ExportQaResult, ExportSemanticData, PresentationBriefContent } from "./types/export";
import { buildPdfFilename } from "./utils/pdfMetadata";
import { ExportRouter } from "./ExportRouter";
import { exportLayouts } from "./config/exportLayouts";
import { buildCanonicalSummary } from "./utils/canonicalSummary";
import { renderBoardOnePager, renderExecutiveBrief, renderPresentationBrief } from "./utils/renderArtifactContent";
import { validateBoardOnePager, validateCanonicalSummary, validateExecutiveBrief, validatePresentationBrief } from "./utils/validateArtifacts";

const renderModeHtml = (mode: ExportMode, contentByMode: ExportContentByMode) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${exportBaseCss}\n${exportPrintCss}</style>
  </head>
  <body>
    <div class="export-document">${renderToStaticMarkup(<ExportRouter mode={mode} contentByMode={contentByMode} />)}</div>
  </body>
</html>`;

const buildArtifactContent = (
  summary: CanonicalExportSummary,
): {
  contentByMode: ExportContentByMode;
  qaByMode: Record<ExportMode, ExportQaResult>;
} => {
  const renderWithRetry = <T,>(
    render: (compact?: boolean) => T,
    validate: (content: T) => ExportQaResult,
  ) => {
    const full = render(false);
    const fullQa = validate(full);
    if (fullQa.ok) {
      return { content: full, qa: fullQa };
    }
    const compact = render(true);
    const compactQa = validate(compact);
    return { content: compact, qa: compactQa };
  };

  const board = renderWithRetry<BoardOnePagerContent>(
    (compact) => renderBoardOnePager(summary, compact),
    validateBoardOnePager,
  );
  const executive = renderWithRetry<ExecutiveBriefContent>(
    (compact) => renderExecutiveBrief(summary, compact),
    validateExecutiveBrief,
  );
  const presentation = renderWithRetry<PresentationBriefContent>(
    (compact) => renderPresentationBrief(summary, compact),
    validatePresentationBrief,
  );

  return {
    contentByMode: {
      "board-onepager": board.content,
      "executive-brief": executive.content,
      "presentation-brief": presentation.content,
    },
    qaByMode: {
      "board-onepager": board.qa,
      "executive-brief": executive.qa,
      "presentation-brief": presentation.qa,
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
  const canonicalQa = validateCanonicalSummary(canonicalSummary);
  const { contentByMode, qaByMode: contentQaByMode } = buildArtifactContent(canonicalSummary);

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
