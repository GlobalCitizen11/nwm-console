import type { BoardOnePagerContent } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { BoardEvidenceStrip } from "./BoardEvidenceStrip";

export function BoardOnePagerDocument({ content }: { content: BoardOnePagerContent }) {
  return (
    <ExportPage
      metadata={{
        scenarioName: content.title,
        boundedWorld: content.boundedWorld,
        phase: content.signalStack[0]?.value ?? "Unknown",
        asOf: content.replayMonth,
        generatedAt: content.timestamp,
        confidentiality: content.confidentialityLabel,
        currentViewName: "Board One-Pager",
      }}
      pageNumber={1}
      totalPages={1}
      className="board-onepager"
    >
      <div className="board-onepager-shell">
        <header className="board-header-band">
          <div className="board-header-copy">
            <h1>{content.title}</h1>
            <p>{content.boundedWorld}</p>
          </div>
          <div className="board-header-meta">
            <span>{content.replayMonth}</span>
            <span>{content.confidentialityLabel}</span>
          </div>
        </header>
        <div className="board-main-grid">
          <div className="board-left-stack">
            <section className="export-section board-left-column">
              <p className="signal-module-label">System state</p>
              <h3 className="signal-module-value">{content.currentStateSummary}</h3>
              <p className="signal-module-support">{content.implicationsSummary}</p>
            </section>
          </div>
          <aside className="board-signal-stack">
            {content.signalStack.map((item) => (
              <section key={item.label} className="board-signal-module">
                <p className="signal-module-label">{item.label}</p>
                <h4 className="signal-module-value">{item.value}</h4>
                {item.support ? <p className="signal-module-support">{item.support}</p> : null}
              </section>
            ))}
          </aside>
        </div>
        <div className="board-bottom-grid">
          <section className="export-section strategic-block strategic-block--risk">
            <div className="export-section-title">
              <p className="export-meta-label">Monitoring</p>
              <h3>Watchpoints</h3>
            </div>
            <p className="signal-module-support">{content.monitoringSummary}</p>
          </section>
          <section className="export-section board-evidence-row">
            <div className="export-section-title">
              <p className="export-meta-label">Signal basis</p>
              <h3>Evidence anchors</h3>
            </div>
            <BoardEvidenceStrip items={content.evidenceAnchors} />
          </section>
        </div>
      </div>
    </ExportPage>
  );
}
