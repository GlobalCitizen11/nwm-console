import type { ProjectionResult } from "../types";
import { SYSTEM_LABELS } from "../lib/systemLabels";
import { SectionAudioControl } from "./SectionAudioControl";

interface ConditionalProjectionPanelProps {
  projection: ProjectionResult;
  worldBoundaryContext: string;
}

const formatGap = (gap: number, direction: "at_or_above" | "at_or_below") => {
  if (gap <= 0) {
    return "threshold satisfied";
  }
  return direction === "at_or_above" ? `${gap.toFixed(1)} below threshold` : `${gap.toFixed(1)} above ceiling`;
};

export function ConditionalProjectionPanel({ projection, worldBoundaryContext }: ConditionalProjectionPanelProps) {
  const nearestGap = projection.thresholdProximity
    .map((condition) => `${condition.label} is ${formatGap(condition.gap, condition.direction)}`)
    .join(". ");
  return (
    <section className="surface-panel">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="section-kicker">{SYSTEM_LABELS.PROTOSTAR}</p>
          <h3 className="section-title">Conditional projection output</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{projection.outlookSummary}</p>
        </div>
        <div className="flex gap-2">
          <SectionAudioControl
            sectionTitle="Conditional Projection"
            worldBoundaryContext={worldBoundaryContext}
            summary="The Simulation Engine provides a bounded forward outlook under explicit assumptions."
            currentState={`It is currently representing the ${projection.currentPhase} phase, with a next target of ${projection.nextPhaseTarget ?? "no further phase"}, ${projection.projectedTransitions.length} projected transitions, and an uncertainty band of ${projection.uncertaintyBand}. ${nearestGap ? `Threshold proximity currently indicates that ${nearestGap}.` : "There is no further threshold proximity because the current state is already terminal."}`}
            businessUse="This view helps clarify whether pressure is moving toward another review point under the current assumptions."
            decisionGuidance="Read it as an assumption-bound extension of the current state, not a prediction of real-world outcomes."
            rawContext={[
              `Current phase: ${projection.currentPhase}`,
              `Next phase target: ${projection.nextPhaseTarget ?? "terminal"}`,
              `Uncertainty band: ${projection.uncertaintyBand}`,
              `Assumptions: horizon ${projection.assumptions.horizonMonths}, continuation bias ${projection.assumptions.continuationBias}, cadence ${projection.assumptions.artifactCadence}, reversibility decay ${projection.assumptions.reversibilityDecay}, destabilization bias ${projection.assumptions.destabilizationBias}`,
              `Threshold proximity: ${projection.thresholdProximity.map((condition) => `${condition.label} current ${condition.currentValue} target ${condition.targetValue} gap ${condition.gap}`).join(" | ") || "none"}`,
              `Projected phase path: ${projection.projectedTimeline.map((point) => `M${point.month} ${point.phase}`).join(" | ")}`,
            ]}
          />
          <div className="surface-panel-subtle px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted">
            Exploratory only. Simulation Engine output under explicit assumptions.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Assumptions</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            <div>Horizon: <span className="text-muted">{projection.assumptions.horizonMonths} months</span></div>
            <div>Continuation bias: <span className="text-muted">{projection.assumptions.continuationBias}</span></div>
            <div>Artifact cadence: <span className="text-muted">{projection.assumptions.artifactCadence}</span></div>
            <div>Reversibility decay: <span className="text-muted">{projection.assumptions.reversibilityDecay}</span></div>
            <div>Destabilization bias: <span className="text-muted">{projection.assumptions.destabilizationBias}</span></div>
          </div>
        </div>

        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Threshold proximity</p>
          <div className="mt-3 space-y-2">
            {projection.thresholdProximity.length > 0 ? (
              projection.thresholdProximity.map((condition) => (
                <div key={condition.label} className="text-sm text-ink">
                  <div>{condition.label}</div>
                  <div className="text-muted">{formatGap(condition.gap, condition.direction)}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No further phase threshold exists beyond the current terminal regime.</p>
            )}
          </div>
        </div>

        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Projection status</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            <div>Current phase: <span className="text-muted">{projection.currentPhase}</span></div>
            <div>Next target: <span className="text-muted">{projection.nextPhaseTarget ?? "Terminal phase"}</span></div>
            <div>Uncertainty band: <span className="text-muted">{projection.uncertaintyBand}</span></div>
            <div>Projected transitions: <span className="text-muted">{projection.projectedTransitions.length}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Projected phase path</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {projection.projectedTimeline.map((point) => (
              <span
                key={point.month}
                className="rounded-sm border border-edge px-2 py-1 text-xs uppercase tracking-[0.14em] text-ink"
                style={{ borderColor: point.halo.dominantOrientationColor }}
              >
                M{point.month} {point.phase}
              </span>
            ))}
          </div>
        </div>

        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Projected adjudications</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            {projection.projectedTransitions.length > 0 ? (
              projection.projectedTransitions.map((transition) => (
                <div key={transition.id}>
                  {transition.fromPhase} {"->"} {transition.toPhase} at M{transition.month}
                </div>
              ))
            ) : (
              <p className="text-muted">No additional phase transition is reopened under the current assumptions.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
