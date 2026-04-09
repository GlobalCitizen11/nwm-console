import { useMemo, useState } from "react";
import type { SimulationResult } from "../types";
import { buildTimeProgressionModel } from "../lib/buildTimeProgressionModel";

function formatDelta(value: number, inverse = false) {
  const adjusted = inverse ? value * -1 : value;
  if (adjusted === 0) {
    return "Flat";
  }
  return `${adjusted > 0 ? "+" : ""}${adjusted.toFixed(2)}`;
}

export function TimeProgressionMode({ result }: { result: SimulationResult }) {
  const model = useMemo(() => buildTimeProgressionModel(result), [result]);
  const [index, setIndex] = useState(model.checkpoints.length - 1);
  const checkpoint = model.checkpoints[index];

  if (!checkpoint) {
    return null;
  }

  return (
    <section className="surface-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="section-kicker">Time Progression Mode</p>
          <h3 className="section-title">Checkpoint evolution across the bounded world</h3>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted">
            Track pressure changes, narrative shifts, and risk escalation across key checkpoint months.
          </p>
        </div>
        <div className="surface-panel-subtle w-full p-3 text-sm text-muted xl:max-w-[300px]">
          <p>
            Active checkpoint: <span className="text-ink">M{checkpoint.month}</span>
          </p>
          <p className="mt-2">
            Phase: <span className="text-ink">{checkpoint.phase}</span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <input
          className="w-full accent-phaseYellow"
          type="range"
          min={0}
          max={Math.max(0, model.checkpoints.length - 1)}
          step={1}
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
        />
        <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.18em] text-muted">
          {model.checkpoints.map((item) => (
            <span key={item.month}>M{item.month}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">State transitions</p>
          <div className="mt-3 space-y-3">
            {model.checkpoints.map((item, checkpointIndex) => (
              <div
                key={item.month}
                className={`rounded-sm border p-3 ${
                  checkpointIndex === index ? "border-phaseYellow/70 bg-phaseYellow/5" : "border-edge/80 bg-shell/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">M{item.month}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{item.phase}</p>
                </div>
                <p className="mt-2 text-sm text-muted">{item.transitionNote}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Pressure change</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold text-ink">{checkpoint.pressureLabel}</p>
              <p className="text-sm text-muted">Score {checkpoint.pressureScore.toFixed(2)}</p>
            </div>
            <p className="mt-3 text-sm text-muted">
              Delta from prior checkpoint: <span className="text-ink">{formatDelta(checkpoint.deltas.pressure)}</span>
            </p>
          </div>

          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Narrative shift</p>
            <p className="mt-3 text-sm leading-6 text-muted">{checkpoint.narrativeShift}</p>
          </div>

          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Risk escalation</p>
            <p className="mt-3 text-sm leading-6 text-muted">{checkpoint.riskEscalation}</p>
            <div className="mt-4 grid gap-2 text-sm text-ink">
              <div className="surface-panel-subtle flex items-center justify-between gap-3 px-3 py-2">
                <span>Instability</span>
                <span className="shrink-0 font-mono text-muted">{formatDelta(checkpoint.deltas.instability)}</span>
              </div>
              <div className="surface-panel-subtle flex items-center justify-between gap-3 px-3 py-2">
                <span>Reversibility loss</span>
                <span className="shrink-0 font-mono text-muted">{formatDelta(checkpoint.deltas.reversibility, true)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
