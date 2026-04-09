import type { ProofObject } from "../types";

interface ProofObjectViewerProps {
  proof: ProofObject | null;
  open?: boolean;
  onClose?: () => void;
  onUpdate?: (proof: ProofObject) => void;
}

export function ProofObjectViewer({ proof, open = true, onClose, onUpdate }: ProofObjectViewerProps) {
  if (!proof || !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 px-4 py-8">
      <section className="mx-auto max-h-[90vh] max-w-5xl overflow-auto rounded-md border border-edge bg-panel p-5 shadow-panel">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Proof Object Viewer</p>
            <h3 className="section-title">{proof.proofId}</h3>
          </div>
          {onClose ? (
            <button
              className="action-button"
              onClick={onClose}
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 text-sm text-ink xl:grid-cols-2">
        <p>Transition: <span className="text-muted">{proof.transitionRef.fromPhase} {"->"} {proof.transitionRef.toPhase}</span></p>
        <p>Rule version: <span className="text-muted">{proof.transitionRef.ruleVersion}</span></p>
        <p>Challenge status: <span className="text-muted">{proof.challengeStatus}</span></p>
        <p>Uncertainty score: <span className="text-muted">{proof.uncertaintyScore}</span></p>
        <p>Audit hash: <span className="text-muted">{proof.auditHash}</span></p>
        <p>Review state: <span className="text-muted">{proof.oversight.reviewState}</span></p>
      </div>

      <div className="surface-panel-subtle mt-4 p-4">
        <p className="section-kicker">Threshold conditions met</p>
        <div className="mt-3 space-y-2 text-sm text-ink">
          {proof.thresholdConditions.map((condition) => (
            <div key={condition}>{condition}</div>
          ))}
        </div>
      </div>

      <div className="surface-panel-subtle mt-4 p-4">
        <p className="section-kicker">Rationale</p>
        <p className="mt-3 text-sm leading-6 text-muted">{proof.rationale}</p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Evidence hashes</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            {proof.evidenceHashes.map((hash) => (
              <div key={hash}>{hash}</div>
            ))}
          </div>
        </div>
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Relationship evidence</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            {proof.relationshipEvidence.map((evidence) => (
              <div key={evidence}>{evidence}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-panel-subtle mt-4 p-4 text-sm text-ink">
        <p>Reviewer: <span className="text-muted">{proof.oversight.reviewer}</span></p>
        <p className="mt-2">Review timestamp: <span className="text-muted">{proof.oversight.timestamp}</span></p>
        <p className="mt-2">Analyst notes: <span className="text-muted">{proof.oversight.analystNotes}</span></p>
      </div>

      {onUpdate ? (
        <div className="surface-panel-subtle mt-4 p-4">
          <p className="section-kicker">Review workflow updates</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="control-stack">
              <span className="control-label">Review state</span>
              <select
                className="control-input"
                value={proof.oversight.reviewState}
                onChange={(event) =>
                  onUpdate({
                    ...proof,
                    oversight: {
                      ...proof.oversight,
                      reviewState: event.target.value as ProofObject["oversight"]["reviewState"],
                    },
                  })
                }
              >
                <option value="not_reviewed">Not reviewed</option>
                <option value="reviewed">Reviewed</option>
                <option value="challenged">Challenged</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label className="control-stack">
              <span className="control-label">Challenge status</span>
              <select
                className="control-input"
                value={proof.challengeStatus}
                onChange={(event) =>
                  onUpdate({
                    ...proof,
                    challengeStatus: event.target.value as ProofObject["challengeStatus"],
                  })
                }
              >
                <option value="unchallenged">Unchallenged</option>
                <option value="under_review">Under review</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label className="control-stack md:col-span-1">
              <span className="control-label">Reviewer</span>
              <input
                className="control-input"
                value={proof.oversight.reviewer}
                onChange={(event) =>
                  onUpdate({
                    ...proof,
                    oversight: {
                      ...proof.oversight,
                      reviewer: event.target.value,
                      timestamp: new Date().toISOString(),
                    },
                  })
                }
              />
            </label>
            <label className="control-stack md:col-span-1">
              <span className="control-label">Analyst notes</span>
              <textarea
                className="control-input min-h-[108px]"
                value={proof.oversight.analystNotes}
                onChange={(event) =>
                  onUpdate({
                    ...proof,
                    oversight: {
                      ...proof.oversight,
                      analystNotes: event.target.value,
                      timestamp: new Date().toISOString(),
                    },
                  })
                }
              />
            </label>
          </div>
        </div>
      ) : null}
    </section>
    </div>
  );
}
