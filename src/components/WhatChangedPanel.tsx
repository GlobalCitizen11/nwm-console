import type { SimulationResult, WorldStatePoint } from "../types";

interface WhatChangedPanelProps {
  result: SimulationResult;
  point: WorldStatePoint;
}

const describeDelta = (label: string, delta: number) => {
  if (delta === 0) {
    return `${label} held flat`;
  }
  return `${label} ${delta > 0 ? "rose" : "fell"} ${Math.abs(delta).toFixed(1)} points`;
};

export function WhatChangedPanel({ result, point }: WhatChangedPanelProps) {
  const previousPoint = result.timeline[Math.max(0, point.month - 1)] ?? point;
  const visibleTransitions = result.transitions.filter((transition) => transition.month <= point.month);
  const latestTransition = visibleTransitions[visibleTransitions.length - 1] ?? null;
  const monthTransition = result.transitions.find((transition) => transition.month === point.month) ?? null;
  const topContributors = [...point.visibleEvents]
    .sort(
      (left, right) =>
        (right.metrics.velocity + right.metrics.density + (100 - right.metrics.reversibility)) -
        (left.metrics.velocity + left.metrics.density + (100 - left.metrics.reversibility)),
    )
    .slice(0, 3);

  const velocityDelta = Number((point.metrics.velocity - previousPoint.metrics.velocity).toFixed(1));
  const densityDelta = Number((point.metrics.density - previousPoint.metrics.density).toFixed(1));
  const coherenceDelta = Number((point.metrics.coherence - previousPoint.metrics.coherence).toFixed(1));
  const reversibilityDelta = Number((point.metrics.reversibility - previousPoint.metrics.reversibility).toFixed(1));

  const summary = monthTransition
    ? `A formal transition to ${monthTransition.toPhase} occurred this month. ${describeDelta("Velocity", velocityDelta)}, ${describeDelta("density", densityDelta)}, ${describeDelta("coherence", coherenceDelta)}, and reversibility ${reversibilityDelta > 0 ? "recovered" : reversibilityDelta < 0 ? "eroded" : "held flat"} ${Math.abs(reversibilityDelta).toFixed(1)} points.`
    : `No formal transition was adjudicated this month. ${describeDelta("Velocity", velocityDelta)}, ${describeDelta("density", densityDelta)}, ${describeDelta("coherence", coherenceDelta)}, and reversibility ${reversibilityDelta > 0 ? "recovered" : reversibilityDelta < 0 ? "eroded" : "held flat"} ${Math.abs(reversibilityDelta).toFixed(1)} points relative to the prior month.`;

  return (
    <section className="surface-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="section-kicker">What Changed</p>
          <h3 className="section-title">Month-over-month structural movement</h3>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted">{summary}</p>
        </div>
        <div className="surface-panel-subtle w-full text-sm text-muted xl:max-w-[320px]">
          <p>
            Current month: <span className="text-ink">M{point.month}</span>
          </p>
          <p className="mt-2">
            Prior month: <span className="text-ink">M{previousPoint.month}</span>
          </p>
          <p className="mt-2">
            Latest visible transition:{" "}
            <span className="text-ink">
              {latestTransition ? `${latestTransition.fromPhase} -> ${latestTransition.toPhase}` : "None yet"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Metric delta summary</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-ink">
            <div className="flex items-center justify-between">
              <span>Velocity</span>
              <span className="text-muted">{velocityDelta >= 0 ? `+${velocityDelta}` : velocityDelta}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Density</span>
              <span className="text-muted">{densityDelta >= 0 ? `+${densityDelta}` : densityDelta}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Coherence</span>
              <span className="text-muted">{coherenceDelta >= 0 ? `+${coherenceDelta}` : coherenceDelta}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reversibility</span>
              <span className="text-muted">{reversibilityDelta >= 0 ? `+${reversibilityDelta}` : reversibilityDelta}</span>
            </div>
          </div>
        </div>

        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Primary contributing artifacts</p>
          <div className="mt-3 space-y-3 text-sm text-ink">
            {topContributors.map((event) => (
              <div key={event.id}>
                <p>{event.label} {event.title}</p>
                <p className="mt-1 text-muted">
                  {event.structuralEffect} | {event.sourceType} | Month {event.month}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
