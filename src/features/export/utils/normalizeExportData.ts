import type { BriefingState } from "../../../types";
import type { ExportInsight, ExportSemanticData, ExportStat, ExportTimelineItem } from "../types/export";
import { compressHeadline } from "./compressHeadline";
import { compressSupportText } from "./compressSupportText";

const cleanText = (text: string) => text.replace(/\s+/g, " ").trim();

const splitSentences = (text: string) =>
  cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const removeDuplicateLead = (headline: string, support: string) => {
  if (!support) {
    return "";
  }
  const normalizedHeadline = headline.toLowerCase().replace(/[^\w\s]/g, "");
  const normalizedSupport = support.toLowerCase().replace(/[^\w\s]/g, "");
  if (normalizedSupport.startsWith(normalizedHeadline)) {
    const sentences = splitSentences(support);
    return sentences.slice(1).join(" ");
  }
  return support;
};

const fallbackSupport = (text: string, headline: string) => {
  const sentences = splitSentences(text);
  const alternate = sentences.find((sentence) => !sentence.toLowerCase().includes(headline.toLowerCase()));
  return alternate ?? sentences[0] ?? "";
};

const buildInsight = (
  id: string,
  text: string,
  tag?: string,
  emphasis: ExportInsight["emphasis"] = "neutral",
): ExportInsight => {
  const cleaned = cleanText(text);
  const headline = compressHeadline(cleaned, 8);
  const support = removeDuplicateLead(headline, compressSupportText(cleaned, 170)) || compressSupportText(fallbackSupport(cleaned, headline), 130);
  return {
    id,
    headline,
    support,
    signalTag: tag,
    emphasis,
  };
};

const buildTimelineItem = (id: string, phase: string, text: string): ExportTimelineItem => {
  const cleaned = cleanText(text);
  return {
    id,
    phase,
    summary: compressHeadline(cleaned, 9),
    significance: compressSupportText(cleaned, 145),
  };
};

const uniqueInsights = (items: ExportInsight[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.headline.toLowerCase()}|${item.support.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

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

  const keyInsights = uniqueInsights([
    buildInsight("key-1", state.currentCondition, "Current State"),
    buildInsight("key-2", state.structuralShift, "Latest Shift", "attention"),
    buildInsight("key-3", state.primaryPath, "Dominant Path"),
    buildInsight(
      "key-4",
      state.pressurePoints[0] ?? state.visibilityNeeds[0] ?? "Primary pressure remains concentrated inside the active boundary.",
      "Primary Pressure Source",
      "attention",
    ),
  ]).slice(0, 4);

  const systemStats: ExportStat[] = [
    { label: "Phase", value: state.phase, status: "attention" },
    { label: "Narrative Density", value: state.narrativeDensity },
    { label: "Structural Momentum", value: state.structuralMomentum },
    { label: "Reversibility", value: state.reversibility },
    { label: "Cycle Position", value: state.cyclePosition },
  ];

  const timeline: ExportTimelineItem[] = [
    ...state.earlySignals.map((summary, index) => buildTimelineItem(`timeline-early-${index}`, "Early Signals", summary)),
    ...state.systemicUptake.map((summary, index) => buildTimelineItem(`timeline-systemic-${index}`, "Systemic Uptake", summary)),
    ...state.latestDevelopments.map((summary, index) => buildTimelineItem(`timeline-latest-${index}`, "Current State", summary)),
  ];

  return {
    title: state.scenarioName,
    subtitle: `${state.boundedWorld} | ${state.asOf} | ${state.phase}`,
    metadata,
    boundary: state.boundaryDefinition,
    executiveLead: compressSupportText(`${state.currentCondition} ${state.structuralShift}`, 220),
    keyInsights,
    systemStats,
    timeline,
    implications: uniqueInsights(state.priorities.map((item, index) => buildInsight(`implication-${index}`, item, "Strategic Implication"))),
    risks: uniqueInsights(
      [...state.sensitivities, ...state.visibilityNeeds]
        .slice(0, 4)
        .map((item, index) => buildInsight(`risk-${index}`, item, "Monitoring Priority", "attention")),
    ),
    evidenceAnchors: uniqueInsights(state.signalAnchors.map((item, index) => buildInsight(`evidence-${index}`, item, "Evidence Anchor"))),
    crossDomainEffects: uniqueInsights(
      state.crossDomainEffects.map((item, index) => buildInsight(`cross-${index}`, item, "Cross-Domain Effect")),
    ),
    containmentSignals: uniqueInsights(
      state.stabilitySignals.map((item, index) => buildInsight(`contain-${index}`, item, "Containment Signal", "stable")),
    ),
    scenarioPaths: uniqueInsights(
      [state.primaryPath, ...state.alternatePaths].map((item, index) =>
        buildInsight(
          `path-${index}`,
          item,
          index === 0 ? "Dominant Path" : "Alternate Path",
          index === 0 ? "attention" : "neutral",
        ),
      ),
    ),
    monitoringPriorities: uniqueInsights(
      state.visibilityNeeds.map((item, index) => buildInsight(`monitor-${index}`, item, "Visibility Need")),
    ),
    closingSynthesis: compressSupportText(`${state.currentCondition} ${state.primaryPath} ${state.structuralShift}`, 220),
    sourceState: state,
  };
};
