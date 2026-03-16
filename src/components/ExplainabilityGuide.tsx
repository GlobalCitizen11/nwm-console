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
      "Use this view to understand the current phase, the direction of structural pressure, and which transitions require executive attention.",
    priorities: [
      "Start with World Overview and HALO to establish the current operating state.",
      "Use the timeline replay to understand when the environment crossed a threshold.",
      "Read the conditional projection as an assumption-bound outlook, not a forecast.",
    ],
  },
  Analyst: {
    title: "Analyst investigation and scenario testing",
    intro:
      "Use this view to trace how individual artifacts accumulated structural influence and to test bounded scenario sensitivity.",
    priorities: [
      "Use charts and the world map to locate clusters of narrative pressure.",
      "Inspect artifacts for their contribution type: reinforce, destabilize, or reclassify.",
      "Use the sandbox to remove, delay, or weaken artifacts and compare the resulting phase path.",
    ],
  },
  Oversight: {
    title: "Oversight review and audit workflow",
    intro:
      "Use this view to validate that phase changes were adjudicated under explicit rules and remain reviewable by human governance processes.",
    priorities: [
      "Inspect transition records before opening the proof object.",
      "Use threshold conditions, metric deltas, and evidence hashes to challenge or validate the adjudication.",
      "Export proof JSON when a transition needs to move into review or external audit.",
    ],
  },
  Sandbox: {
    title: "Sandbox scenario construction and comparison",
    intro:
      "Use this view to build a bounded multi-artifact scenario, compare it against the base world, and inspect how the phase path changes under explicit modifications.",
    priorities: [
      "Add multiple artifact changes to represent a coherent exploratory scenario rather than a single isolated tweak.",
      "Compare base and scenario phase paths before interpreting any downstream projection output.",
      "Treat scenario results as bounded sensitivity analysis, not policy advice or predictive evidence.",
    ],
  },
};

export function ExplainabilityGuide({ role, open, onToggle }: ExplainabilityGuideProps) {
  const rolePanel = roleGuidance[role];

  return (
    <section className="surface-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="section-kicker">How To Use This Console</p>
          <h3 className="section-title">{rolePanel.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{rolePanel.intro}</p>
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
              <p className="section-kicker">Use boundaries</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
                <p>Do not treat the phase label as truth, belief inference, or intent attribution.</p>
                <p>Do not read HALO or the projection layer as a recommendation engine.</p>
                <p>Do not use sandbox outputs as policy prescriptions or predictive claims about behavior.</p>
                <p>Do use the console as a traceable orientation and audit surface for human review.</p>
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
              Sandbox + Projection: explore conditional paths without implying prediction or policy guidance.
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
