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

  const exportExecutiveBrief = () => {
    onExport?.("executive_brief");
    void downloadStyledPdfArtifact({
      filename: `${currentView.scenarioId}-executive-brief-${exportTag}.pdf`,
      html: renderExecutiveBriefHtml(briefingState, currentView.name),
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

  const exportPresentationBrief = () => {
    onExport?.("presentation_brief");
    void downloadStyledPdfArtifact({
      filename: `${currentView.scenarioId}-presentation-brief-${exportTag}.pdf`,
      html: renderPresentationBriefHtml(briefingState, currentView.name),
      orientation: "landscape",
    });
  };

  const exportBoardOnePager = () => {
    onExport?.("board_one_pager");
    void downloadStyledPdfArtifact({
      filename: `${currentView.scenarioId}-board-one-pager-${exportTag}.pdf`,
      html: renderBoardOnePagerHtml(briefingState, currentView.name),
    });
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
          <button className="action-button text-left" onClick={exportExecutiveBrief}>
            Export
          </button>
        </div>
        <div className="surface-panel-subtle flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-ink">Presentation Brief</p>
            <p className="mt-1 text-sm text-muted">Styled HTML sheet for executive review, meeting prep, or print.</p>
          </div>
          <div className="flex gap-2">
            <button className="action-button text-left" onClick={exportPresentationBrief}>
              Export
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
          <button className="action-button text-left" onClick={exportBoardOnePager}>
            Export
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
