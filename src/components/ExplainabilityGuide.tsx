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
              World Overview: define the boundary and explain the current state in plain English.
            </div>
            <div className="surface-panel-subtle p-3 text-sm text-muted">
              Timeline + Replay: inspect sequence, persistence, and transition timing.
            </div>
            <div className="surface-panel-subtle p-3 text-sm text-muted">
              Proof Objects: audit the threshold conditions, deltas, and supporting artifacts.
            </div>
            <div className="surface-panel-subtle p-3 text-sm text-muted">
              Sandbox + Projection: explore conditional paths without implying prediction or prescription.
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
