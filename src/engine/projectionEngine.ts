import { phaseColors, phaseOrder, transitionRules } from "../rules/phaseRules";
import { adjudicatePhases } from "./phaseAdjudicator";
import type {
  NarrativeEvent,
  ProjectionAssumptions,
  ProjectionConditionGap,
  ProjectionPoint,
  ProjectionResult,
  SimulationResult,
  TransitionRecord,
  WorldStatePoint,
} from "../types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const defaultAssumptions: ProjectionAssumptions = {
  horizonMonths: 6,
  continuationBias: 0.78,
  artifactCadence: 0.85,
  reversibilityDecay: 1.8,
  destabilizationBias: 0.58,
};

const averageDelta = (points: WorldStatePoint[], key: keyof WorldStatePoint["metrics"]) => {
  if (points.length < 2) {
    return 0;
  }
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += points[index].metrics[key] - points[index - 1].metrics[key];
  }
  return total / (points.length - 1);
};

const computeSyntheticHalo = (metrics: WorldStatePoint["metrics"], monthIndex: number, phase: string) => {
  const momentum = clamp(metrics.velocity * 0.51 + metrics.density * 0.3 + (100 - metrics.reversibility) * 0.19);
  const emergenceRatio = clamp((metrics.density + metrics.coherence) / Math.max(1, metrics.reversibility) * 27);
  const evidentiaryMass = clamp(38 + monthIndex * 5 + metrics.density * 0.42);
  const instability = clamp(
    metrics.velocity * 0.31 + metrics.density * 0.24 + (100 - metrics.reversibility) * 0.34,
  );

  return {
    dominantOrientationColor: phaseColors[phase] ?? phaseColors.Escalating,
    momentum: Number(momentum.toFixed(1)),
    emergenceRatio: Number(emergenceRatio.toFixed(1)),
    evidentiaryMass: Number(evidentiaryMass.toFixed(1)),
    instability: Number(instability.toFixed(1)),
  };
};

const buildSyntheticArtifact = (
  month: number,
  offset: number,
  metrics: WorldStatePoint["metrics"],
  effect: NarrativeEvent["structuralEffect"],
  phase: string,
): NarrativeEvent => ({
  id: `P${offset}`,
  month,
  label: `P${offset}`,
  title: `Conditional projection signal ${offset}`,
  description:
    "Synthetic forward signal generated under explicit continuation assumptions. This is an exploratory projection artifact, not an observed event.",
  sourceType: effect === "reclassify" ? "policy" : effect === "destabilize" ? "market" : "media",
  domainTags: ["projection", "conditional", phase.toLowerCase().replace(/\s+/g, "-")],
  structuralEffect: effect,
  metrics: {
    velocity: Number(metrics.velocity.toFixed(1)),
    density: Number(metrics.density.toFixed(1)),
    coherence: Number(metrics.coherence.toFixed(1)),
    reversibility: Number(metrics.reversibility.toFixed(1)),
  },
  phase,
  haloColor: phaseColors[phase] ?? phaseColors.Escalating,
});

const getNextRule = (phase: string) => {
  const currentIndex = phaseOrder.findIndex((candidate) => candidate === phase);
  return transitionRules.find((rule) => phaseOrder.findIndex((candidate) => candidate === rule.toPhase) === currentIndex + 1) ?? null;
};

const computeThresholdProximity = (point: WorldStatePoint): ProjectionConditionGap[] => {
  const nextRule = getNextRule(point.phase);
  if (!nextRule) {
    return [];
  }

  const proximity: ProjectionConditionGap[] = [];
  if (nextRule.lowerBound.velocity !== undefined) {
    proximity.push({
      label: "Velocity threshold",
      currentValue: point.metrics.velocity,
      targetValue: nextRule.lowerBound.velocity,
      gap: Number((nextRule.lowerBound.velocity - point.metrics.velocity).toFixed(1)),
      direction: "at_or_above",
    });
  }
  if (nextRule.lowerBound.density !== undefined) {
    proximity.push({
      label: "Density threshold",
      currentValue: point.metrics.density,
      targetValue: nextRule.lowerBound.density,
      gap: Number((nextRule.lowerBound.density - point.metrics.density).toFixed(1)),
      direction: "at_or_above",
    });
  }
  if (nextRule.lowerBound.coherence !== undefined) {
    proximity.push({
      label: "Coherence threshold",
      currentValue: point.metrics.coherence,
      targetValue: nextRule.lowerBound.coherence,
      gap: Number((nextRule.lowerBound.coherence - point.metrics.coherence).toFixed(1)),
      direction: "at_or_above",
    });
  }
  if (nextRule.lowerBound.reversibilityMax !== undefined) {
    proximity.push({
      label: "Reversibility ceiling",
      currentValue: point.metrics.reversibility,
      targetValue: nextRule.lowerBound.reversibilityMax,
      gap: Number((point.metrics.reversibility - nextRule.lowerBound.reversibilityMax).toFixed(1)),
      direction: "at_or_below",
    });
  }
  if (nextRule.lowerBound.instability !== undefined) {
    proximity.push({
      label: "Instability threshold",
      currentValue: point.halo.instability,
      targetValue: nextRule.lowerBound.instability,
      gap: Number((nextRule.lowerBound.instability - point.halo.instability).toFixed(1)),
      direction: "at_or_above",
    });
  }
  return proximity;
};

const buildOutlookSummary = (
  nextPhaseTarget: string | null,
  projectedTransitions: TransitionRecord[],
  uncertaintyBand: ProjectionResult["uncertaintyBand"],
) => {
  if (projectedTransitions.length > 0) {
    const next = projectedTransitions[0];
    return `Under the current assumptions, the bounded world would reopen adjudication toward ${next.toPhase} by month ${next.month}. Uncertainty is ${uncertaintyBand}.`;
  }
  if (nextPhaseTarget) {
    return `Under the current assumptions, the bounded world holds in its present phase while approaching ${nextPhaseTarget} conditions. Uncertainty is ${uncertaintyBand}.`;
  }
  return `Under the current assumptions, the bounded world remains in the terminal phase. Uncertainty is ${uncertaintyBand}.`;
};

export const buildConditionalProjection = (
  result: SimulationResult,
  currentMonth: number,
  assumptions: Partial<ProjectionAssumptions> = {},
): ProjectionResult => {
  const mergedAssumptions = { ...defaultAssumptions, ...assumptions };
  const historicalTimeline = result.timeline.slice(0, currentMonth + 1);
  const currentPoint = historicalTimeline[historicalTimeline.length - 1];
  const recentWindow = historicalTimeline.slice(Math.max(0, historicalTimeline.length - 4));
  const nextRule = getNextRule(currentPoint.phase);

  const avgVelocityDelta = averageDelta(recentWindow, "velocity");
  const avgDensityDelta = averageDelta(recentWindow, "density");
  const avgCoherenceDelta = averageDelta(recentWindow, "coherence");
  const avgReversibilityDelta = averageDelta(recentWindow, "reversibility");

  let previousMetrics = currentPoint.metrics;
  const projectedPhase = currentPoint.phase;
  let projectedEvents = [...currentPoint.visibleEvents];
  const futurePoints: WorldStatePoint[] = [];

  for (let offset = 1; offset <= mergedAssumptions.horizonMonths; offset += 1) {
    const month = currentPoint.month + offset;
    const densityDrift = avgDensityDelta * 0.62 + mergedAssumptions.artifactCadence * 1.1;
    const velocityDrift =
      avgVelocityDelta * 0.55 + mergedAssumptions.continuationBias * 1.2 + mergedAssumptions.destabilizationBias * 0.7;
    const coherenceDrift = avgCoherenceDelta * 0.45 + (1 - mergedAssumptions.destabilizationBias) * 0.9;
    const reversibilityDrift =
      avgReversibilityDelta * 0.3 - mergedAssumptions.reversibilityDecay - mergedAssumptions.continuationBias * 0.4;

    const nextMetrics = {
      velocity: Number(clamp(previousMetrics.velocity + velocityDrift).toFixed(1)),
      density: Number(clamp(previousMetrics.density + densityDrift).toFixed(1)),
      coherence: Number(clamp(previousMetrics.coherence + coherenceDrift).toFixed(1)),
      reversibility: Number(clamp(previousMetrics.reversibility + reversibilityDrift).toFixed(1)),
    };

    const effect: NarrativeEvent["structuralEffect"] =
      nextMetrics.reversibility <= 34 || mergedAssumptions.destabilizationBias > 0.6
        ? "destabilize"
        : nextMetrics.coherence >= 46
          ? "reclassify"
          : "reinforce";
    const syntheticArtifact = buildSyntheticArtifact(month, offset, nextMetrics, effect, projectedPhase);
    projectedEvents = [...projectedEvents, syntheticArtifact];
    const halo = computeSyntheticHalo(nextMetrics, offset, projectedPhase);

    futurePoints.push({
      month,
      phase: projectedPhase,
      metrics: nextMetrics,
      halo,
      visibleEvents: projectedEvents,
    });
    previousMetrics = nextMetrics;
  }

  const adjudicated = adjudicatePhases([...historicalTimeline, ...futurePoints]);
  const projectedTimeline: ProjectionPoint[] = adjudicated.timeline
    .filter((point) => point.month > currentPoint.month)
    .map((point, index) => ({
      month: point.month,
      phase: point.phase,
      metrics: point.metrics,
      halo: point.halo,
      syntheticArtifactId: `P${index + 1}`,
    }));
  const projectedTransitions = adjudicated.transitions.filter((transition) => transition.month > currentPoint.month);
  const uncertaintyBand: ProjectionResult["uncertaintyBand"] =
    mergedAssumptions.horizonMonths > 6 || mergedAssumptions.destabilizationBias > 0.65 ? "high" : "medium";

  return {
    assumptions: mergedAssumptions,
    currentPhase: currentPoint.phase,
    nextPhaseTarget: nextRule?.toPhase ?? null,
    thresholdProximity: computeThresholdProximity(currentPoint),
    projectedTimeline,
    projectedTransitions,
    outlookSummary: buildOutlookSummary(nextRule?.toPhase ?? null, projectedTransitions, uncertaintyBand),
    uncertaintyBand,
  };
};
