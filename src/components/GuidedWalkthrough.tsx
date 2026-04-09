import { SYSTEM_LABELS } from "../lib/systemLabels";

interface GuidedWalkthroughProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  "1. World boundary: establish the domain, geography, and time horizon so later decisions stay tied to the right environment.",
  "2. Artifact ingress: visible artifacts enter the bounded world and give the read a concrete evidence base rather than a loose storyline.",
  `3. ${SYSTEM_LABELS.HALO}: dispersed signals begin to cohere into a readable operating picture.`,
  `4. ${SYSTEM_LABELS.PAL}: persistence and hysteresis clarify whether a change is material enough to warrant escalation, review, or restraint.`,
  "5. Proof review: each visible transition retains evidence hashes and rationale so challenge and governance remain possible.",
  `6. ${SYSTEM_LABELS.PROTOSTAR}: remove, delay, or weaken artifacts to test plans and rival assumptions before action.`,
  "7. World map: clustered relationships show where pressure is concentrating and where secondary effects may spread.",
  "8. Governance posture: safeguards and use boundaries stay visible throughout the review for operators, faculty, and students alike.",
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
        <div className="mt-6 rounded-sm border border-edge/80 bg-shell/60 px-4 py-3 text-sm leading-6 text-muted">
          In practice, organizations use this flow to align around a fast-moving situation before committing resources, public positioning, or operating attention. Faculty and students can use the same structure to run a case over time, compare rival interpretations, and test what actually changes the read.
        </div>
      </div>
    </div>
  );
}
