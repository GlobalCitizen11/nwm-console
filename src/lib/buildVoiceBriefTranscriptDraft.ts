import type { CanonicalExportSummary, SignalGridItem } from "../features/export/types/export";
import type { ExecutiveEvidenceSignal } from "../types/artifactSpecs";
import type { VoiceBriefTranscriptIntelligence } from "../types/voiceBriefIntelligence";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const ensureSentence = (text: string, fallback: string) => {
  const normalized = clean(text || fallback).replace(/[.!?]+$/g, "").trim();
  return normalized ? `${normalized}.` : fallback;
};

const sentenceList = (text: string) =>
  clean(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => clean(sentence))
    .filter(Boolean);

const stripCue = (text: string) =>
  clean(text)
    .replace(/^(system state|dominant path|primary pressure|risk|risks|trigger|triggers|decision|signals?)\s*[:-]\s*/i, "")
    .trim();

const pickSentence = (sentences: string[], matcher: (sentence: string) => boolean, fallback: string) => {
  const match = sentences.find(matcher);
  return ensureSentence(stripCue(match ?? ""), fallback);
};

const pickMany = (sentences: string[], matcher: (sentence: string) => boolean, fallback: string[], maxItems: number) => {
  const matches = sentences.map(stripCue).filter((sentence) => matcher(sentence)).slice(0, maxItems);
  return (matches.length ? matches : fallback).map((item) => ensureSentence(item, item)).slice(0, maxItems);
};

const toSignalGrid = (summary: CanonicalExportSummary, transcriptSignals: string[]): SignalGridItem[] => {
  const fallbackSignals: SignalGridItem[] = [
    {
      domain: "coordination",
      state: summary.phase,
      direction: "flat",
      implication: "Coordination now clears more slowly across exposed systems.",
    },
    {
      domain: "allocation",
      state: summary.momentum,
      direction: "up",
      implication: "Allocation now follows control rather than broad efficiency.",
    },
    {
      domain: "infrastructure",
      state: summary.density,
      direction: "up",
      implication: "Infrastructure bottlenecks now carry more strategic weight.",
    },
    {
      domain: "markets",
      state: summary.reversibility,
      direction: "down",
      implication: "Market flexibility now depends on visible policy interruption.",
    },
  ];

  if (!transcriptSignals.length) {
    return fallbackSignals;
  }

  return fallbackSignals.map((item, index) => ({
    ...item,
    implication: ensureSentence(transcriptSignals[index] ?? item.implication, item.implication),
  }));
};

export function buildVoiceBriefTranscriptDraft(
  summary: CanonicalExportSummary,
  transcript: string,
): VoiceBriefTranscriptIntelligence {
  const sentences = sentenceList(transcript);
  const defaults = {
    systemState: ensureSentence(summary.currentStateSummary, "The system is operating under persistent fragmentation."),
    dominantPath: ensureSentence(summary.dominantPathSummary, "Fragmentation continues to deepen."),
    primaryPressure: ensureSentence(summary.primaryPressureSummary, "Pressure is concentrated in exposed coordination channels."),
    risks: [
      "Cross-border logistics face rising cost volatility.",
      "Coordination-dependent plans now carry execution risk.",
      "Policy friction now compresses margins in exposed networks.",
    ],
    triggers: [
      "If cross-border coordination resumes, execution risk falls.",
      "If regional controls ease, allocation pressure slows.",
      "If supply access reopens, repricing pressure eases.",
    ],
    actions: [
      "Reduce exposure before coordination failure hardens.",
      "Shift capital toward insulated infrastructure now.",
      "Protect flexibility until reversal signals appear.",
    ],
  };

  const signalSentences = pickMany(
    sentences,
    (sentence) =>
      /signal|capital|allocation|control|infrastructure|market|liquidity|supplier|supply/i.test(sentence) &&
      !/^if\b/i.test(sentence),
    [],
    4,
  );

  const riskSentences = pickMany(
    sentences,
    (sentence) => /risk|exposure|margin|volatility|control|adaptability/i.test(sentence),
    defaults.risks,
    3,
  );

  const triggerSentences = pickMany(
    sentences,
    (sentence) => /^if\b/i.test(sentence),
    defaults.triggers,
    3,
  );

  const actionSentences = pickMany(
    sentences,
    (sentence) => /^(increase|reduce|shift|hedge|protect|reallocate|prioritize|remove|lock|move)\b/i.test(sentence),
    defaults.actions,
    3,
  );

  const evidenceItems: ExecutiveEvidenceSignal[] = summary.evidenceAnchorsCompact.slice(0, 3).map((item, index) => ({
    code: item.shortTitle.match(/^M\d+/i)?.[0]?.toUpperCase() ?? `V${index + 1}`,
    signal: ensureSentence(item.shortSubtitle || item.shortTitle, "Observed evidence signal."),
    significance: ensureSentence("This anchor confirms the current operating read.", "This anchor confirms the current operating read."),
  }));

  const systemState = pickSentence(
    sentences,
    (sentence) => /system state|operating baseline|baseline|current condition/i.test(sentence),
    defaults.systemState,
  );
  const dominantPath = pickSentence(
    sentences,
    (sentence) => /dominant path|base case|continuation|fragmentation/i.test(sentence),
    defaults.dominantPath,
  );
  const primaryPressure = pickSentence(
    sentences,
    (sentence) => /primary pressure|pressure|reallocation|fragmentation|coordination/i.test(sentence),
    defaults.primaryPressure,
  );

  return {
    transcriptId: `voice-${Date.now()}`,
    capturedAt: new Date().toISOString(),
    scenarioTitle: summary.scenarioTitle,
    replayMonthLabel: summary.replayMonth,
    confidentialityLabel: summary.confidentialityLabel,
    boundedWorld: summary.boundedWorld,
    phase: summary.phase,
    density: summary.density,
    momentum: summary.momentum,
    reversibility: summary.reversibility,
    executiveHeadline: systemState,
    boardReadHeadline: dominantPath,
    boardReadSummary: systemState,
    decisionActions: actionSentences,
    dominantPath,
    primaryPressure,
    riskConcentration: riskSentences,
    inflectionContinuation: dominantPath,
    inflectionReversal: triggerSentences[0] ?? defaults.triggers[0],
    inflectionAcceleration: triggerSentences[1],
    triggers: triggerSentences,
    signalGrid: toSignalGrid(summary, signalSentences),
    evidenceSignals: evidenceItems.map((item) => ({ code: item.code, signal: item.signal })),
    systemStateTitle: "System state overview",
    systemStateSummary: systemState,
    systemStateSidebarInsight: ensureSentence("Delay now raises switching costs across exposed systems.", "Delay now raises switching costs across exposed systems."),
    narrativeProgressionTitle: "Narrative development",
    narrativeProgressionSummary: ensureSentence(sentences[1] ?? "Signals now shape behavior faster than institutions can respond.", "Signals now shape behavior faster than institutions can respond."),
    narrativeProgressionSidebarInsight: ensureSentence("Behavior now changes before coordination catches up.", "Behavior now changes before coordination catches up."),
    structuralReadTitle: "Structural interpretation",
    structuralReadSummary: primaryPressure,
    structuralReadSidebarInsight: ensureSentence("Risk now pools where coordination must clear exposure.", "Risk now pools where coordination must clear exposure."),
    forwardViewTitle: "Forward orientation",
    forwardViewSummary: dominantPath,
    forwardViewSidebarInsight: ensureSentence("Continuation remains the planning case until interruption is visible.", "Continuation remains the planning case until interruption is visible."),
    decisionPostureTitle: "Strategic positioning",
    decisionPostureSummary: ensureSentence(actionSentences[0] ?? defaults.actions[0], defaults.actions[0]),
    decisionPostureSidebarInsight: ensureSentence("Commit only when flexibility is visible.", "Commit only when flexibility is visible."),
    decisionPostureActions: actionSentences,
    evidenceBaseTitle: "Evidence anchors",
    evidenceBaseIntro: ensureSentence("Observed anchors confirm the operating read rather than speculative intent.", "Observed anchors confirm the operating read rather than speculative intent."),
    executiveEvidenceSignals: evidenceItems,
    presentationSlides: [
      {
        slideType: "title",
        title: "Voice Brief Readout",
        bullets: [systemState, dominantPath],
      },
      {
        slideType: "decision",
        title: "Immediate Actions",
        bullets: actionSentences.slice(0, 3),
      },
    ],
  };
}
