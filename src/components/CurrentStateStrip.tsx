import { SYSTEM_LABELS } from "../lib/systemLabels";
import type { WorldStatePoint } from "../types";

interface CurrentStateStripProps {
  scenarioLabel: string;
  compareLabel?: string | null;
  point: WorldStatePoint;
  visibleTransitionCount: number;
  simulationActive: boolean;
}

const statusTone = (instability: number) => {
  if (instability >= 70) {
    return "Elevated";
  }
  if (instability >= 50) {
    return "Moderate";
  }
  return "Contained";
};

export function CurrentStateStrip({
  scenarioLabel,
  compareLabel,
  point,
  visibleTransitionCount,
  simulationActive,
}: CurrentStateStripProps) {
  return (
    <section className="surface-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="section-kicker">Current State</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {point.phase} at Month {point.month}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {scenarioLabel}
            {compareLabel ? ` compared against ${compareLabel}.` : "."} Instability is currently{" "}
            {statusTone(point.halo.instability).toLowerCase()}, with {visibleTransitionCount} visible adjudicated
            transition{visibleTransitionCount === 1 ? "" : "s"} and{" "}
            {simulationActive ? `an active ${SYSTEM_LABELS.PROTOSTAR} scenario layered on top of the base world.` : "the base world active."}
          </p>
        </div>

        <div className="grid w-full gap-3 grid-cols-[repeat(auto-fit,minmax(150px,1fr))] xl:max-w-[44rem]">
          <div className="surface-panel-subtle">
            <p className="section-kicker">Phase</p>
            <p className="mt-2 text-base font-semibold text-ink">{point.phase}</p>
          </div>
          <div className="surface-panel-subtle">
            <p className="section-kicker">Instability</p>
            <p className="mt-2 text-base font-semibold text-ink">{point.halo.instability}</p>
          </div>
          <div className="surface-panel-subtle">
            <p className="section-kicker">Momentum</p>
            <p className="mt-2 text-base font-semibold text-ink">{point.halo.momentum}</p>
          </div>
          <div className="surface-panel-subtle">
            <p className="section-kicker">Sandbox</p>
            <p className="mt-2 text-base font-semibold text-ink">{simulationActive ? "Active" : "Base Only"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
