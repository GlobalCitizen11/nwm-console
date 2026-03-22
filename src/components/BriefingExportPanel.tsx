import { useMemo } from "react";
import type { SimulationResult, ViewSnapshot, WorldStatePoint } from "../types";
import { buildExportBundle } from "../features/export/ExportEngine";
import { saveExportPreviewPayload } from "../features/export/storage";
import { normalizeExportData } from "../features/export/utils/normalizeExportData";
import { extractBriefingState } from "../utils/briefingArtifacts";

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
  routePath: string;
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
  const exportData = normalizeExportData(briefingState, currentView.name);
  const exportTag = buildExportTag(point);

  const previewArtifacts = useMemo<Record<PreviewArtifactKey, PreviewArtifact>>(
    () => {
      return {
        executive: {
          artifact: "executive",
          title: "Executive Brief",
          description: "Preview the executive briefing surface before downloading the styled PDF.",
          routePath: "/export/executive-brief",
        },
        presentation: {
          artifact: "presentation",
          title: "Presentation Brief",
          description: "Review the slide-style briefing layout before downloading the presentation PDF.",
          routePath: "/export/presentation-brief",
        },
        board: {
          artifact: "board",
          title: "Board One Pager",
          description: "Inspect the board-ready one-pager in-console before downloading the leave-behind PDF.",
          routePath: "/export/board-onepager",
        },
      };
    },
    [],
  );

  const openPreview = (artifact: PreviewArtifactKey) => {
    const preview = previewArtifacts[artifact];
    const artifactMap: Record<PreviewArtifactKey, string> = {
      executive: "executive_brief",
      presentation: "presentation_brief",
      board: "board_one_pager",
    };

    onExport?.(artifactMap[artifact]);
    const normalized = buildExportBundle({
      data: exportData,
      scenarioId: currentView.scenarioId,
      month: point.month,
    });
    const token = saveExportPreviewPayload({
      ...normalized,
      mode:
        artifact === "executive"
          ? "executive-brief"
          : artifact === "presentation"
            ? "presentation-brief"
            : "board-onepager",
    });
    window.open(`${preview.routePath}?token=${encodeURIComponent(token)}`, "_blank");
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
    const token = saveExportPreviewPayload({
      ...buildExportBundle({
        data: exportData,
        scenarioId: currentView.scenarioId,
        month: point.month,
      }),
      mode: "executive-brief",
    });
    window.open(`/export/executive-brief?token=${encodeURIComponent(token)}`, "_blank");
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
