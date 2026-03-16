import type { WorldStatePoint } from "../types";
import { SectionAudioControl } from "./SectionAudioControl";

interface StateChartsProps {
  timeline: WorldStatePoint[];
  currentMonth: number;
  worldBoundaryContext: string;
}

const metrics = [
  { key: "velocity", label: "Velocity" },
  { key: "density", label: "Density" },
  { key: "coherence", label: "Coherence" },
  { key: "reversibility", label: "Reversibility" },
] as const;

const buildPath = (values: number[], width: number, height: number) =>
  values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - (value / 100) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

const metricStroke = (key: (typeof metrics)[number]["key"]) =>
  ({
    velocity: "#d5b349",
    density: "#c76c2d",
    coherence: "#d7e0ea",
    reversibility: "#645091",
  }[key]);

export function StateCharts({ timeline, currentMonth, worldBoundaryContext }: StateChartsProps) {
  const visibleTimeline = timeline.filter((point) => point.month <= currentMonth);
  const currentPoint = visibleTimeline[visibleTimeline.length - 1];
  const trendDirection = (key: keyof WorldStatePoint["metrics"]) => {
    if (visibleTimeline.length < 2) {
      return "stable";
    }
    const first = visibleTimeline[0].metrics[key];
    const last = currentPoint?.metrics[key] ?? first;
    if (last - first > 5) {
      return "rising";
    }
    if (first - last > 5) {
      return "falling";
    }
    return "stable";
  };
  const width = 320;
  const height = 110;
  const phaseSummary = visibleTimeline.map((point) => `M${point.month} ${point.phase}`).join(" | ");

  return (
    <section className="surface-panel">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker">State Evolution Charts</p>
            <h3 className="section-title">Metric trajectory</h3>
            <p className="mt-2 text-sm text-muted">
              Longitudinal metric movement for the current bounded world, with phase progression available as a structural ribbon rather than a decorative chart overlay.
            </p>
          </div>
          <SectionAudioControl
            sectionTitle="State Evolution Charts"
            worldBoundaryContext={worldBoundaryContext}
            summary="These charts show how the core structural metrics are changing over time."
            currentState={`The charts are currently showing month ${currentMonth}. The latest values are velocity ${currentPoint?.metrics.velocity ?? 0}, density ${currentPoint?.metrics.density ?? 0}, coherence ${currentPoint?.metrics.coherence ?? 0}, and reversibility ${currentPoint?.metrics.reversibility ?? 0}. Velocity is ${trendDirection("velocity")}, density is ${trendDirection("density")}, coherence is ${trendDirection("coherence")}, and reversibility is ${trendDirection("reversibility")}.`}
            businessUse="A firm can use these trends to distinguish short-term noise from persistent structural movement."
            decisionGuidance="When density is rising and reversibility is falling together, the business has a stronger basis for earlier review, contingency planning, or risk escalation."
            rawContext={[
              `Visible months: ${visibleTimeline.map((point) => point.month).join(", ")}`,
              `Velocity series: ${visibleTimeline.map((point) => point.metrics.velocity).join(", ")}`,
              `Density series: ${visibleTimeline.map((point) => point.metrics.density).join(", ")}`,
              `Coherence series: ${visibleTimeline.map((point) => point.metrics.coherence).join(", ")}`,
              `Reversibility series: ${visibleTimeline.map((point) => point.metrics.reversibility).join(", ")}`,
              `Phase progression: ${visibleTimeline.map((point) => `M${point.month} ${point.phase}`).join(" | ")}`,
            ]}
          />
        </div>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Current reading</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-muted">
            <p>Phase: <span className="text-ink">{currentPoint?.phase ?? "Unknown"}</span></p>
            <p>Month: <span className="text-ink">M{currentMonth}</span></p>
            <p>Instability: <span className="text-ink">{currentPoint?.halo.instability ?? 0}</span></p>
            <p>Momentum: <span className="text-ink">{currentPoint?.halo.momentum ?? 0}</span></p>
          </div>
        </div>
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Phase ribbon</p>
          <p className="mt-3 text-sm leading-6 text-muted">{phaseSummary}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {metrics.map((metric) => {
          const values = visibleTimeline.map((point) => point.metrics[metric.key]);
          const currentValue = values[values.length - 1] ?? 0;
          const stroke = metricStroke(metric.key);
          return (
            <div key={metric.key} className="surface-panel-subtle p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{metric.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{trendDirection(metric.key)}</p>
                </div>
                <p className="text-sm text-muted">{currentValue}</p>
              </div>
              <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full">
                {[25, 50, 75].map((tick) => (
                  <line
                    key={tick}
                    x1="0"
                    y1={height - (tick / 100) * height}
                    x2={width}
                    y2={height - (tick / 100) * height}
                    stroke="rgba(127, 144, 164, 0.16)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
                <path d={buildPath(values, width, height)} fill="none" stroke={stroke} strokeWidth="2" />
                <path
                  d={`M 0 ${height} ${buildPath(values, width, height).slice(1)} L ${width} ${height} Z`}
                  fill={`${stroke}22`}
                />
                {values.length > 0 ? (
                  <circle
                    cx={(Math.max(0, values.length - 1) / Math.max(1, values.length - 1)) * width}
                    cy={height - (currentValue / 100) * height}
                    r="3.5"
                    fill={stroke}
                  />
                ) : null}
              </svg>
              <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.14em] text-muted">
                <span>Start</span>
                <span>Current</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-panel-subtle mt-4 p-3">
        <p className="section-kicker">Phase progression</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleTimeline.map((point) => (
            <span
              key={point.month}
              className="rounded-md border border-edge px-2 py-1 text-xs uppercase tracking-[0.14em] text-ink"
              style={{ borderColor: point.halo.dominantOrientationColor }}
            >
              M{point.month} {point.phase}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
