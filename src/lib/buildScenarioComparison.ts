import type { BoardOnePagerContent } from "../features/export/types/export";

export interface ScenarioComparisonColumn {
  title: string;
  dominantPath: string;
  primaryPressure: string;
  risks: string[];
  decisions: string[];
}

export interface ScenarioComparisonDelta {
  label: string;
  state: "same" | "changed" | "added" | "removed";
  detail: string;
}

export interface ScenarioComparisonModel {
  left: ScenarioComparisonColumn;
  right: ScenarioComparisonColumn;
  deltas: {
    dominantPath: ScenarioComparisonDelta;
    primaryPressure: ScenarioComparisonDelta;
    risks: ScenarioComparisonDelta[];
    decisions: ScenarioComparisonDelta[];
  };
}

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

function compareValue(label: string, left: string, right: string): ScenarioComparisonDelta {
  const unchanged = clean(left).toLowerCase() === clean(right).toLowerCase();
  return {
    label,
    state: unchanged ? "same" : "changed",
    detail: unchanged ? "No material change." : "Decision posture shifts between scenarios.",
  };
}

function compareList(label: string, left: string[], right: string[]): ScenarioComparisonDelta[] {
  const normalizedLeft = left.map(clean);
  const normalizedRight = right.map(clean);

  const added = normalizedRight
    .filter((item) => !normalizedLeft.some((leftItem) => leftItem.toLowerCase() === item.toLowerCase()))
    .map((item) => ({
      label,
      state: "added" as const,
      detail: item,
    }));

  const removed = normalizedLeft
    .filter((item) => !normalizedRight.some((rightItem) => rightItem.toLowerCase() === item.toLowerCase()))
    .map((item) => ({
      label,
      state: "removed" as const,
      detail: item,
    }));

  if (!added.length && !removed.length) {
    return [
      {
        label,
        state: "same",
        detail: "No material change.",
      },
    ];
  }

  return [...added, ...removed];
}

export function buildScenarioComparison(
  left: BoardOnePagerContent,
  right: BoardOnePagerContent,
): ScenarioComparisonModel {
  return {
    left: {
      title: left.title,
      dominantPath: left.dominantPath,
      primaryPressure: left.primaryPressure,
      risks: left.riskConcentrations,
      decisions: left.decisionBullets,
    },
    right: {
      title: right.title,
      dominantPath: right.dominantPath,
      primaryPressure: right.primaryPressure,
      risks: right.riskConcentrations,
      decisions: right.decisionBullets,
    },
    deltas: {
      dominantPath: compareValue("Dominant path", left.dominantPath, right.dominantPath),
      primaryPressure: compareValue("Pressure", left.primaryPressure, right.primaryPressure),
      risks: compareList("Risk", left.riskConcentrations, right.riskConcentrations),
      decisions: compareList("Decision", left.decisionBullets, right.decisionBullets),
    },
  };
}
