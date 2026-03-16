import type { SimulationResult, ViewSnapshot, WorldStatePoint } from "../types";

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

const buildExecutiveBriefHtml = (
  scenarioLabel: string,
  result: SimulationResult,
  point: WorldStatePoint,
  currentView: ViewSnapshot,
) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${scenarioLabel} Brief</title>
    <style>
      body { font-family: "Avenir Next", "Segoe UI", Arial, sans-serif; background: #0c1117; color: #d7e0ea; margin: 0; padding: 32px; }
      .sheet { max-width: 980px; margin: 0 auto; border: 1px solid #223041; background: #121922; padding: 28px; }
      .kicker { font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #7f90a4; }
      h1 { margin: 12px 0 8px; font-size: 30px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
      .card { border: 1px solid #223041; background: #0c1117; padding: 16px; }
      .muted { color: #7f90a4; }
      .wide { margin-top: 18px; border: 1px solid #223041; background: #0c1117; padding: 16px; }
      ul { margin: 10px 0 0 18px; color: #d7e0ea; }
    </style>
  </head>
  <body>
    <section class="sheet">
      <div class="kicker">Executive Brief</div>
      <h1>${scenarioLabel}</h1>
      <p class="muted">${result.world.summary}</p>
      <div class="grid">
        <div class="card"><div class="kicker">World</div><p>${result.world.name}</p></div>
        <div class="card"><div class="kicker">Month</div><p>${point.month}</p></div>
        <div class="card"><div class="kicker">Phase</div><p>${point.phase}</p></div>
        <div class="card"><div class="kicker">Transitions</div><p>${result.transitions.length}</p></div>
        <div class="card"><div class="kicker">Velocity</div><p>${point.metrics.velocity}</p></div>
        <div class="card"><div class="kicker">Density</div><p>${point.metrics.density}</p></div>
        <div class="card"><div class="kicker">Coherence</div><p>${point.metrics.coherence}</p></div>
        <div class="card"><div class="kicker">Reversibility</div><p>${point.metrics.reversibility}</p></div>
      </div>
      <section class="wide">
        <div class="kicker">Boundary</div>
        <p>${result.world.domain} | ${result.world.geography} | ${result.world.governanceMode}</p>
        <p class="muted">${result.world.summary}</p>
      </section>
      <section class="wide">
        <div class="kicker">Transition Highlights</div>
        <ul>
          ${result.transitions
            .slice(0, 4)
            .map((transition) => `<li>Month ${transition.month}: ${transition.fromPhase} to ${transition.toPhase}</li>`)
            .join("") || "<li>No adjudicated transitions recorded.</li>"}
        </ul>
      </section>
      <p class="muted" style="margin-top: 22px;">Generated from ${currentView.name}. Orientation and evidence only. Not automated judgment.</p>
    </section>
  </body>
</html>`;

const buildBoardOnePagerHtml = (
  scenarioLabel: string,
  result: SimulationResult,
  point: WorldStatePoint,
  currentView: ViewSnapshot,
) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${scenarioLabel} Board One Pager</title>
    <style>
      body { font-family: "Avenir Next", "Segoe UI", Arial, sans-serif; background: #f5f7fa; color: #14202b; margin: 0; padding: 28px; }
      .sheet { max-width: 980px; margin: 0 auto; background: #ffffff; border: 1px solid #d6dde5; padding: 28px; }
      .kicker { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #6f8091; }
      h1 { margin: 12px 0 6px; font-size: 30px; }
      .sub { color: #516170; line-height: 1.6; }
      .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
      .card { border: 1px solid #d6dde5; padding: 14px; background: #fbfcfd; }
      .section { margin-top: 20px; border-top: 1px solid #d6dde5; padding-top: 18px; }
      ul { margin: 10px 0 0 18px; }
    </style>
  </head>
  <body>
    <section class="sheet">
      <div class="kicker">Board One Pager</div>
      <h1>${scenarioLabel}</h1>
      <p class="sub">${result.world.summary}</p>
      <div class="grid">
        <div class="card"><div class="kicker">Current Phase</div><p>${point.phase}</p></div>
        <div class="card"><div class="kicker">Replay Month</div><p>${point.month}</p></div>
        <div class="card"><div class="kicker">Transitions</div><p>${result.transitions.length}</p></div>
        <div class="card"><div class="kicker">Governance</div><p>${result.world.governanceMode}</p></div>
      </div>
      <section class="section">
        <div class="kicker">Narrative Bounded World</div>
        <p>${result.world.name}</p>
        <p class="sub">${result.world.domain} | ${result.world.geography} | ${result.world.timeHorizonMonths} months</p>
      </section>
      <section class="section">
        <div class="kicker">Key Signals To Watch</div>
        <ul>
          <li>Velocity ${point.metrics.velocity}, density ${point.metrics.density}, coherence ${point.metrics.coherence}, reversibility ${point.metrics.reversibility}</li>
          <li>${result.transitions.length > 0 ? `Most recent adjudicated transition: month ${result.transitions[result.transitions.length - 1].month}` : "No adjudicated transition yet"}</li>
          <li>Visible artifacts at this point: ${point.visibleEvents.length}</li>
        </ul>
      </section>
      <section class="section">
        <div class="kicker">Governed Use</div>
        <p class="sub">Use this brief for executive orientation, review timing, committee preparation, and structured follow-up. Generated from ${currentView.name}.</p>
      </section>
    </section>
  </body>
</html>`;

export function BriefingExportPanel({ scenarioLabel, result, point, currentView, onExport }: BriefingExportPanelProps) {
  const exportExecutiveBrief = () => {
    onExport?.("executive_brief");
    download(
      `${currentView.scenarioId}-executive-brief.txt`,
      [
        `Scenario: ${scenarioLabel}`,
        `World: ${result.world.name}`,
        `Month: ${point.month}`,
        `Phase: ${point.phase}`,
        `Velocity: ${point.metrics.velocity}`,
        `Density: ${point.metrics.density}`,
        `Coherence: ${point.metrics.coherence}`,
        `Reversibility: ${point.metrics.reversibility}`,
        `Transitions: ${result.transitions.length}`,
      ].join("\n"),
      "text/plain",
    );
  };

  const exportAuditPacket = () => {
    onExport?.("audit_packet");
    download(
      `${currentView.scenarioId}-audit-packet.json`,
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
      `${currentView.scenarioId}-month-${point.month}-snapshot.json`,
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
    download(
      `${currentView.scenarioId}-executive-brief.html`,
      buildExecutiveBriefHtml(scenarioLabel, result, point, currentView),
      "text/html",
    );
  };

  const exportBoardOnePager = () => {
    onExport?.("board_one_pager");
    download(
      `${currentView.scenarioId}-board-one-pager.html`,
      buildBoardOnePagerHtml(scenarioLabel, result, point, currentView),
      "text/html",
    );
  };

  const printBrief = () => {
    onExport?.("print_brief");
    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) {
      return;
    }
    printWindow.document.write(buildExecutiveBriefHtml(scenarioLabel, result, point, currentView));
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
            <p className="mt-1 text-sm text-muted">Plain-text summary for fast redistribution.</p>
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
