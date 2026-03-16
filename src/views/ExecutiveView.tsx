import type { SimulationResult, WorldStatePoint } from "../types";

interface ExecutiveViewProps {
  result: SimulationResult;
  point: WorldStatePoint;
}

const cards = [
  { key: "velocity", label: "Velocity" },
  { key: "density", label: "Density" },
  { key: "coherence", label: "Coherence" },
  { key: "reversibility", label: "Reversibility" },
] as const;

export function ExecutiveView({ result, point }: ExecutiveViewProps) {
  const sourceClasses =
    result.world.sourceClasses?.join(", ") ??
    Array.from(
      new Set(result.timeline[result.timeline.length - 1]?.visibleEvents.map((event) => event.sourceType) ?? []),
    ).join(", ");

  return (
    <div className="space-y-4">
      <section className="surface-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-kicker">World Overview</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">{result.world.name}</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">{result.world.summary}</p>
          </div>
          <div className="surface-panel-subtle grid gap-2 text-sm text-ink xl:min-w-[340px]">
            <p>Domain: <span className="text-muted">{result.world.domain}</span></p>
            <p>Geography: <span className="text-muted">{result.world.geography}</span></p>
            <p>Time horizon: <span className="text-muted">{result.world.timeHorizonMonths} months</span></p>
            <p>Source classes: <span className="text-muted">{sourceClasses}</span></p>
            <p>Governance mode: <span className="text-muted">{result.world.governanceMode}</span></p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Executive readout</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              The world is currently in <span className="text-ink">{point.phase}</span>, with velocity at{" "}
              <span className="text-ink">{point.metrics.velocity}</span>, density at{" "}
              <span className="text-ink">{point.metrics.density}</span>, coherence at{" "}
              <span className="text-ink">{point.metrics.coherence}</span>, and reversibility at{" "}
              <span className="text-ink">{point.metrics.reversibility}</span>. This creates a concise top-line briefing before the user moves into replay, HALO, and provenance.
            </p>
          </div>
          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Board framing</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Use this view to brief leadership on boundary, phase, and structural posture. Deeper explanation of why the world reached this state should come from replay, provenance, proof, and sandbox surfaces below.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-6">
        <div className="metric-card">
          <p className="section-kicker">Current phase</p>
          <p className="mt-3 text-xl font-semibold text-ink">{point.phase}</p>
        </div>
        {cards.map((card) => (
          <div key={card.key} className="metric-card">
            <p className="section-kicker">{card.label}</p>
            <p className="mt-3 text-xl font-semibold text-ink">{point.metrics[card.key]}</p>
          </div>
        ))}
      </div>

      <section className="surface-panel">
        <p className="section-kicker">System Non-Claims</p>
        <div className="mt-4 grid gap-3 text-sm text-muted xl:grid-cols-2">
          <p>This console observes bounded narrative structure.</p>
          <p>It does not determine truth or infer beliefs.</p>
          <p>It does not profile actors, predict behavior, or recommend action.</p>
          <p>It provides orientation and evidence for human review.</p>
        </div>
      </section>
    </div>
  );
}
