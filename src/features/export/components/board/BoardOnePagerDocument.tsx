import type { BoardOnePagerContent } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { BoardDecisionBox } from "./BoardDecisionBox";
import { BoardEvidenceStrip } from "./BoardEvidenceStrip";
import { PressureBar } from "../primitives/PressureBar";
import { SignalCard } from "../primitives/SignalCard";
import { StatusChip } from "../primitives/StatusChip";

export function BoardOnePagerDocument({ content }: { content: BoardOnePagerContent }) {
  const pressureScore = 84;
  const pressureLevel = pressureScore >= 75 ? "Critical" : pressureScore >= 55 ? "Elevated" : "Managed";
  const [firstRisk, secondRisk, thirdRisk] = content.riskConcentrations;
  const [firstTrigger, secondTrigger, thirdTrigger] = content.monitoringTriggers;
  const [coordinationSignal, allocationSignal, infrastructureSignal] = content.signalGrid;
  const headerStats = content.systemStrip.slice(0, 3);
  const keySignalRows = [coordinationSignal, allocationSignal, infrastructureSignal]
    .filter(Boolean)
    .slice(0, 3)
    .map((signal) => `${signal.label}: ${signal.implication}`);

  return (
    <ExportPage
      metadata={{
        scenarioName: content.title,
        boundedWorld: content.boundedWorld,
        phase: content.systemStrip[0]?.value ?? "Unknown",
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
        <section className="board-header-zone board-console-panel">
          <div className="board-authority-rail">
            <StatusChip label="Scenario" value={content.title} className="board-authority-chip" />
            <StatusChip label="Artifact" value="Board One-Pager" className="board-authority-chip" />
            <StatusChip label="Replay Month" value={content.replayMonth} className="board-authority-chip" />
            <div className="board-authority-pressure-chip">
              <StatusChip label="Pressure" value={pressureLevel} tone={pressureLevel === "Critical" ? "warning" : "accent"} className="board-authority-chip" />
              <div className="board-authority-pressure-track" aria-hidden="true">
                <div className={`board-authority-pressure-fill board-authority-pressure-fill--${pressureLevel.toLowerCase()}`.trim()} />
              </div>
            </div>
          </div>
          <header className="board-authority-band">
            <div className="board-authority-copy board-hero-panel">
              <p className="board-kicker">Console briefing surface</p>
              <h1>{content.boardRead[0]}</h1>
              <p className="board-authority-summary">{content.boardRead[1]}</p>
            </div>
            <div className="board-authority-meta">
              <div className="board-authority-side-card">
                <p className="board-authority-side-label">System posture</p>
                <div className="board-authority-side-value">{content.topInterpretation}</div>
              </div>
              <div className="board-authority-state-stack">
                {headerStats.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="board-authority-state-cell">
                    <span className="board-authority-state-label">{item.label}</span>
                    <strong className="board-authority-state-value">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </header>
        </section>

        <section className="board-signal-grid board-signal-grid--three-column board-console-panel">
          <div className="board-signal-column board-signal-column--strategy board-lane-shell">
            <div className="board-signal-lane-header">
              <span className="board-signal-lane-index">01</span>
              <span className="board-signal-lane-label">System Path</span>
              <strong className="board-signal-lane-value">Base case and capital direction</strong>
            </div>
            <SignalCard
              title="Dominant path"
              strength="Base case"
              insight={content.dominantPath}
              implication="Globally exposed logistics assets now lose pricing power."
              tag="confirmation"
              className="board-signal-cell board-signal-cell--critical"
            />
            <SignalCard
              title="Primary pressure"
              strength={pressureLevel}
              insight={content.primaryPressure}
              implication="Regulatory alignment now determines asset attractiveness."
              tag="risk"
              className="board-signal-cell board-signal-cell--critical"
            />
            <SignalCard
              title="Fragmentation pressure"
              strength={`${pressureScore}/100`}
              insight="Pressure is moving from friction into asset repricing and execution loss."
              implication="Capital now moves first toward insulated regional systems."
              tag="risk"
              className="board-signal-cell board-signal-cell--pressure-bar"
            >
              <PressureBar label="Fragmentation Pressure" value={pressureScore} className="board-pressure-bar" />
            </SignalCard>
          </div>

          <div className="board-signal-column board-signal-column--risk board-lane-shell">
            <div className="board-signal-lane-header">
              <span className="board-signal-lane-index">02</span>
              <span className="board-signal-lane-label">Risk Field</span>
              <strong className="board-signal-lane-value">Downside concentration and inflection</strong>
            </div>
            <SignalCard
              title="Risk concentration"
              strength="Concentrated"
              insight={firstRisk ?? "Cross-border logistics face cost volatility risk."}
              implication={secondRisk ?? "Policy friction raises margin risk in exposed networks."}
              tag="risk"
              className="board-signal-cell"
            >
              {thirdRisk ? <div className="board-signal-mini-row">{thirdRisk}</div> : null}
            </SignalCard>
            <SignalCard
              title="Inflection paths"
              strength="Watch next"
              insight={content.nextChangeSignals[0] ?? "Policy enforcement accelerates. Capital reprices domestic infrastructure."}
              implication={content.nextChangeSignals[1] ?? "Trade normalization would restore global efficiency first."}
              tag="shift"
              className="board-signal-cell"
            >
              {content.nextChangeSignals[2] ? <div className="board-signal-mini-row">{content.nextChangeSignals[2]}</div> : null}
            </SignalCard>
          </div>

          <div className="board-signal-column board-signal-column--signals board-lane-shell">
            <div className="board-signal-lane-header">
              <span className="board-signal-lane-index">03</span>
              <span className="board-signal-lane-label">Signal Watch</span>
              <strong className="board-signal-lane-value">Live moves and hard triggers</strong>
            </div>
            <SignalCard
              title="Key signals"
              strength="Live"
              insight={keySignalRows[0] ?? "Capital is concentrating where sovereign alignment is strongest."}
              implication={keySignalRows[1] ?? "Long-duration capital exits globally exposed assets."}
              tag="confirmation"
              className="board-signal-cell"
            >
              {keySignalRows[2] ? <div className="board-signal-mini-row">{keySignalRows[2]}</div> : null}
            </SignalCard>
            <SignalCard
              title="Triggers"
              strength="State shifts"
              insight={firstTrigger ?? "If export controls extend downstream, optionality narrows."}
              implication={secondTrigger ?? "If regional mandates accelerate, domestic repricing deepens."}
              tag="shift"
              className="board-signal-cell"
            >
              {thirdTrigger ? <div className="board-signal-mini-row">{thirdTrigger}</div> : null}
            </SignalCard>
          </div>
        </section>

        <section className="board-bottom-band board-console-panel">
          <BoardDecisionBox headline={content.decisionHeadline} summaryLines={[content.topInterpretation]} bullets={content.decisionBullets} />
        </section>

        <section className="board-evidence-tape board-console-panel" aria-label="Evidence strip">
          <div className="board-evidence-kicker">Live evidence feed</div>
          <BoardEvidenceStrip items={content.evidenceAnchors} />
        </section>
      </div>
    </ExportPage>
  );
}
