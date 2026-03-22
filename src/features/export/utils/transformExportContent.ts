import type { CanonicalSystemTruth, ExportInsight, ExportSemanticData } from "../types/export";

const cleanText = (text: string) => text.replace(/\s+/g, " ").trim();

const rewriteInsight = (insight: ExportInsight, signalTag?: string): ExportInsight => ({
  ...insight,
  signalTag: signalTag ?? insight.signalTag,
});

export const buildCanonicalSystemTruth = (data: ExportSemanticData): CanonicalSystemTruth => ({
  currentState: cleanText(data.sourceState.currentCondition),
  trajectory: cleanText(data.sourceState.primaryPath),
  primaryPressureSource: cleanText(
    data.sourceState.pressurePoints[0] ?? data.sourceState.visibilityNeeds[0] ?? "Pressure remains concentrated inside the active boundary.",
  ),
  systemBehavior: cleanText(data.sourceState.structuralShift),
  narrativeEvolution: {
    earlySignals: data.sourceState.earlySignals.slice(0, 2).map(cleanText),
    systemicUptake: data.sourceState.systemicUptake.slice(0, 2).map(cleanText),
    currentState: data.sourceState.latestDevelopments.slice(0, 2).map(cleanText),
  },
});

export const toExecutiveBriefContent = (data: ExportSemanticData, truth: CanonicalSystemTruth): ExportSemanticData => ({
  ...data,
  executiveLead: `${truth.currentState} ${truth.systemBehavior}`,
  keyInsights: [
    rewriteInsight(data.keyInsights[0], "Current State"),
    rewriteInsight(data.keyInsights[1], "Latest Shift"),
    rewriteInsight(data.keyInsights[2], "Dominant Path"),
    rewriteInsight(data.keyInsights[3], "Primary Pressure Source"),
  ].filter(Boolean) as ExportInsight[],
});

export const toBoardOnePagerContent = (data: ExportSemanticData, truth: CanonicalSystemTruth): ExportSemanticData => ({
  ...data,
  executiveLead: truth.currentState,
  keyInsights: [
    rewriteInsight(data.keyInsights[0], "Current State"),
    rewriteInsight(data.keyInsights[2], "Dominant Path"),
    rewriteInsight(data.keyInsights[3], "Primary Pressure Source"),
  ].filter(Boolean) as ExportInsight[],
  implications: data.implications.slice(0, 1).map((item) => rewriteInsight(item, "Key Implication")),
  risks: data.risks.slice(0, 1).map((item) => rewriteInsight(item, "Monitor")),
  evidenceAnchors: data.evidenceAnchors.slice(0, 3).map((item) => rewriteInsight(item, "Evidence Anchor")),
  crossDomainEffects: data.crossDomainEffects.slice(0, 1),
  containmentSignals: data.containmentSignals.slice(0, 1),
  monitoringPriorities: data.monitoringPriorities.slice(0, 1),
});

export const toPresentationBriefContent = (data: ExportSemanticData, truth: CanonicalSystemTruth): ExportSemanticData => ({
  ...data,
  executiveLead: `${truth.currentState} ${truth.trajectory}`,
  keyInsights: [
    rewriteInsight(data.keyInsights[0], "Current State"),
    rewriteInsight(data.keyInsights[1], "Latest Shift"),
    rewriteInsight(data.keyInsights[2], "Dominant Path"),
  ].filter(Boolean) as ExportInsight[],
  timeline: [
    ...data.timeline.filter((item) => item.phase === "Early Signals").slice(0, 1),
    ...data.timeline.filter((item) => item.phase === "Systemic Uptake").slice(0, 1),
    ...data.timeline.filter((item) => item.phase === "Current State").slice(0, 1),
  ],
  implications: data.implications.slice(0, 2),
  risks: data.risks.slice(0, 2),
  evidenceAnchors: data.evidenceAnchors.slice(0, 3),
  crossDomainEffects: data.crossDomainEffects.slice(0, 2),
  monitoringPriorities: data.monitoringPriorities.slice(0, 2),
});
