import type { TransitionRecord } from "../types";
import { SectionAudioControl } from "./SectionAudioControl";

interface TransitionInspectorProps {
  transitions: TransitionRecord[];
  selectedTransitionId: string | null;
  onSelectTransition: (transitionId: string) => void;
  worldBoundaryContext: string;
}

export function TransitionInspector({
  transitions,
  selectedTransitionId,
  onSelectTransition,
  worldBoundaryContext,
}: TransitionInspectorProps) {
  const selected =
    transitions.find((transition) => transition.id === selectedTransitionId) ?? transitions[0] ?? null;
  const selectedRationale = selected
    ? `The current selection indicates a move from ${selected.fromPhase} to ${selected.toPhase} with stability score ${selected.stabilityScore} and ${selected.triggeringArtifacts.length} triggering artifacts.`
    : "There is currently no selected transition.";

  return (
    <section className="surface-panel">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker">Transition Inspector</p>
            <h3 className="section-title">Phase adjudication log</h3>
            <p className="mt-2 text-sm text-muted">
              Review each adjudicated transition, its threshold conditions, and the supporting evidence before accepting it into an operational narrative.
            </p>
          </div>
          <SectionAudioControl
            sectionTitle="Transition Inspector"
            worldBoundaryContext={worldBoundaryContext}
            summary="The transition inspector explains why a phase change was adjudicated and which artifacts triggered it."
            currentState={`There are currently ${transitions.length} visible adjudicated transitions, and the selected transition is ${selected ? `${selected.fromPhase} to ${selected.toPhase} at month ${selected.month}` : "none"}. ${selectedRationale}`}
            businessUse="This section helps clarify whether a transition is strong enough to support closer review, reporting, or a posture change."
            decisionGuidance="Explicit threshold logic gives oversight teams a concrete basis for challenge before the transition is carried further."
            rawContext={[
              `Visible transitions: ${transitions.length}`,
              `Selected transition: ${selected ? `${selected.fromPhase} to ${selected.toPhase} at month ${selected.month}` : "none"}`,
              `Selected rule version: ${selected?.ruleVersion ?? "none"}`,
              `Selected stability score: ${selected?.stabilityScore ?? 0}`,
              `Threshold conditions: ${selected?.proof.thresholdConditions.join(" | ") ?? "none"}`,
              `Triggering artifacts: ${selected?.triggeringArtifacts.map((artifact) => artifact.title).join(" | ") ?? "none"}`,
              `Quantitative deltas: velocity ${selected?.proof.quantitativeDeltas.velocityDelta ?? 0}, density ${selected?.proof.quantitativeDeltas.densityDelta ?? 0}, coherence ${selected?.proof.quantitativeDeltas.coherenceDelta ?? 0}, reversibility ${selected?.proof.quantitativeDeltas.reversibilityDelta ?? 0}`,
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          {transitions.map((transition) => (
            <button
              key={transition.id}
              className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                selected?.id === transition.id
                  ? "border-muted bg-shell/90"
                  : "border-edge bg-shell/50 hover:border-muted"
              }`}
              onClick={() => onSelectTransition(transition.id)}
            >
              <div className="flex items-center justify-between text-sm text-ink">
                <span>{transition.fromPhase} {"->"} {transition.toPhase}</span>
                <span className="text-muted">M{transition.month}</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                {transition.ruleVersion} | Stability {transition.stabilityScore}
              </p>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="surface-panel-subtle p-4">
            <div className="grid gap-3 text-sm text-ink md:grid-cols-2">
              <p>From phase: <span className="text-muted">{selected.fromPhase}</span></p>
              <p>To phase: <span className="text-muted">{selected.toPhase}</span></p>
              <p>Rule triggered: <span className="text-muted">{selected.ruleVersion}</span></p>
              <p>Audit hash: <span className="text-muted">{selected.proof.auditHash}</span></p>
              <p>Stability score: <span className="text-muted">{selected.stabilityScore}</span></p>
              <p>Proof ID: <span className="text-muted">{selected.proof.proofId}</span></p>
            </div>

            <div className="surface-panel mt-4 p-3">
              <p className="section-kicker">Triggering artifacts</p>
              <div className="mt-3 space-y-2 text-sm text-ink">
                {selected.triggeringArtifacts.map((artifact) => (
                  <div key={artifact.id}>
                    {artifact.label} {artifact.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-ink md:grid-cols-2">
              <p>Velocity delta: <span className="text-muted">{selected.proof.quantitativeDeltas.velocityDelta}</span></p>
              <p>Density delta: <span className="text-muted">{selected.proof.quantitativeDeltas.densityDelta}</span></p>
              <p>Coherence delta: <span className="text-muted">{selected.proof.quantitativeDeltas.coherenceDelta}</span></p>
              <p>Reversibility delta: <span className="text-muted">{selected.proof.quantitativeDeltas.reversibilityDelta}</span></p>
            </div>

            <div className="surface-panel mt-4 p-3">
              <p className="section-kicker">Threshold conditions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.proof.thresholdConditions.map((condition) => (
                  <span key={condition} className="rounded-md border border-edge/80 bg-shell/55 px-2 py-1 text-xs uppercase tracking-[0.12em] text-ink">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
