import { useMemo } from "react";
import type { SimulationResult, ViewSnapshot, WorldStatePoint } from "../types";
import {
  extractBriefingState,
  renderBoardOnePagerHtml,
  renderExecutiveBriefHtml,
  renderPresentationBriefHtml,
} from "../utils/briefingArtifacts";

interface BriefingExportPanelProps {
  scenarioLabel: string;
  result: SimulationResult;
  point: WorldStatePoint;
  currentView: ViewSnapshot;
  onExport?: (artifact: string) => void;
}

type PreviewArtifactKey = "executive" | "presentation" | "board";

interface PreviewArtifact {
  artifact: PreviewArtifactKey;
  title: string;
  description: string;
  filename: string;
  html: string;
  orientation?: "portrait" | "landscape";
}

const download = (filename: string, content: string, mime = "application/json") => {
  const blob = new Blob([content], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const buildExportTag = (point: WorldStatePoint) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `m${point.month}-${timestamp}`;
};

export function BriefingExportPanel({ scenarioLabel, result, point, currentView, onExport }: BriefingExportPanelProps) {
  const briefingState = extractBriefingState({
    scenarioName: scenarioLabel,
    result,
    point,
    currentView,
  });
  const exportTag = buildExportTag(point);

  const previewArtifacts = useMemo<Record<PreviewArtifactKey, PreviewArtifact>>(
    () => ({
      executive: {
        artifact: "executive",
        title: "Executive Brief",
        description: "Preview the executive briefing surface before downloading the styled PDF.",
        filename: `${currentView.scenarioId}-executive-brief-${exportTag}.pdf`,
        html: renderExecutiveBriefHtml(briefingState, currentView.name),
      },
      presentation: {
        artifact: "presentation",
        title: "Presentation Brief",
        description: "Review the slide-style briefing layout before downloading the presentation PDF.",
        filename: `${currentView.scenarioId}-presentation-brief-${exportTag}.pdf`,
        html: renderPresentationBriefHtml(briefingState, currentView.name),
        orientation: "landscape",
      },
      board: {
        artifact: "board",
        title: "Board One Pager",
        description: "Inspect the board-ready one-pager in-console before downloading the leave-behind PDF.",
        filename: `${currentView.scenarioId}-board-one-pager-${exportTag}.pdf`,
        html: renderBoardOnePagerHtml(briefingState, currentView.name),
      },
    }),
    [briefingState, currentView.name, currentView.scenarioId, exportTag],
  );

  const buildPreviewDocument = (artifact: PreviewArtifact) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${artifact.title} Preview</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #081018;
        color: #f3f7fa;
        font-family: "Inter", "Segoe UI", sans-serif;
      }
      .preview-shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr;
      }
      .preview-toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 22px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        background: rgba(7, 12, 18, 0.94);
        backdrop-filter: blur(16px);
      }
      .preview-meta {
        max-width: 720px;
      }
      .preview-kicker {
        margin: 0;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #8aa3b5;
      }
      .preview-title {
        margin: 8px 0 0;
        font-size: 20px;
        font-weight: 600;
        color: #f6fbff;
      }
      .preview-description {
        margin: 8px 0 0;
        font-size: 13px;
        line-height: 1.5;
        color: #9cb2c1;
      }
      .preview-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .preview-button {
        appearance: none;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(20, 31, 42, 0.95);
        color: #f5fbff;
        border-radius: 999px;
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .preview-button:hover {
        background: rgba(28, 43, 57, 0.98);
      }
      .preview-surface {
        padding: 20px 20px 36px;
      }
      @page {
        size: ${artifact.orientation === "landscape" ? "letter landscape" : "letter portrait"};
        margin: 12mm;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .preview-toolbar {
          display: none !important;
        }
        .preview-surface {
          padding: 0;
        }
      }
      @media (max-width: 720px) {
        .preview-toolbar {
          padding: 14px 16px;
        }
        .preview-surface {
          padding: 12px 12px 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="preview-shell">
      <div class="preview-toolbar">
        <div class="preview-meta">
          <p class="preview-kicker">Artifact Preview</p>
          <p class="preview-title">${artifact.title}</p>
          <p class="preview-description">${artifact.description}</p>
        </div>
        <div class="preview-actions">
          <button class="preview-button" id="download-artifact">Download PDF</button>
          <button class="preview-button" id="close-preview">Close</button>
        </div>
      </div>
      <div class="preview-surface">
        ${artifact.html}
      </div>
    </div>
    <script>
      document.getElementById("download-artifact")?.addEventListener("click", () => {
        window.focus();
        window.print();
      });
      document.getElementById("close-preview")?.addEventListener("click", () => window.close());
    </script>
  </body>
</html>`;

  const openPreview = (artifact: PreviewArtifactKey) => {
    const preview = previewArtifacts[artifact];
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      return;
    }

    const artifactMap: Record<PreviewArtifactKey, string> = {
      executive: "executive_brief",
      presentation: "presentation_brief",
      board: "board_one_pager",
    };

    onExport?.(artifactMap[artifact]);
    previewWindow.document.open();
    previewWindow.document.write(buildPreviewDocument(preview));
    previewWindow.document.close();
  };

  const exportAuditPacket = () => {
    onExport?.("audit_packet");
    download(
      `${currentView.scenarioId}-audit-packet-${exportTag}.json`,
      JSON.stringify(
        {
          scenario: scenarioLabel,
          view: currentView,
          transitions: result.transitions,
          proofObjects: result.proofObjects,
        },
        null,
        2,
      ),
    );
  };

  const exportReplaySnapshot = () => {
    onExport?.("replay_snapshot");
    download(
      `${currentView.scenarioId}-replay-snapshot-${exportTag}.json`,
      JSON.stringify(
        {
          scenario: scenarioLabel,
          world: result.world,
          point,
        },
        null,
        2,
      ),
    );
  };

  const printBrief = () => {
    onExport?.("print_brief");
    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) {
      return;
    }
    printWindow.document.write(renderExecutiveBriefHtml(briefingState, currentView.name));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="surface-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Exports</p>
          <p className="mt-2 text-sm text-muted">
            Generate briefing artifacts for executive review, audit handoff, or a point-in-time replay snapshot.
          </p>
        </div>
        <div className="surface-panel-subtle text-sm text-muted">
          <p>View: <span className="text-ink">{currentView.name}</span></p>
          <p className="mt-2">Phase: <span className="text-ink">{point.phase}</span></p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="surface-panel-subtle flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-ink">Executive Brief</p>
            <p className="mt-1 text-sm text-muted">Styled console brief for executive circulation or direct review.</p>
          </div>
          <button className="action-button text-left" onClick={() => openPreview("executive")}>
            Preview
          </button>
        </div>
        <div className="surface-panel-subtle flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-ink">Presentation Brief</p>
            <p className="mt-1 text-sm text-muted">Styled HTML sheet for executive review, meeting prep, or print.</p>
          </div>
          <div className="flex gap-2">
            <button className="action-button text-left" onClick={() => openPreview("presentation")}>
              Preview
            </button>
            <button className="action-button text-left" onClick={printBrief}>
              Print
            </button>
          </div>
        </div>
        <div className="surface-panel-subtle flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-ink">Board One Pager</p>
            <p className="mt-1 text-sm text-muted">A cleaner leave-behind summary for board, committee, or post-meeting follow-up.</p>
          </div>
          <button className="action-button text-left" onClick={() => openPreview("board")}>
            Preview
          </button>
        </div>
        <div className="surface-panel-subtle flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-ink">Audit Packet</p>
            <p className="mt-1 text-sm text-muted">Transitions and proof objects for governance or challenge review.</p>
          </div>
          <button className="action-button text-left" onClick={exportAuditPacket}>
            Export
          </button>
        </div>
        <div className="surface-panel-subtle flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-ink">Replay Snapshot</p>
            <p className="mt-1 text-sm text-muted">Current world point, metrics, and month-specific state.</p>
          </div>
          <button className="action-button text-left" onClick={exportReplaySnapshot}>
            Export
          </button>
        </div>
      </div>
    </section>
  );
}
