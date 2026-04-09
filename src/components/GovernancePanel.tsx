import type { WorldDefinition } from "../types";
import { SectionAudioControl } from "./SectionAudioControl";

interface GovernancePanelProps {
  world: WorldDefinition;
  worldBoundaryContext: string;
}

const safeguards = [
  "aggregate-only analysis",
  "no actor-level profiling",
  "no belief inference",
  "no truth adjudication",
  "no automated decision authority",
  "human oversight required",
];

const drpChecklist = [
  "bounded world definition present",
  "proof object audit trail present",
  "non-claims disclosed",
  "human review workflow visible",
];

export function GovernancePanel({ world, worldBoundaryContext }: GovernancePanelProps) {
  return (
    <aside className="surface-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Governance Panel</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Deployment safeguards, non-claims, and review expectations for bounded institutional use.
          </p>
        </div>
        <SectionAudioControl
          sectionTitle="Governance Panel"
          worldBoundaryContext={worldBoundaryContext}
          summary="The governance panel states what this system can and cannot do."
          currentState={`The panel is currently representing the ${world.governanceMode} deployment mode.`}
          businessUse="This section keeps non-claims, safeguards, and review expectations visible alongside the analysis."
          decisionGuidance="Clear governance reduces false certainty and keeps the console within its declared boundary."
          rawContext={[
            `Deployment mode: ${world.governanceMode}`,
            "Safeguards: aggregate-only analysis, no actor-level profiling, no belief inference, no truth adjudication, no automated decision authority, human oversight required",
            "DRP checklist: bounded world definition present, proof object audit trail present, non-claims disclosed, human review workflow visible",
          ]}
        />
      </div>
      <div className="surface-panel-subtle mt-4 p-4">
        <p className="section-kicker">Deployment mode</p>
        <p className="mt-2 text-sm text-ink">
          Deployment mode: <span className="text-muted">{world.governanceMode}</span>
        </p>
      </div>

      <div className="mt-4">
        <p className="section-kicker">Safeguards</p>
        <div className="mt-3 space-y-2">
          {safeguards.map((safeguard) => (
            <div key={safeguard} className="surface-panel-subtle px-3 py-2 text-sm text-ink">
              {safeguard}
            </div>
          ))}
        </div>
      </div>

      <div className="surface-panel-subtle mt-4 p-4">
        <p className="section-kicker">System non-claims</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          The console does not determine truth, infer beliefs, profile actors, predict behavior,
          recommend interventions, or automate decisions.
        </p>
      </div>

      <div className="surface-panel-subtle mt-4 p-4">
        <p className="section-kicker">DRP-style checklist</p>
        <div className="mt-3 space-y-2">
          {drpChecklist.map((item) => (
            <div key={item} className="flex items-center justify-between text-sm text-ink">
              <span>{item}</span>
              <span className="text-muted">active</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
