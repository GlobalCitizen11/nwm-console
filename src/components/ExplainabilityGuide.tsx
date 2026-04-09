import { SYSTEM_DISPLAY_LABELS, SYSTEM_LABELS } from "../lib/systemLabels";

type GuideRole = "Executive" | "Analyst" | "Oversight" | "Sandbox";

interface ExplainabilityGuideProps {
  role: GuideRole;
  open: boolean;
  onToggle: () => void;
}

const roleGuidance: Record<
  GuideRole,
  {
    title: string;
    intro: string;
    priorities: string[];
    applications: string[];
    teachingUse: string;
  }
> = {
  Executive: {
    title: "Executive orientation and state briefing",
    intro:
      "This view keeps the current phase, structural pressure, and the transitions requiring attention in one place.",
    priorities: [
      `World Overview and the ${SYSTEM_LABELS.HALO} establish the current operating state.`,
      "Timeline replay shows when the environment crossed a threshold.",
      "Conditional projection should be read as an assumption-bound outlook, not a forecast.",
    ],
    applications: [
      "For strategy, policy, and leadership teams, this view helps clarify where attention, escalation, or resource allocation may need to shift.",
      "It is useful when a business needs a shared read before a board, communications, or operating review.",
    ],
    teachingUse:
      "Faculty can use this surface to frame a live case at the right level of abstraction, while students can compare how the same environment reads before and after a threshold crossing.",
  },
  Analyst: {
    title: "Analyst investigation and scenario testing",
    intro:
      "This view traces how individual artifacts accumulated structural influence and how bounded scenarios reshape the path.",
    priorities: [
      "Charts and the world map show where narrative pressure is concentrating.",
      "Artifacts can be read by contribution type: reinforce, destabilize, or reclassify.",
      "Sandbox comparisons show how removing, delaying, or weakening artifacts changes the phase path.",
    ],
    applications: [
      "For research, strategy, and market-intelligence teams, this view helps separate broad structural change from a read carried by only a few artifacts.",
      "It is useful when a business needs to defend why one interpretation is stronger than another.",
    ],
    teachingUse:
      "Faculty can use it for evidence review and hypothesis comparison, while students can trace causal structure and defend rival interpretations with visible support.",
  },
  Oversight: {
    title: "Oversight review and audit workflow",
    intro:
      "This view keeps phase changes reviewable under explicit rules and visible governance process.",
    priorities: [
      "Transition records should be inspected before the proof object is opened.",
      "Threshold conditions, metric deltas, and evidence hashes keep the adjudication challengeable.",
      "Proof JSON is available when a transition needs to move into review or external audit.",
    ],
    applications: [
      "For governance, risk, and audit teams, this view makes it easier to challenge whether a state change is actually supported before it moves into a formal record.",
      "It is useful when a business needs disciplined review rather than unexamined escalation.",
    ],
    teachingUse:
      "It gives faculty and students a practical way to study decision rights, auditability, and institutional challenge under uncertainty.",
  },
  Sandbox: {
    title: "Sandbox scenario construction and comparison",
    intro:
      "This view assembles a bounded multi-artifact scenario, compares it against the base world, and shows how the phase path changes under explicit modifications.",
    priorities: [
      "Multi-artifact changes are more informative when they form a coherent exploratory scenario rather than a single isolated tweak.",
      "Base and scenario phase paths should be compared before downstream projection output is interpreted.",
      "Scenario results remain bounded sensitivity analysis, not policy advice or predictive evidence.",
    ],
    applications: [
      "For planning, policy, and communications teams, this view helps compare how changed assumptions alter the path before commitments are made.",
      "It is useful when a business needs to test contingencies without presenting exploration as prediction.",
    ],
    teachingUse:
      "Faculty can run scenario workshops with explicit assumptions, while students can compare what truly changes the read and what leaves the structure intact.",
  },
};

export function ExplainabilityGuide({ role, open, onToggle }: ExplainabilityGuideProps) {
  const rolePanel = roleGuidance[role];

  return (
    <section className="surface-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="section-kicker">Orientation Guide</p>
          <h3 className="section-title">{rolePanel.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{rolePanel.intro}</p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{SYSTEM_DISPLAY_LABELS.threeLayerSystem}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="surface-panel-subtle px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted">
            Evidence and orientation. Not automated judgment.
          </div>
          <button
            className="action-button text-xs uppercase tracking-[0.18em]"
            onClick={onToggle}
          >
            {open ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {open ? (
        <>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="surface-panel-subtle p-4">
              <p className="section-kicker">Role priorities</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
                {rolePanel.priorities.map((priority) => (
                  <p key={priority}>{priority}</p>
                ))}
              </div>
            </div>

            <div className="surface-panel-subtle p-4">
              <p className="section-kicker">Interpretive boundaries</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
                <p>Phase labels are not truth claims, belief inference, or intent attribution.</p>
                <p>The Interpretation Layer, the Adjudication Layer, and the Simulation Engine clarify conditions; they do not prescribe action.</p>
                <p>Sandbox output remains bounded sensitivity analysis, not policy prescription or prediction.</p>
                <p>The console remains a traceable orientation and audit surface for human review.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-4">
            <div className="surface-panel-subtle p-3 text-sm text-muted">
              World Overview: define the boundary so strategy, risk, or classroom discussion begins from the same environment.
            </div>
            <div className="surface-panel-subtle p-3 text-sm text-muted">
              Timeline + Replay: inspect sequence and timing so noise can be separated from a material shift.
            </div>
            <div className="surface-panel-subtle p-3 text-sm text-muted">
              Proof Objects: audit threshold conditions and support governance, challenge, or teaching review.
            </div>
            <div className="surface-panel-subtle p-3 text-sm text-muted">
              Sandbox + Projection: compare conditional paths before planning, committee, or case discussion.
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="surface-panel-subtle p-4">
              <p className="section-kicker">Applied decision use</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
                {rolePanel.applications.map((application) => (
                  <p key={application}>{application}</p>
                ))}
              </div>
            </div>

            <div className="surface-panel-subtle p-4">
              <p className="section-kicker">Business School use</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
                <p>{rolePanel.teachingUse}</p>
                <p>
                  What remains relatively uncommon in the market is keeping interpretation, explicit state resolution, and bounded scenario testing in the same reviewable workflow.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
