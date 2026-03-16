import type { SimulationResult, WorldStatePoint } from "../types";
import { ruleVersion, transitionRules } from "../rules/phaseRules";

interface StateProvenancePanelProps {
  result: SimulationResult;
  point: WorldStatePoint;
}

const metricLabels = [
  { key: "velocity", label: "Velocity" },
  { key: "density", label: "Density" },
  { key: "coherence", label: "Coherence" },
  { key: "reversibility", label: "Reversibility" },
] as const;

export function StateProvenancePanel({ result, point }: StateProvenancePanelProps) {
  const previousPoint = result.timeline[Math.max(0, point.month - 1)] ?? point;
  const topContributors = [...point.visibleEvents]
    .sort(
      (left, right) =>
        (right.metrics.velocity + right.metrics.density + (100 - right.metrics.reversibility)) -
        (left.metrics.velocity + left.metrics.density + (100 - left.metrics.reversibility)),
    )
    .slice(0, 3);

  const ruleStatuses = transitionRules.map((rule) => {
    const thresholds = [
      rule.lowerBound.velocity !== undefined
        ? point.metrics.velocity >= rule.lowerBound.velocity
          ? "met"
          : point.metrics.velocity >= rule.lowerBound.velocity - 5
            ? "near"
            : "blocked"
        : "n/a",
      rule.lowerBound.density !== undefined
        ? point.metrics.density >= rule.lowerBound.density
          ? "met"
          : point.metrics.density >= rule.lowerBound.density - 5
            ? "near"
            : "blocked"
        : "n/a",
      rule.lowerBound.coherence !== undefined
        ? point.metrics.coherence >= rule.lowerBound.coherence
          ? "met"
          : point.metrics.coherence >= rule.lowerBound.coherence - 5
            ? "near"
            : "blocked"
        : "n/a",
      rule.lowerBound.reversibilityMax !== undefined
        ? point.metrics.reversibility <= rule.lowerBound.reversibilityMax
          ? "met"
          : point.metrics.reversibility <= rule.lowerBound.reversibilityMax + 5
            ? "near"
            : "blocked"
        : "n/a",
      rule.lowerBound.instability !== undefined
        ? point.halo.instability >= rule.lowerBound.instability
          ? "met"
          : point.halo.instability >= rule.lowerBound.instability - 5
            ? "near"
            : "blocked"
        : "n/a",
    ];

    return {
      rule,
      summary:
        thresholds.includes("blocked") ? "blocked" : thresholds.includes("near") ? "near" : "met",
    };
  });

  return (
    <section className="surface-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">State Provenance</p>
          <h3 className="section-title">Current-state evidence and adjudication posture</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Inspect which artifacts are carrying the most structural weight, how the underlying metrics moved, and whether the next rule window is open, near, or blocked.
          </p>
        </div>
        <div className="surface-panel-subtle text-sm text-muted">
          <p>Month {point.month}</p>
          <p className="mt-2">Phase {point.phase}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Month-over-month deltas</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            {metricLabels.map((metric) => {
              const delta = Number((point.metrics[metric.key] - previousPoint.metrics[metric.key]).toFixed(1));
              return (
                <div key={metric.key} className="flex items-center justify-between">
                  <span>{metric.label}</span>
                  <span className="text-muted">{delta >= 0 ? `+${delta}` : `${delta}`}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Top contributing artifacts</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            {topContributors.map((event) => (
              <div key={event.id}>
                <p>{event.label} {event.title}</p>
                <p className="mt-1 text-muted">
                  {event.structuralEffect} | {event.sourceType} | {event.domainTags.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-panel-subtle mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Rule debugger</p>
            <p className="mt-2 text-sm text-muted">
              Threshold status for the next adjudication windows, expressed as met, near, or blocked.
            </p>
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted">
            Rule set {ruleVersion}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {ruleStatuses.map((entry) => (
            <div key={entry.rule.toPhase} className="surface-panel border-edge bg-panel p-3 text-sm text-ink">
              <p className="font-medium">{entry.rule.toPhase}</p>
              <p className="mt-2 text-muted">Status: {entry.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
