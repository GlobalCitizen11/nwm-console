import type {
  HaloOrientation,
  NarrativeEvent,
  SimulationResult,
  WorldDefinition,
  WorldStatePoint,
} from "../types";
import { adjudicatePhases } from "./phaseAdjudicator";
import { phaseColors } from "../rules/phaseRules";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const effectWeight = {
  reinforce: { velocity: 0.35, density: 0.55, coherence: 1.05, irreversibility: 0.3 },
  destabilize: { velocity: 1.15, density: 0.95, coherence: 0.52, irreversibility: 1.15 },
  reclassify: { velocity: 0.82, density: 1.1, coherence: 0.92, irreversibility: 0.9 },
} as const;

const computeHalo = (
  metrics: WorldStatePoint["metrics"],
  visibleEvents: NarrativeEvent[],
  currentPhase: string,
): HaloOrientation => {
  // Demo interpretation layer. A future formal orientation engine can replace this function while preserving the UI contract.
  const evidentiaryMass = clamp(visibleEvents.length * 6 + metrics.density * 0.55, 0, 100);
  const momentum = clamp(metrics.velocity * 0.52 + metrics.density * 0.28 + (100 - metrics.reversibility) * 0.2);
  const emergenceRatio = clamp((metrics.density + metrics.coherence) / Math.max(1, metrics.reversibility) * 28);
  const instability = clamp(
    metrics.velocity * 0.34 +
      metrics.density * 0.22 +
      (100 - metrics.reversibility) * 0.34 +
      (visibleEvents.filter((event) => event.structuralEffect === "destabilize").length / Math.max(1, visibleEvents.length)) * 100 * 0.1,
  );

  return {
    dominantOrientationColor: phaseColors[currentPhase],
    momentum: Number(momentum.toFixed(1)),
    emergenceRatio: Number(emergenceRatio.toFixed(1)),
    evidentiaryMass: Number(evidentiaryMass.toFixed(1)),
    instability: Number(instability.toFixed(1)),
  };
};

const projectMetrics = (events: NarrativeEvent[], month: number) => {
  // Demo metric projection. A future simulation engine and adjudication layer can replace this accumulator with formal world-state computation.
  const visibleEvents = events.filter((event) => event.month <= month);
  const aggregates = visibleEvents.reduce(
    (accumulator, event) => {
      const age = month - event.month;
      const persistence = 1 / (1 + age * 0.16);
      const weights = effectWeight[event.structuralEffect];
      accumulator.velocity += event.metrics.velocity * persistence * weights.velocity;
      accumulator.density += event.metrics.density * persistence * weights.density;
      accumulator.coherence += event.metrics.coherence * persistence * weights.coherence;
      accumulator.irreversibility += (100 - event.metrics.reversibility) * persistence * weights.irreversibility;
      return accumulator;
    },
    { velocity: 0, density: 0, coherence: 0, irreversibility: 0 },
  );

  const count = Math.max(1, visibleEvents.length);
  return {
    visibleEvents,
    metrics: {
      velocity: Number(clamp(18 + aggregates.velocity / count + visibleEvents.length * 1.2).toFixed(1)),
      density: Number(clamp(16 + aggregates.density / count + visibleEvents.length * 1.65).toFixed(1)),
      coherence: Number(
        clamp(
          18 +
            aggregates.coherence / count +
            visibleEvents.filter((event) => event.structuralEffect !== "destabilize").length * 1.1,
        ).toFixed(1),
      ),
      reversibility: Number(
        clamp(
          88 -
            aggregates.irreversibility / count -
            visibleEvents.filter((event) => event.structuralEffect === "destabilize").length * 2.8 -
            visibleEvents.filter((event) => event.structuralEffect === "reclassify").length * 1.6,
        ).toFixed(1),
      ),
    },
  };
};

export const runWorldSimulation = (
  world: WorldDefinition,
  events: NarrativeEvent[],
): SimulationResult => {
  const rawTimeline: WorldStatePoint[] = [];

  for (let month = 0; month <= world.timeHorizonMonths; month += 1) {
    const { metrics, visibleEvents } = projectMetrics(events, month);
    rawTimeline.push({
      month,
      phase: "Escalating",
      metrics,
      halo: computeHalo(metrics, visibleEvents, "Escalating"),
      visibleEvents,
    });
  }

  const adjudicated = adjudicatePhases(rawTimeline);
  return {
    world,
    timeline: adjudicated.timeline,
    transitions: adjudicated.transitions,
    proofObjects: adjudicated.proofObjects,
  };
};
