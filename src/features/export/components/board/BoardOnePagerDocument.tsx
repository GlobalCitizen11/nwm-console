import type { BoardOnePagerContent } from "../../types/export";
import { ExportPage } from "../primitives/ExportPage";
import { BoardDecisionBox } from "./BoardDecisionBox";
import { BoardEvidenceStrip } from "./BoardEvidenceStrip";
import { SignalCard } from "../primitives/SignalCard";
import { StatusChip } from "../primitives/StatusChip";
import { getAdjudicationStatusDisplay, getPhaseResolutionReasonDisplay, SYSTEM_LABELS } from "../../../../lib/systemLabels";

const metricValue = (value: number) => value.toFixed(1);

export function BoardOnePagerDocument({ content }: { content: BoardOnePagerContent }) {
  const { phaseResolution, proofSummary, stateVector } = content.v2;
  const adjudicationStatus = getAdjudicationStatusDisplay(phaseResolution.adjudicationStatus);
  const adjudicationReason = getPhaseResolutionReasonDisplay(phaseResolution.rationale);
  const [firstDriver, secondDriver, thirdDriver] = content.v2.keyDrivers;
  const [firstImplication, secondImplication, thirdImplication] = content.v2.immediateImplications;
  const [firstWatch, secondWatch, thirdWatch] = content.v2.whatToWatch;
  const thresholdLead =
    phaseResolution.thresholdConditions[0] ?? "Threshold conditions remain visible in the linked proof scaffold.";

  return (
    <ExportPage
      metadata={{
        scenarioName: content.title,
        boundedWorld: content.boundedWorld,
        phase: phaseResolution.phase,
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
            <StatusChip label={SYSTEM_LABELS.PAL} value={adjudicationStatus} tone="accent" className="board-authority-chip" />
          </div>
          <header className="board-authority-band">
            <div className="board-authority-copy board-hero-panel">
              <p className="board-kicker">Threshold readout</p>
              <h1>{content.v2.currentState}</h1>
              <p className="board-authority-summary">{content.v2.structuralReality}</p>
            </div>
            <div className="board-authority-meta">
              <div className="board-authority-side-card">
                <p className="board-authority-side-label">Phase status</p>
                <div className="board-authority-side-value">{phaseResolution.phase}</div>
                <p className="mt-2 text-sm text-muted">{content.v2.adjudicationStatus}</p>
              </div>
              <div className="board-authority-state-stack">
                <div className="board-authority-state-cell">
                  <span className="board-authority-state-label">Velocity</span>
                  <strong className="board-authority-state-value">{metricValue(stateVector.velocity)}</strong>
                </div>
                <div className="board-authority-state-cell">
                  <span className="board-authority-state-label">Density</span>
                  <strong className="board-authority-state-value">{metricValue(stateVector.density)}</strong>
                </div>
                <div className="board-authority-state-cell">
                  <span className="board-authority-state-label">Coherence</span>
                  <strong className="board-authority-state-value">{metricValue(stateVector.coherence)}</strong>
                </div>
                <div className="board-authority-state-cell">
                  <span className="board-authority-state-label">Reversibility</span>
                  <strong className="board-authority-state-value">{metricValue(stateVector.reversibility)}</strong>
                </div>
              </div>
            </div>
          </header>
        </section>

        <section className="board-signal-grid board-signal-grid--three-column board-console-panel">
          <div className="board-signal-column board-signal-column--strategy board-lane-shell">
            <div className="board-signal-lane-header">
              <span className="board-signal-lane-index">01</span>
              <span className="board-signal-lane-label">System State</span>
              <strong className="board-signal-lane-value">Current read and explicit variables</strong>
            </div>
            <SignalCard
              title="Current state"
              strength={phaseResolution.phase}
              insight={content.v2.currentState}
              implication={content.v2.structuralReality}
              tag="confirmation"
              className="board-signal-cell board-signal-cell--critical"
            />
            <SignalCard
              title="State vector"
              strength={`Confidence ${metricValue(stateVector.confidence)}`}
              insight={`Velocity ${metricValue(stateVector.velocity)} | Density ${metricValue(stateVector.density)}`}
              implication={`Coherence ${metricValue(stateVector.coherence)} | Reversibility ${metricValue(stateVector.reversibility)}`}
              tag="confirmation"
              className="board-signal-cell"
            />
            <SignalCard
              title={`${SYSTEM_LABELS.PAL} status`}
              strength={adjudicationStatus}
              insight={adjudicationReason}
              implication={thresholdLead}
              tag="shift"
              className="board-signal-cell"
            />
          </div>

          <div className="board-signal-column board-signal-column--risk board-lane-shell">
            <div className="board-signal-lane-header">
              <span className="board-signal-lane-index">02</span>
              <span className="board-signal-lane-label">Structural Drivers</span>
              <strong className="board-signal-lane-value">Why the current read resolves this way</strong>
            </div>
            <SignalCard
              title="Key drivers"
              strength="Traceable"
              insight={firstDriver ?? "Driver concentration remains visible in the artifact set."}
              implication={secondDriver ?? content.v2.traceabilitySummary}
              tag="confirmation"
              className="board-signal-cell"
            >
              {thirdDriver ? <div className="board-signal-mini-row">{thirdDriver}</div> : null}
            </SignalCard>
            <SignalCard
              title="Immediate implications"
              strength="Current surface"
              insight={firstImplication ?? "Immediate implications remain tied to the visible state."}
              implication={secondImplication ?? proofSummary}
              tag="risk"
              className="board-signal-cell"
            >
              {thirdImplication ? <div className="board-signal-mini-row">{thirdImplication}</div> : null}
            </SignalCard>
          </div>

          <div className="board-signal-column board-signal-column--signals board-lane-shell">
            <div className="board-signal-lane-header">
              <span className="board-signal-lane-index">03</span>
              <span className="board-signal-lane-label">Sensitivity</span>
              <strong className="board-signal-lane-value">What to watch without collapsing into projection</strong>
            </div>
            <SignalCard
              title="What to watch"
              strength="Pre-GCS"
              insight={firstWatch ?? "Sensitivity remains bounded to the visible artifact mix."}
              implication={secondWatch ?? "Counterweight conditions remain visible, not simulated."}
              tag="shift"
              className="board-signal-cell"
            >
              {thirdWatch ? <div className="board-signal-mini-row">{thirdWatch}</div> : null}
            </SignalCard>
            <SignalCard
              title="Traceability"
              strength="Audit-visible"
              insight={content.v2.traceabilitySummary}
              implication={proofSummary}
              tag="confirmation"
              className="board-signal-cell"
            />
          </div>
        </section>

        <section className="board-bottom-band board-console-panel">
          <BoardDecisionBox
            headline="Proof and traceability"
            summaryLines={[content.v2.adjudicationStatus]}
            bullets={[
              proofSummary,
              thresholdLead,
              "Pre-GCS sensitivity is diagnostic only and remains separate from projection and sandbox mutation.",
            ]}
          />
        </section>

        <section className="board-evidence-tape board-console-panel" aria-label="Evidence strip">
          <div className="board-evidence-kicker">Artifact traceability</div>
          <BoardEvidenceStrip items={content.evidenceAnchors} />
        </section>
      </div>
    </ExportPage>
  );
}
