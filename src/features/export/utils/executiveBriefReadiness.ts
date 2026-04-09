import type { SimulationResult, ViewSnapshot } from "../../../types";
import { extractBriefingState } from "../../../utils/briefingArtifacts";
import { buildCanonicalSummary } from "./canonicalSummary";
import { normalizeExportData } from "./normalizeExportData";
import { renderExecutiveBrief } from "./renderArtifactContent";
import { validateExecutiveBrief } from "./validateArtifacts";

export interface ExecutiveBriefReadinessPoint {
  month: number;
  phase: string;
  validity: "Structurally Valid" | "Structurally Incomplete";
  exportable: boolean;
  qaOk: boolean;
  unmetRequirements: string[];
  withheldReason?: string;
}

export interface ExecutiveBriefReadinessWindow {
  startMonth: number;
  endMonth: number;
  startLabel: string;
  endLabel: string;
}

export interface ExecutiveBriefReadinessTimeline {
  scenarioName: string;
  scenarioId: string;
  firstValidMonth: number | null;
  firstValidLabel: string | null;
  validMonths: number[];
  readinessWindows: ExecutiveBriefReadinessWindow[];
  points: ExecutiveBriefReadinessPoint[];
}

export const formatExecutiveBriefReadinessWindow = (window: ExecutiveBriefReadinessWindow) =>
  window.startMonth === window.endMonth ? window.startLabel : `${window.startLabel}-${window.endLabel}`;

export const findExecutiveBriefReadinessWindow = (
  timeline: ExecutiveBriefReadinessTimeline,
  month: number,
) => timeline.readinessWindows.find((window) => month >= window.startMonth && month <= window.endMonth) ?? null;

const buildView = (
  scenarioId: string,
  month: number,
  overrides: Partial<ViewSnapshot> = {},
): ViewSnapshot => ({
  id: `${scenarioId}-${month}`,
  name: `Month ${month}`,
  scenarioId,
  role: "Executive",
  month,
  eventId: null,
  transitionId: null,
  compareScenarioId: null,
  ...overrides,
});

const buildExecutiveAvailability = (failedChecks: string[]) => ({
  exportable: failedChecks.length === 0,
  reason: failedChecks.length > 0 ? `Executive Brief withheld: ${Array.from(new Set(failedChecks)).join(" ")}` : undefined,
});

export const buildExecutiveBriefReadinessTimeline = ({
  scenarioName,
  scenarioId,
  result,
  viewOverrides = {},
}: {
  scenarioName: string;
  scenarioId: string;
  result: SimulationResult;
  viewOverrides?: Partial<ViewSnapshot>;
}): ExecutiveBriefReadinessTimeline => {
  const points = result.timeline.map((point) => {
    const currentView = buildView(scenarioId, point.month, viewOverrides);
    const briefingState = extractBriefingState({
      scenarioName,
      result,
      point,
      currentView,
    });
    const exportData = normalizeExportData(briefingState, currentView.name);
    const canonicalSummary = buildCanonicalSummary(exportData);
    const failedChecks = canonicalSummary.executiveBriefGate.checks.filter((check) => !check.passed).map((check) => check.failureMode);
    const executiveAvailability = buildExecutiveAvailability(failedChecks);
    const executiveQa = validateExecutiveBrief(renderExecutiveBrief(canonicalSummary));

    return {
      month: point.month,
      phase: point.phase,
      validity: briefingState.executiveBriefGate.validity,
      exportable: executiveAvailability.exportable,
      qaOk: executiveQa.ok,
      unmetRequirements: briefingState.executiveBriefGate.unmetRequirements,
      withheldReason: executiveAvailability.reason,
    };
  });

  const validMonths = points
    .filter((point) => point.exportable && point.qaOk)
    .map((point) => point.month);
  const readinessWindows: ExecutiveBriefReadinessWindow[] = [];
  for (const month of validMonths) {
    const current = readinessWindows[readinessWindows.length - 1];
    if (!current || month > current.endMonth + 1) {
      readinessWindows.push({
        startMonth: month,
        endMonth: month,
        startLabel: `M${month}`,
        endLabel: `M${month}`,
      });
      continue;
    }
    current.endMonth = month;
    current.endLabel = `M${month}`;
  }
  const firstValid = points.find((point) => point.exportable && point.qaOk) ?? null;

  return {
    scenarioName,
    scenarioId,
    firstValidMonth: firstValid?.month ?? null,
    firstValidLabel: firstValid ? `M${firstValid.month}` : null,
    validMonths,
    readinessWindows,
    points,
  };
};
