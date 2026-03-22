import type { ExportInsight, ExportMode, ExportSemanticData, ExportTimelineItem } from "../types/export";
import { compressHeadline } from "./compressHeadline";
import { compressSupportText } from "./compressSupportText";

type ContentBudget = {
  headlineWords: number;
  supportSentences: number;
  maxChars: number;
};

const CONTENT_BUDGETS: Record<ExportMode, ContentBudget> = {
  "executive-brief": {
    headlineWords: 10,
    supportSentences: 2,
    maxChars: 220,
  },
  "board-onepager": {
    headlineWords: 8,
    supportSentences: 1,
    maxChars: 140,
  },
  "presentation-brief": {
    headlineWords: 8,
    supportSentences: 2,
    maxChars: 120,
  },
};

const cleanText = (text: string) => text.replace(/\s+/g, " ").trim();

const dedupeSupport = (headline: string, support: string) => {
  const normalizedHeadline = headline.toLowerCase().replace(/[^\w\s]/g, "");
  return support
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.toLowerCase().replace(/[^\w\s]/g, "") !== normalizedHeadline)
    .join(" ");
};

const fitText = (text: string, mode: ExportMode, maxCharsOverride?: number) => {
  const budget = CONTENT_BUDGETS[mode];
  return compressSupportText(cleanText(text), maxCharsOverride ?? budget.maxChars, budget.supportSentences);
};

const fitInsight = (insight: ExportInsight, mode: ExportMode): ExportInsight => {
  const budget = CONTENT_BUDGETS[mode];
  const source = cleanText(`${insight.headline}. ${insight.support}`);
  const headline = compressHeadline(source, budget.headlineWords);
  const rawSupport = compressSupportText(source, budget.maxChars, budget.supportSentences);
  const support = dedupeSupport(headline, rawSupport) || fitText(insight.support || source, mode, budget.maxChars - 24);
  return {
    ...insight,
    headline,
    support,
  };
};

const fitTimelineItem = (item: ExportTimelineItem, mode: ExportMode): ExportTimelineItem => {
  const budget = CONTENT_BUDGETS[mode];
  const source = cleanText(`${item.summary}. ${item.significance}`);
  return {
    ...item,
    summary: compressHeadline(source, budget.headlineWords),
    significance: compressSupportText(source, Math.min(budget.maxChars, mode === "presentation-brief" ? 100 : 150), budget.supportSentences),
  };
};

const limitForMode = <T,>(items: T[], mode: ExportMode, executiveCount: number, presentationCount: number, boardCount: number) => {
  if (mode === "executive-brief") return items.slice(0, executiveCount);
  if (mode === "presentation-brief") return items.slice(0, presentationCount);
  return items.slice(0, boardCount);
};

export const fitExportDataForMode = (data: ExportSemanticData, mode: ExportMode): ExportSemanticData => ({
  ...data,
  boundary: fitText(data.boundary, mode, mode === "board-onepager" ? 120 : 190),
  executiveLead: fitText(data.executiveLead, mode, mode === "board-onepager" ? 110 : 180),
  keyInsights: limitForMode(data.keyInsights, mode, 4, 3, 4).map((item) => fitInsight(item, mode)),
  systemStats:
    mode === "executive-brief"
      ? data.systemStats.slice(0, 5)
      : data.systemStats.slice(0, 4),
  timeline: limitForMode(data.timeline, mode, 5, 3, 3).map((item) => fitTimelineItem(item, mode)),
  implications: limitForMode(data.implications, mode, 3, 3, 2).map((item) => fitInsight(item, mode)),
  risks: limitForMode(data.risks, mode, 3, 3, 2).map((item) => fitInsight(item, mode)),
  evidenceAnchors: limitForMode(data.evidenceAnchors, mode, 6, 3, 3).map((item) => fitInsight(item, mode)),
  crossDomainEffects: limitForMode(data.crossDomainEffects, mode, 4, 3, 2).map((item) => fitInsight(item, mode)),
  containmentSignals: limitForMode(data.containmentSignals, mode, 4, 2, 2).map((item) => fitInsight(item, mode)),
  scenarioPaths: limitForMode(data.scenarioPaths, mode, 2, 2, 2).map((item) => fitInsight(item, mode)),
  monitoringPriorities: limitForMode(data.monitoringPriorities, mode, 3, 2, 2).map((item) => fitInsight(item, mode)),
  closingSynthesis: fitText(data.closingSynthesis, mode, mode === "board-onepager" ? 120 : 180),
});
