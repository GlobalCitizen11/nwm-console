import type { SimulationResult, WorldStatePoint } from "../types";

interface ScenarioComparisonPanelProps {
  primaryLabel: string;
  primaryResult: SimulationResult;
  primaryPoint: WorldStatePoint;
  secondaryLabel: string;
  secondaryResult: SimulationResult;
  secondaryPoint: WorldStatePoint;
}

const metricKeys = [
  { key: "velocity", label: "Velocity" },
  { key: "density", label: "Density" },
  { key: "coherence", label: "Coherence" },
  { key: "reversibility", label: "Reversibility" },
] as const;

export function ScenarioComparisonPanel({
  primaryLabel,
  primaryResult,
  primaryPoint,
  secondaryLabel,
  secondaryResult,
  secondaryPoint,
}: ScenarioComparisonPanelProps) {
  const scorecard = [
    {
      label: "Phase divergence",
      value: primaryPoint.phase === secondaryPoint.phase ? "Aligned" : "Divergent",
      detail: `${primaryPoint.phase} vs ${secondaryPoint.phase}`,
    },
    {
      label: "Transition burden",
      value: String(primaryResult.transitions.length - secondaryResult.transitions.length),
      detail: `${primaryResult.transitions.length} vs ${secondaryResult.transitions.length}`,
    },
    {
      label: "Instability spread",
      value: String(primaryPoint.halo.instability - secondaryPoint.halo.instability),
      detail: `${primaryPoint.halo.instability} vs ${secondaryPoint.halo.instability}`,
    },
    {
      label: "Reversibility spread",
      value: String(primaryPoint.metrics.reversibility - secondaryPoint.metrics.reversibility),
      detail: `${primaryPoint.metrics.reversibility} vs ${secondaryPoint.metrics.reversibility}`,
    },
  ];

  return (
    <section className="surface-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Comparison Mode</p>
          <h3 className="section-title">Scenario-to-scenario contrast</h3>
          <p className="mt-2 text-sm text-muted">
            Compare current month structure, phase path, and transition burden across two bounded Narrative Worlds.
          </p>
        </div>
        <div className="surface-panel-subtle text-right text-sm text-muted">
          <p>{primaryLabel} vs {secondaryLabel}</p>
          <p className="mt-2">Month {primaryPoint.month}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {scorecard.map((card) => (
          <div key={card.label} className="surface-panel-subtle p-4">
            <p className="section-kicker">{card.label}</p>
            <p className="mt-2 text-lg font-semibold text-ink">{card.value}</p>
            <p className="mt-2 text-sm text-muted">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {[
          { label: primaryLabel, result: primaryResult, point: primaryPoint },
          { label: secondaryLabel, result: secondaryResult, point: secondaryPoint },
        ].map((entry) => (
          <div key={entry.label} className="surface-panel-subtle p-4">
            <p className="section-kicker">{entry.label}</p>
            <div className="mt-3 grid gap-2 text-sm text-ink md:grid-cols-2">
              <p>Phase: <span className="text-muted">{entry.point.phase}</span></p>
              <p>Transitions: <span className="text-muted">{entry.result.transitions.length}</span></p>
              <p>Visible artifacts: <span className="text-muted">{entry.point.visibleEvents.length}</span></p>
              <p>Proof objects: <span className="text-muted">{entry.result.proofObjects.length}</span></p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-ink">
              {metricKeys.map((metric) => (
                <div key={metric.key} className="flex items-center justify-between">
                  <span>{metric.label}</span>
                  <span className="text-muted">{entry.point.metrics[metric.key]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Primary phase path</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {primaryResult.timeline.map((point) => point.phase).join(" > ")}
          </p>
        </div>
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Comparison phase path</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {secondaryResult.timeline.map((point) => point.phase).join(" > ")}
          </p>
        </div>
      </div>
    </section>
  );
}
