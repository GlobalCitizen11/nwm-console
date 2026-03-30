import { buildConditionalProjection } from "../engine/projectionEngine";
import type {
  DecisionSimulationAction,
  DecisionSimulationActionType,
  DecisionSimulationImpact,
  DecisionSimulationResult,
  ProjectionAssumptions,
  SimulationResult,
} from "../types";

const actions: Record<DecisionSimulationActionType, DecisionSimulationAction> = {
  "de-risk-allocation": {
    id: "de-risk-allocation",
    label: "De-risk allocation",
    description: "Reduce dependence on exposed capital commitments and soften allocation fragility.",
  },
  "accelerate-coordination": {
    id: "accelerate-coordination",
    label: "Accelerate coordination",
    description: "Push earlier alignment and coordination across exposed operating lines.",
  },
  "protect-supply-access": {
    id: "protect-supply-access",
    label: "Protect supply access",
    description: "Favor access protection and redundancy before bottlenecks harden.",
  },
  "hold-position": {
    id: "hold-position",
    label: "Hold position",
    description: "Maintain current posture and absorb conditions without intervention.",
  },
};

function assumptionAdjustments(action: DecisionSimulationActionType): Partial<ProjectionAssumptions> {
  switch (action) {
    case "de-risk-allocation":
      return {
        continuationBias: 0.68,
        artifactCadence: 0.74,
        reversibilityDecay: 1.1,
        destabilizationBias: 0.44,
      };
    case "accelerate-coordination":
      return {
        continuationBias: 0.61,
        artifactCadence: 0.7,
        reversibilityDecay: 0.85,
        destabilizationBias: 0.38,
      };
    case "protect-supply-access":
      return {
        continuationBias: 0.66,
        artifactCadence: 0.73,
        reversibilityDecay: 1.0,
        destabilizationBias: 0.41,
      };
    case "hold-position":
    default:
      return {
        continuationBias: 0.82,
        artifactCadence: 0.87,
        reversibilityDecay: 1.9,
        destabilizationBias: 0.61,
      };
  }
}

function direction(delta: number): DecisionSimulationImpact["direction"] {
  if (delta > 0) {
    return "improves";
  }
  if (delta < 0) {
    return "worsens";
  }
  return "holds";
}

function describeNarrative(action: DecisionSimulationActionType, delta: number) {
  if (action === "accelerate-coordination" && delta > 0) {
    return "Narrative pressure eases as coordinated framing starts to interrupt persistence.";
  }
  if (action === "protect-supply-access" && delta > 0) {
    return "Narrative pressure narrows as access protection reduces visible system stress.";
  }
  if (delta < 0) {
    return "Narrative pressure hardens because the current action leaves persistence largely intact.";
  }
  return "Narrative conditions hold close to the current trajectory.";
}

function describeRisk(delta: number) {
  if (delta > 0) {
    return "Risk pressure moderates relative to the base path.";
  }
  if (delta < 0) {
    return "Risk pressure increases relative to the base path.";
  }
  return "Risk pressure remains close to the current path.";
}

function describeCapitalFlow(action: DecisionSimulationActionType, delta: number) {
  if (action === "de-risk-allocation" && delta > 0) {
    return "Capital flow stabilizes as exposed commitments are repriced earlier.";
  }
  if (action === "protect-supply-access" && delta > 0) {
    return "Capital flow becomes more resilient as access protection lowers disruption costs.";
  }
  if (delta < 0) {
    return "Capital flow frictions rise as the action leaves allocation stress unresolved.";
  }
  return "Capital flow remains constrained but does not materially worsen.";
}

function capitalFlowDelta(baseInstability: number, projectedInstability: number, projectedReversibility: number) {
  return Math.round((baseInstability - projectedInstability) * 0.7 + (projectedReversibility - 40) * 0.2);
}

export function getDecisionSimulationActions(): DecisionSimulationAction[] {
  return Object.values(actions);
}

export function buildDecisionSimulation(
  result: SimulationResult,
  currentMonth: number,
  actionType: DecisionSimulationActionType,
): DecisionSimulationResult {
  const currentPoint = result.timeline[Math.min(currentMonth, result.timeline.length - 1)]!;
  const projection = buildConditionalProjection(result, currentPoint.month, assumptionAdjustments(actionType));
  const lastProjectedPoint = projection.projectedTimeline[projection.projectedTimeline.length - 1];
  const projectedRisk = lastProjectedPoint?.halo.instability ?? currentPoint.halo.instability;
  const projectedReversibility = lastProjectedPoint?.metrics.reversibility ?? currentPoint.metrics.reversibility;
  const projectedDensity = lastProjectedPoint?.metrics.density ?? currentPoint.metrics.density;

  const narrativeDelta = Math.round(currentPoint.metrics.density - projectedDensity);
  const riskDelta = Math.round(currentPoint.halo.instability - projectedRisk);
  const flowDelta = capitalFlowDelta(currentPoint.halo.instability, projectedRisk, projectedReversibility);

  return {
    action: actions[actionType],
    projectedPhase: lastProjectedPoint?.phase ?? projection.currentPhase,
    narrative: {
      summary: describeNarrative(actionType, narrativeDelta),
      delta: narrativeDelta,
      direction: direction(narrativeDelta),
    },
    risk: {
      summary: describeRisk(riskDelta),
      delta: riskDelta,
      direction: direction(riskDelta),
    },
    capitalFlow: {
      summary: describeCapitalFlow(actionType, flowDelta),
      delta: flowDelta,
      direction: direction(flowDelta),
    },
    outlookSummary: projection.outlookSummary,
    uncertaintyBand: projection.uncertaintyBand,
  };
}
