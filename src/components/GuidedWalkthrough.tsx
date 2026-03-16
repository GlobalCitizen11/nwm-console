interface GuidedWalkthroughProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  "1. World boundary: inspect the explicit geographic and domain scope.",
  "2. Artifact ingestion: seeded artifacts appear over the replay horizon.",
  "3. State evolution: velocity, density, coherence, and reversibility accumulate structurally.",
  "4. Phase transitions: rule-based adjudication requires persistence and hysteresis.",
  "5. Proof object inspection: each transition exposes evidence hashes and rationale.",
  "6. Sandbox simulation: remove, delay, or weaken artifacts to recompute the phase path.",
  "7. World map visualization: event topology reveals influence clustering and structural pressure.",
  "8. Governance safeguards: non-claims and oversight posture remain visible throughout the interface.",
];

export function GuidedWalkthrough({ open, onClose }: GuidedWalkthroughProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-sm border border-edge bg-panel p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Guided Demo Mode</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Narrative World Modeling walkthrough</h2>
          </div>
          <button
            className="rounded-sm border border-edge px-3 py-2 text-sm text-ink hover:border-muted"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {steps.map((step) => (
            <div key={step} className="rounded-sm border border-edge/80 bg-shell/60 px-4 py-3 text-sm text-muted">
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
