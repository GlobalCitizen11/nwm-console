import { SYSTEM_LABELS } from "../lib/systemLabels";

interface GuidedWalkthroughProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  "1. World boundary: establish the domain, geography, and time horizon before reading the signals.",
  "2. Artifact ingress: seeded artifacts enter the bounded world across the replay horizon.",
  `3. ${SYSTEM_LABELS.HALO}: signals begin to cohere into a readable environment.`,
  `4. ${SYSTEM_LABELS.PAL}: persistence and hysteresis clarify whether the state is settling or tightening.`,
  "5. Proof review: each visible transition retains evidence hashes and rationale.",
  `6. ${SYSTEM_LABELS.PROTOSTAR}: remove, delay, or weaken artifacts to examine how the path changes under different assumptions.`,
  "7. World map: clustered relationships make concentrated pressure easier to see.",
  "8. Governance posture: safeguards and use boundaries remain visible throughout the review.",
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
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Guided Walkthrough</p>
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
