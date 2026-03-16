import type {
  NarrativeEvent,
  ProofObject,
  TransitionRecord,
  WorldStatePoint,
} from "../types";
import { phaseColors, phaseOrder, ruleVersion, transitionRules } from "../rules/phaseRules";

const hashString = (input: string) => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const passesRule = (
  point: WorldStatePoint,
  rule: (typeof transitionRules)[number],
) => {
  const { metrics, halo } = point;
  const checks = [
    rule.lowerBound.velocity === undefined || metrics.velocity >= rule.lowerBound.velocity,
    rule.lowerBound.density === undefined || metrics.density >= rule.lowerBound.density,
    rule.lowerBound.coherence === undefined || metrics.coherence >= rule.lowerBound.coherence,
    rule.lowerBound.reversibilityMax === undefined ||
      metrics.reversibility <= rule.lowerBound.reversibilityMax,
    rule.lowerBound.instability === undefined || halo.instability >= rule.lowerBound.instability,
  ];
  return checks.every(Boolean);
};

const onFloor = (
  point: WorldStatePoint,
  rule: (typeof transitionRules)[number],
) => {
  const { metrics, halo } = point;
  const checks = [
    rule.hysteresisFloor.velocity === undefined ||
      metrics.velocity >= rule.hysteresisFloor.velocity,
    rule.hysteresisFloor.density === undefined || metrics.density >= rule.hysteresisFloor.density,
    rule.hysteresisFloor.coherence === undefined ||
      metrics.coherence >= rule.hysteresisFloor.coherence,
    rule.hysteresisFloor.reversibilityMax === undefined ||
      metrics.reversibility <= rule.hysteresisFloor.reversibilityMax,
    rule.hysteresisFloor.instability === undefined ||
      halo.instability >= rule.hysteresisFloor.instability,
  ];
  return checks.every(Boolean);
};

const describeThresholds = (rule: (typeof transitionRules)[number]) => {
  const conditions: string[] = [];
  if (rule.lowerBound.velocity !== undefined) {
    conditions.push(`velocity >= ${rule.lowerBound.velocity}`);
  }
  if (rule.lowerBound.density !== undefined) {
    conditions.push(`density >= ${rule.lowerBound.density}`);
  }
  if (rule.lowerBound.coherence !== undefined) {
    conditions.push(`coherence >= ${rule.lowerBound.coherence}`);
  }
  if (rule.lowerBound.reversibilityMax !== undefined) {
    conditions.push(`reversibility <= ${rule.lowerBound.reversibilityMax}`);
  }
  if (rule.lowerBound.instability !== undefined) {
    conditions.push(`instability >= ${rule.lowerBound.instability}`);
  }
  conditions.push(`persistence window >= ${rule.minMonths} months`);
  return conditions;
};

const buildProofObject = (
  fromPoint: WorldStatePoint,
  toPoint: WorldStatePoint,
  fromPhase: string,
  toPhase: string,
  artifacts: NarrativeEvent[],
  rule: (typeof transitionRules)[number],
): ProofObject => {
  const evidenceHashes = artifacts.map((artifact) =>
    hashString(
      `${artifact.id}:${artifact.month}:${artifact.structuralEffect}:${artifact.metrics.velocity}:${artifact.metrics.density}`,
    ),
  );
  const quantitativeDeltas = {
    velocityDelta: Number((toPoint.metrics.velocity - fromPoint.metrics.velocity).toFixed(1)),
    densityDelta: Number((toPoint.metrics.density - fromPoint.metrics.density).toFixed(1)),
    coherenceDelta: Number((toPoint.metrics.coherence - fromPoint.metrics.coherence).toFixed(1)),
    reversibilityDelta: Number(
      (toPoint.metrics.reversibility - fromPoint.metrics.reversibility).toFixed(1),
    ),
  };
  const rationale = `${toPhase} adjudicated after persistent threshold satisfaction under ${ruleVersion}; single-month spikes were insufficient and the persistence window held across the replay interval.`;
  const auditSeed = `${fromPhase}:${toPhase}:${JSON.stringify(quantitativeDeltas)}:${evidenceHashes.join("|")}`;
  return {
    proofId: `proof-${toPoint.month}-${hashString(auditSeed).slice(2, 8)}`,
    transitionRef: {
      fromPhase,
      toPhase,
      ruleVersion,
    },
    evidenceHashes,
    quantitativeDeltas,
    relationshipEvidence: artifacts.map(
      (artifact) => `${artifact.label} ${artifact.title} -> ${artifact.domainTags.join(", ")}`,
    ),
    thresholdConditions: describeThresholds(rule),
    uncertaintyScore: Number(
      Math.max(0.08, 0.42 - artifacts.length * 0.03 - toPoint.halo.evidentiaryMass / 400).toFixed(2),
    ),
    timestamp: `Month ${toPoint.month}`,
    rationale,
    auditHash: hashString(auditSeed),
    challengeStatus: "unchallenged",
    oversight: {
      reviewState: "not_reviewed",
      reviewer: "Oversight queue",
      timestamp: `Month ${toPoint.month}`,
      analystNotes: "No challenge registered in demo dataset.",
    },
  };
};

export const adjudicatePhases = (
  rawTimeline: WorldStatePoint[],
): { timeline: WorldStatePoint[]; transitions: TransitionRecord[]; proofObjects: ProofObject[] } => {
  const transitions: TransitionRecord[] = [];
  const proofObjects: ProofObject[] = [];
  const counters = new Map<string, number>();

  let currentPhase: string = phaseOrder[0];
  const timeline = rawTimeline.map((point, index) => {
    let nextPhase = currentPhase;
    const currentPhaseIndex = phaseOrder.findIndex((phase) => phase === currentPhase);

    for (const rule of transitionRules) {
      const targetIndex = phaseOrder.indexOf(rule.toPhase as (typeof phaseOrder)[number]);
      if (targetIndex !== currentPhaseIndex + 1) {
        continue;
      }

      const priorCount = counters.get(rule.toPhase) ?? 0;
      const count = passesRule(point, rule) ? priorCount + 1 : onFloor(point, rule) ? priorCount : 0;
      counters.set(rule.toPhase, count);

      if (count >= rule.minMonths) {
        nextPhase = rule.toPhase;
        const sourcePoint = rawTimeline[Math.max(0, index - rule.minMonths)];
        const artifacts = point.visibleEvents.filter(
          (artifact) => artifact.month >= sourcePoint.month && artifact.month <= point.month,
        );
        const proof = buildProofObject(sourcePoint, point, currentPhase, nextPhase, artifacts, rule);
        const stabilityScore = Number(
          Math.max(0, 100 - point.halo.instability + point.metrics.coherence * 0.2).toFixed(1),
        );
        const transition: TransitionRecord = {
          id: `transition-${point.month}-${targetIndex}`,
          month: point.month,
          fromPhase: currentPhase,
          toPhase: nextPhase,
          triggeringArtifacts: artifacts,
          proof,
          ruleVersion,
          stabilityScore,
        };
        transitions.push(transition);
        proofObjects.push(proof);
        currentPhase = nextPhase;
        counters.clear();
        break;
      }
    }

    return {
      ...point,
      phase: nextPhase,
      halo: {
        ...point.halo,
        dominantOrientationColor: phaseColors[nextPhase],
      },
    };
  });

  return { timeline, transitions, proofObjects };
};
