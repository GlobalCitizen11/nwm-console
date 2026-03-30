import type { SimulationResult, TransitionRecord, WorldStatePoint } from "../types";

export interface TimeProgressionCheckpoint {
  month: number;
  phase: string;
  pressureScore: number;
  pressureLabel: string;
  narrativeShift: string;
  riskEscalation: string;
  transitionNote: string;
  deltas: {
    pressure: number;
    instability: number;
    reversibility: number;
  };
}

export interface TimeProgressionModel {
  checkpoints: TimeProgressionCheckpoint[];
}

const preferredMonths = [6, 12, 18];

function clampMonth(timeline: WorldStatePoint[], month: number) {
  const maxMonth = timeline[timeline.length - 1]?.month ?? 0;
  return Math.min(month, maxMonth);
}

function uniqueMonths(timeline: WorldStatePoint[]) {
  return Array.from(
    new Set(
      preferredMonths
        .map((month) => clampMonth(timeline, month))
        .filter((month) => timeline.some((point) => point.month === month)),
    ),
  );
}

function getPointAtMonth(timeline: WorldStatePoint[], month: number) {
  return timeline.find((point) => point.month === month) ?? timeline[timeline.length - 1]!;
}

function scorePressure(point: WorldStatePoint) {
  return Math.round((point.metrics.velocity + point.metrics.density + (100 - point.metrics.reversibility)) / 3);
}

function pressureLabel(score: number) {
  if (score >= 75) {
    return "Critical";
  }
  if (score >= 55) {
    return "Elevated";
  }
  return "Managed";
}

function topDomains(point: WorldStatePoint) {
  const counts = new Map<string, number>();
  for (const event of point.visibleEvents) {
    for (const tag of event.domainTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([tag]) => tag);
}

function narrativeShift(point: WorldStatePoint) {
  const domains = topDomains(point);
  if (!domains.length) {
    return `Narrative pressure consolidated in ${point.phase}.`;
  }
  return `Narrative pressure shifted into ${domains.join(" and ")} under ${point.phase}.`;
}

function riskEscalation(point: WorldStatePoint, previousPoint: WorldStatePoint) {
  const instabilityDelta = point.halo.instability - previousPoint.halo.instability;
  const reversibilityDelta = previousPoint.metrics.reversibility - point.metrics.reversibility;

  if (instabilityDelta > 8 || reversibilityDelta > 8) {
    return "Risk escalated quickly as instability rose and reversibility fell.";
  }
  if (instabilityDelta > 0 || reversibilityDelta > 0) {
    return "Risk continued to build, but without a full break in control.";
  }
  return "Risk held roughly in place across the interval.";
}

function transitionNote(transitions: TransitionRecord[], month: number, phase: string) {
  const visible = transitions.filter((transition) => transition.month <= month);
  const latest = visible[visible.length - 1];
  if (!latest) {
    return `No formal transition had been adjudicated by M${month}.`;
  }
  if (latest.month === month) {
    return `M${month} marked a formal shift from ${latest.fromPhase} to ${latest.toPhase}.`;
  }
  return `The last formal shift before M${month} moved the system into ${phase}.`;
}

export function buildTimeProgressionModel(result: SimulationResult): TimeProgressionModel {
  const months = uniqueMonths(result.timeline);
  const checkpoints = months.map((month, index) => {
    const point = getPointAtMonth(result.timeline, month);
    const previousPoint = getPointAtMonth(result.timeline, months[Math.max(0, index - 1)] ?? 0);
    const pressure = scorePressure(point);
    const previousPressure = scorePressure(previousPoint);

    return {
      month,
      phase: point.phase,
      pressureScore: pressure,
      pressureLabel: pressureLabel(pressure),
      narrativeShift: narrativeShift(point),
      riskEscalation: riskEscalation(point, previousPoint),
      transitionNote: transitionNote(result.transitions, month, point.phase),
      deltas: {
        pressure: pressure - previousPressure,
        instability: point.halo.instability - previousPoint.halo.instability,
        reversibility: point.metrics.reversibility - previousPoint.metrics.reversibility,
      },
    };
  });

  return { checkpoints };
}
