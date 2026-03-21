import { useMemo, useState } from "react";
import type { SimulationResult, ViewSnapshot, WorldStatePoint } from "../types";
import {
  extractBriefingState,
  renderBoardOnePagerHtml,
  renderExecutiveBriefHtml,
  renderPresentationBriefHtml,
} from "../utils/briefingArtifacts";
import { downloadStyledPdfArtifact } from "../utils/pdfArtifacts";

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
  const [previewArtifact, setPreviewArtifact] = useState<PreviewArtifact | null>(null);
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

  const openPreview = (artifact: PreviewArtifactKey) => {
    setPreviewArtifact(previewArtifacts[artifact]);
  };

  const downloadPreviewArtifact = () => {
    if (!previewArtifact) {
      return;
    }

    const artifactMap: Record<PreviewArtifactKey, string> = {
      executive: "executive_brief",
      presentation: "presentation_brief",
      board: "board_one_pager",
    };

    onExport?.(artifactMap[previewArtifact.artifact]);
    void downloadStyledPdfArtifact({
      filename: previewArtifact.filename,
      html: previewArtifact.html,
      orientation: previewArtifact.orientation,
    });
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
      {previewArtifact ? (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/88 p-2 sm:p-4">
          <div className="flex h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-none border border-white/10 bg-[rgba(10,16,22,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:h-[96vh] sm:rounded-[28px]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
              <div>
                <p className="section-kicker">Artifact Preview</p>
                <p className="mt-2 text-base font-semibold text-ink">{previewArtifact.title}</p>
                <p className="mt-1 max-w-3xl text-sm text-muted">{previewArtifact.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="action-button text-left" onClick={downloadPreviewArtifact}>
                  Download PDF
                </button>
                <button className="action-button text-left" onClick={() => setPreviewArtifact(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 bg-[rgba(7,11,16,0.94)] p-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:p-4">
              <div className="surface-panel-subtle flex h-fit flex-col gap-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Document</p>
                  <p className="mt-2 text-sm font-medium text-ink">{previewArtifact.filename}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Format</p>
                  <p className="mt-2 text-sm text-ink">
                    {previewArtifact.orientation === "landscape" ? "Landscape PDF" : "Portrait PDF"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Render Path</p>
                  <p className="mt-2 text-sm text-muted">
                    This preview uses the same styled HTML surface that is sent to the PDF renderer.
                  </p>
                </div>
              </div>
              <div className="min-h-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#0c1117] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-3">
                <iframe
                  className="h-full min-h-[60vh] w-full rounded-[18px] bg-[#0c1117]"
                  srcDoc={previewArtifact.html}
                  title={`${previewArtifact.title} preview`}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
