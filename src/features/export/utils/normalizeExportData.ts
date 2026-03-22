import type { BriefingState } from "../../../types";
import type { ExportInsight, ExportSemanticData, ExportStat, ExportTimelineItem } from "../types/export";
import { compressHeadline } from "./compressHeadline";
import { compressSupportText } from "./compressSupportText";

const buildInsight = (id: string, text: string, tag?: string, emphasis: ExportInsight["emphasis"] = "neutral"): ExportInsight => ({
  id,
  headline: compressHeadline(text, 7),
  support: compressSupportText(text, 150),
  signalTag: tag,
  emphasis,
});

export const normalizeExportData = (state: BriefingState, currentViewName: string): ExportSemanticData => {
  const metadata = {
    scenarioName: state.scenarioName,
    boundedWorld: state.boundedWorld,
    phase: state.phase,
    asOf: state.asOf,
    generatedAt: new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    confidentiality: "Confidential | Internal use only",
    currentViewName,
  };

  const keyInsights = [
    buildInsight("key-1", state.currentCondition, "Current"),
    buildInsight("key-2", state.structuralShift, "Shift", "attention"),
    buildInsight("key-3", state.primaryPath, "Primary path"),
    buildInsight("key-4", state.pressurePoints[0] ?? state.visibilityNeeds[0] ?? "Pressure remains concentrated in the active boundary.", "Pressure"),
  ];

  const systemStats: ExportStat[] = [
    { label: "Phase", value: state.phase, status: "attention" },
    { label: "Narrative Density", value: state.narrativeDensity },
    { label: "Structural Momentum", value: state.structuralMomentum },
    { label: "Reversibility", value: state.reversibility },
    { label: "Cycle Position", value: state.cyclePosition },
  ];

  const timeline: ExportTimelineItem[] = [
    ...state.earlySignals.map((summary, index) => ({
      id: `timeline-early-${index}`,
      phase: "Early signal",
      summary: compressHeadline(summary, 8),
      significance: compressSupportText(summary, 140),
    })),
    ...state.systemicUptake.map((summary, index) => ({
      id: `timeline-systemic-${index}`,
      phase: "Systemic uptake",
      summary: compressHeadline(summary, 8),
      significance: compressSupportText(summary, 140),
    })),
    ...state.latestDevelopments.map((summary, index) => ({
      id: `timeline-latest-${index}`,
      phase: "Current condition",
      summary: compressHeadline(summary, 8),
      significance: compressSupportText(summary, 140),
    })),
  ];

  return {
    title: state.scenarioName,
    subtitle: `${state.boundedWorld} | ${state.asOf} | ${state.phase}`,
    metadata,
    boundary: state.boundaryDefinition,
    executiveLead: `${state.currentCondition} ${state.structuralShift}`,
    keyInsights,
    systemStats,
    timeline,
    implications: state.priorities.map((item, index) => buildInsight(`implication-${index}`, item, "Implication")),
    risks: [...state.sensitivities, ...state.visibilityNeeds].slice(0, 4).map((item, index) => buildInsight(`risk-${index}`, item, "Monitor", "attention")),
    evidenceAnchors: state.signalAnchors.map((item, index) => buildInsight(`evidence-${index}`, item, "Anchor")),
    crossDomainEffects: state.crossDomainEffects.map((item, index) => buildInsight(`cross-${index}`, item, "Cross-domain")),
    containmentSignals: state.stabilitySignals.map((item, index) => buildInsight(`contain-${index}`, item, "Containment", "stable")),
    scenarioPaths: [state.primaryPath, ...state.alternatePaths].map((item, index) => buildInsight(`path-${index}`, item, index === 0 ? "Primary" : "Alternate", index === 0 ? "attention" : "neutral")),
    monitoringPriorities: state.visibilityNeeds.map((item, index) => buildInsight(`monitor-${index}`, item, "Watchlist")),
    closingSynthesis: compressSupportText(`${state.currentCondition} ${state.primaryPath}`, 220),
    sourceState: state,
  };
};
