import type { CopyVariant, ExportInsight, ExportMode, ExportSemanticData, ExportTimelineItem, ModuleFitMode } from "../types/export";
import { compressHeadline } from "./compressHeadline";
import { compressSupportText } from "./compressSupportText";
import { renderSafeCopy } from "./renderSafeCopy";

type ContentBudget = {
  headlineWords: number;
  supportSentences: number;
  maxChars: number;
  supportChars: number;
};

const CONTENT_BUDGETS: Record<ExportMode, ContentBudget> = {
  "executive-brief": {
    headlineWords: 12,
    supportSentences: 2,
    maxChars: 220,
    supportChars: 160,
  },
  "board-onepager": {
    headlineWords: 8,
    supportSentences: 1,
    maxChars: 140,
    supportChars: 72,
  },
  "presentation-brief": {
    headlineWords: 8,
    supportSentences: 1,
    maxChars: 120,
    supportChars: 84,
  },
};

const cleanText = (text: string) => text.replace(/\s+/g, " ").trim();

const synthesizeExecutiveHeadline = (text: string, fitMode: ModuleFitMode, fallbackWords: number) => {
  const normalized = cleanText(text).toLowerCase();

  if (fitMode === "hero" || fitMode === "support") {
    if (normalized.includes("fragment")) return "Fragmentation Entrenches Under Sustained Pressure";
    if (normalized.includes("revers")) return "Reversibility Narrows as Density Builds";
    if (normalized.includes("pressure")) return "Pressure Concentrates in Core Structural Drivers";
    if (normalized.includes("contain")) return "Containment Holds in Narrower System Edges";
  }

  if (fitMode === "scenario") {
    if (normalized.includes("continue")) return "Current Path Continues to Favor Fragmented Development";
    if (normalized.includes("stabil")) return "Alternate Path Depends on Narrow Stabilization Signals";
  }

  if (fitMode === "implication") {
    if (normalized.includes("infrastructure")) return "Infrastructure Becomes a Strategic Constraint";
    if (normalized.includes("institution")) return "Institutional Uptake Extends the Structural Read";
  }

  if (fitMode === "monitoring") {
    if (normalized.includes("visibility")) return "Visibility Depends on a Narrow Set of Signals";
    if (normalized.includes("review")) return "Review Timing Matters More as Conditions Tighten";
  }

  if (fitMode === "evidence") {
    if (normalized.includes("disclosure")) return "Disclosure Remains a Primary Evidence Anchor";
    if (normalized.includes("policy")) return "Policy Moves Continue to Anchor the Readout";
  }

  return compressHeadline(text, fallbackWords);
};

const buildHeadlineVariants = (text: string, budget: ContentBudget): Record<CopyVariant, string> => ({
  full: compressHeadline(text, budget.headlineWords),
  medium: compressHeadline(text, Math.max(7, budget.headlineWords - 2)),
  compact: compressHeadline(text, Math.max(6, budget.headlineWords - 4)),
});

const buildBodyVariants = (text: string, budget: ContentBudget): Record<CopyVariant, string> => ({
  full: compressSupportText(text, budget.supportChars, budget.supportSentences),
  medium: compressSupportText(text, Math.min(budget.supportChars - 16, budget.supportChars), 1),
  compact: compressSupportText(text, Math.max(34, budget.supportChars - 32), 1),
});

const prepareInsight = (insight: ExportInsight, mode: ExportMode, fitMode: ModuleFitMode): ExportInsight => {
  const budget = CONTENT_BUDGETS[mode];
  const source = cleanText(`${insight.headline}. ${insight.support}`);
  const headlineVariants =
    insight.headlineVariants ??
    (mode === "executive-brief"
      ? {
          full: synthesizeExecutiveHeadline(source, fitMode, budget.headlineWords),
          medium: synthesizeExecutiveHeadline(source, fitMode, Math.max(7, budget.headlineWords - 2)),
          compact: synthesizeExecutiveHeadline(source, fitMode, Math.max(6, budget.headlineWords - 4)),
        }
      : buildHeadlineVariants(source, budget));
  const bodyVariants = insight.bodyVariants ?? buildBodyVariants(insight.support || source, budget);
  const selected = renderSafeCopy({
    mode,
    fitMode,
    item: {
      headline: insight.headline,
      support: insight.support,
      headlineVariants,
      bodyVariants,
    },
  });

  return {
    ...insight,
    headlineVariants,
    bodyVariants,
    headline: selected.headline,
    support: selected.body,
    fitMode,
  };
};

const prepareTimelineItem = (item: ExportTimelineItem, mode: ExportMode): ExportTimelineItem => {
  const budget = CONTENT_BUDGETS[mode];
  const source = cleanText(`${item.summary}. ${item.significance}`);
  const summaryVariants = item.summaryVariants ?? buildHeadlineVariants(source, budget);
  const significanceVariants = item.significanceVariants ?? buildBodyVariants(item.significance || source, budget);
  const selected = renderSafeCopy({
    mode,
    fitMode: "timeline",
    item: {
      summary: item.summary,
      significance: item.significance,
      summaryVariants,
      significanceVariants,
    },
  });

  return {
    ...item,
    summaryVariants,
    significanceVariants,
    summary: selected.headline,
    significance: selected.body,
    fitMode: "timeline",
  };
};

const fitText = (text: string, mode: ExportMode, maxChars: number) => {
  const budget = CONTENT_BUDGETS[mode];
  return compressSupportText(cleanText(text), Math.min(maxChars, budget.maxChars), budget.supportSentences);
};

const limitForMode = <T,>(items: T[], mode: ExportMode, executiveCount: number, presentationCount: number, boardCount: number) => {
  if (mode === "executive-brief") return items.slice(0, executiveCount);
  if (mode === "presentation-brief") return items.slice(0, presentationCount);
  return items.slice(0, boardCount);
};

export const fitExportDataForMode = (data: ExportSemanticData, mode: ExportMode): ExportSemanticData => ({
  ...data,
  boundary: fitText(data.boundary, mode, mode === "board-onepager" ? 108 : 180),
  executiveLead: fitText(data.executiveLead, mode, mode === "executive-brief" ? 190 : mode === "presentation-brief" ? 96 : 84),
  keyInsights: limitForMode(data.keyInsights, mode, 4, 3, 3).map((item, index) =>
    prepareInsight(item, mode, index === 0 ? "hero" : "support"),
  ),
  systemStats: mode === "executive-brief" ? data.systemStats.slice(0, 5) : data.systemStats.slice(0, 4),
  timeline: limitForMode(data.timeline, mode, 5, 3, 3).map((item) => prepareTimelineItem(item, mode)),
  implications: limitForMode(data.implications, mode, 3, 2, 1).map((item) => prepareInsight(item, mode, "implication")),
  risks: limitForMode(data.risks, mode, 3, 2, 1).map((item) => prepareInsight(item, mode, "monitoring")),
  evidenceAnchors: limitForMode(data.evidenceAnchors, mode, 6, 3, 3).map((item) => prepareInsight(item, mode, "evidence")),
  crossDomainEffects: limitForMode(data.crossDomainEffects, mode, 4, 2, 1).map((item) => prepareInsight(item, mode, "implication")),
  containmentSignals: limitForMode(data.containmentSignals, mode, 4, 2, 1).map((item) => prepareInsight(item, mode, "monitoring")),
  scenarioPaths: limitForMode(data.scenarioPaths, mode, 2, 2, 2).map((item) => prepareInsight(item, mode, "scenario")),
  monitoringPriorities: limitForMode(data.monitoringPriorities, mode, 3, 2, 1).map((item) => prepareInsight(item, mode, "monitoring")),
  closingSynthesis: fitText(data.closingSynthesis, mode, mode === "executive-brief" ? 180 : mode === "presentation-brief" ? 100 : 84),
});
