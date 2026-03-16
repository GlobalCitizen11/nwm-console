import { useEffect, useState } from "react";
import type { ProofObject, SimulationResult } from "../types";
import { ProofObjectViewer } from "../components/ProofObjectViewer";
import { TransitionInspector } from "../components/TransitionInspector";

interface OversightViewProps {
  result: SimulationResult;
  currentMonth: number;
  worldBoundaryContext: string;
  selectedTransitionId: string | null;
  autoOpenProofToken?: number;
  onSelectTransition: (transitionId: string) => void;
  onProofUpdate: (proof: ProofObject) => void;
}

export function OversightView({
  result,
  currentMonth,
  worldBoundaryContext,
  selectedTransitionId,
  autoOpenProofToken = 0,
  onSelectTransition,
  onProofUpdate,
}: OversightViewProps) {
  const [proofOpen, setProofOpen] = useState(false);
  const visibleTransitions = result.transitions.filter((transition) => transition.month <= currentMonth);
  const selectedTransition =
    visibleTransitions.find((transition) => transition.id === selectedTransitionId) ??
    visibleTransitions[visibleTransitions.length - 1] ??
    null;

  useEffect(() => {
    if (!selectedTransition || autoOpenProofToken === 0) {
      return;
    }
    setProofOpen(true);
  }, [autoOpenProofToken, selectedTransition]);

  const exportProofObject = () => {
    if (!selectedTransition) {
      return;
    }
    const blob = new Blob([JSON.stringify(selectedTransition.proof, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedTransition.proof.proofId}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <TransitionInspector
        transitions={visibleTransitions}
        selectedTransitionId={selectedTransitionId}
        onSelectTransition={onSelectTransition}
        worldBoundaryContext={worldBoundaryContext}
      />
      <section className="surface-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Proof Inspection</p>
            <p className="mt-2 text-sm text-muted">
              Inspect the selected adjudication proof object in a dedicated modal viewer.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="action-button"
              onClick={() => setProofOpen(true)}
              disabled={!selectedTransition}
            >
              Open Proof Object
            </button>
            <button
              className="action-button"
              onClick={exportProofObject}
              disabled={!selectedTransition}
            >
              Export Proof JSON
            </button>
          </div>
        </div>
      </section>
      {selectedTransition ? (
        <section className="surface-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Review Workflow</p>
              <h3 className="section-title">Selected proof oversight state</h3>
            </div>
            <div className="surface-panel-subtle text-sm text-muted">
              <p>Review state: <span className="text-ink">{selectedTransition.proof.oversight.reviewState}</span></p>
              <p className="mt-2">Challenge status: <span className="text-ink">{selectedTransition.proof.challengeStatus}</span></p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <div className="surface-panel-subtle p-4 text-sm text-muted">
              <p className="section-kicker">Reviewer</p>
              <p className="mt-2 text-ink">{selectedTransition.proof.oversight.reviewer || "Unassigned"}</p>
            </div>
            <div className="surface-panel-subtle p-4 text-sm text-muted">
              <p className="section-kicker">Review timestamp</p>
              <p className="mt-2 text-ink">{selectedTransition.proof.oversight.timestamp || "Pending"}</p>
            </div>
            <div className="surface-panel-subtle p-4 text-sm text-muted">
              <p className="section-kicker">Analyst notes</p>
              <p className="mt-2 text-ink">{selectedTransition.proof.oversight.analystNotes || "No notes recorded."}</p>
            </div>
          </div>
        </section>
      ) : null}
      <section className="surface-panel">
        <p className="section-kicker">Adjudication Rules</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="surface-panel-subtle p-4 text-sm text-muted">
            Escalation Edge requires sustained velocity and density above threshold for two months.
          </div>
          <div className="surface-panel-subtle p-4 text-sm text-muted">
            Structural Reclassification requires persistent density/coherence rise and reduced reversibility.
          </div>
          <div className="surface-panel-subtle p-4 text-sm text-muted">
            Fragmented Regime requires sustained low reversibility plus elevated instability across a persistence window.
          </div>
        </div>
      </section>
      <ProofObjectViewer
        proof={selectedTransition?.proof ?? null}
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        onUpdate={onProofUpdate}
      />
    </div>
  );
}
