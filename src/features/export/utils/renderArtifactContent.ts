import type {
  BoardOnePagerContent,
  CanonicalEvidenceAnchor,
  CanonicalExportSummary,
  ExecutiveBriefContent,
  ExecutiveBriefSectionContent,
  PresentationBriefContent,
  PresentationSlideContent,
} from "../types/export";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const ensureSentence = (text: string) => {
  const normalized = clean(text).replace(/[;:]+$/g, "");
  if (!normalized) {
    return "";
  }
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
};

const toWords = (text: string) => clean(text).split(/\s+/).filter(Boolean);

const compressSentence = (text: string, maxWords: number) => {
  const normalized = ensureSentence(text);
  const words = toWords(normalized);
  if (words.length <= maxWords) {
    return normalized;
  }
  const shortened = words.slice(0, maxWords).join(" ").replace(/[,:;]+$/g, "");
  const trimmed = shortened.split(/\s+/);
  if (trimmed.length > 4) {
    const last = trimmed[trimmed.length - 1];
    if (!/[.!?]$/.test(last)) {
      trimmed.pop();
    }
  }
  return ensureSentence(trimmed.join(" "));
};

const compressFragment = (text: string, maxWords: number) => {
  const words = toWords(text).slice(0, maxWords);
  return words.join(" ");
};

const dedupe = (primary: string, fallback: string) => {
  const normalizedPrimary = clean(primary).toLowerCase();
  const normalizedFallback = clean(fallback).toLowerCase();
  return normalizedPrimary === normalizedFallback ? ensureSentence(primary) : ensureSentence(`${primary} ${fallback}`);
};

const compactAnchor = (anchor: CanonicalEvidenceAnchor): CanonicalEvidenceAnchor => ({
  ...anchor,
  shortTitle: compressFragment(anchor.shortTitle, 6),
  shortSubtitle: compressFragment(anchor.shortSubtitle, 8),
});

export const renderBoardOnePager = (summary: CanonicalExportSummary, compact = false): BoardOnePagerContent => {
  const currentStateSummary = compressSentence(summary.currentStateSummary, compact ? 45 : 55);
  const implicationsSummary = compressSentence(summary.implicationsSummary, compact ? 20 : 28);
  const monitoringSummary = compressSentence(summary.monitoringSummary, compact ? 16 : 22);

  return {
    title: summary.scenarioTitle,
    replayMonth: summary.replayMonth,
    timestamp: summary.timestamp,
    confidentialityLabel: summary.confidentialityLabel,
    boundedWorld: summary.boundedWorld,
    currentStateSummary,
    implicationsSummary,
    monitoringSummary,
    signalStack: [
      { label: "Phase", value: summary.phase },
      { label: "Density", value: summary.density },
      { label: "Momentum", value: summary.momentum },
      { label: "Reversibility", value: summary.reversibility },
      { label: "Dominant path", value: compressFragment(summary.dominantPathSummary, compact ? 12 : 18) },
      { label: "Primary pressure", value: compressFragment(summary.primaryPressureSummary, compact ? 12 : 18) },
    ],
    evidenceAnchors: summary.evidenceAnchorsCompact.slice(0, 3).map(compactAnchor),
  };
};

const executiveSection = (
  id: ExecutiveBriefSectionContent["id"],
  title: string,
  paragraphs: string[],
  insightCard: ExecutiveBriefSectionContent["insightCard"],
  bullets?: string[],
): ExecutiveBriefSectionContent => ({
  id,
  title,
  paragraphs: paragraphs.map((paragraph) => ensureSentence(paragraph)),
  bullets: bullets?.map((bullet) => ensureSentence(bullet)),
  insightCard: {
    label: insightCard.label,
    value: ensureSentence(insightCard.value),
    support: insightCard.support ? ensureSentence(insightCard.support) : undefined,
  },
});

export const renderExecutiveBrief = (summary: CanonicalExportSummary, compact = false): ExecutiveBriefContent => {
  const shorten = (text: string, words: number) => compressSentence(text, compact ? Math.max(18, words - 8) : words);

  return {
    title: summary.scenarioTitle,
    replayMonth: summary.replayMonth,
    timestamp: summary.timestamp,
    confidentialityLabel: summary.confidentialityLabel,
    boundedWorld: summary.boundedWorld,
    systemStrip: [
      { label: "Phase", value: summary.phase },
      { label: "Density", value: summary.density },
      { label: "Momentum", value: summary.momentum },
      { label: "Reversibility", value: summary.reversibility },
    ],
    sections: [
      executiveSection(
        "system-state-overview",
        "System state overview",
        [
          shorten(summary.currentStateSummary, 44),
          shorten(dedupe(summary.primaryPressureSummary, summary.structuralInterpretationSummary), 42),
        ],
        {
          label: "Executive insight",
          value: shorten(summary.primaryPressureSummary, 18),
          support: shorten(summary.monitoringSummary, 16),
        },
      ),
      executiveSection(
        "narrative-development",
        "Narrative development",
        [
          shorten(summary.narrativeDevelopment.earlySignalsSummary, 40),
          shorten(summary.narrativeDevelopment.systemicUptakeSummary, 40),
          shorten(summary.narrativeDevelopment.currentStateFormationSummary, 40),
        ],
        {
          label: "System inflection",
          value: shorten(summary.narrativeDevelopment.currentStateFormationSummary, 18),
          support: shorten(summary.primaryPressureSummary, 14),
        },
      ),
      executiveSection(
        "structural-interpretation",
        "Structural interpretation",
        [
          shorten(summary.structuralInterpretationSummary, 44),
          shorten(dedupe(summary.strategicPositioningSummary, summary.watchpointSummary), 40),
        ],
        {
          label: "Structural read",
          value: shorten(summary.structuralInterpretationSummary, 18),
          support: shorten(summary.watchpointSummary, 14),
        },
      ),
      executiveSection(
        "forward-orientation",
        "Forward orientation",
        [
          shorten(summary.forwardOrientationSummary, 42),
          shorten(summary.alternatePathSummary, 40),
        ],
        {
          label: "Path split",
          value: shorten(summary.dominantPathSummary, 16),
          support: shorten(summary.alternatePathSummary, 14),
        },
      ),
      executiveSection(
        "strategic-positioning",
        "Strategic positioning",
        [
          shorten(summary.strategicPositioningSummary, 42),
          shorten(summary.watchpointSummary, 38),
        ],
        {
          label: "Watchpoint",
          value: shorten(summary.watchpointSummary, 16),
          support: shorten(summary.monitoringSummary, 14),
        },
      ),
      executiveSection(
        "evidence-anchors",
        "Evidence anchors",
        [shorten("The current read rests on a narrow set of observable anchors that keep the interpretation grounded in visible system behavior.", 28)],
        {
          label: "Evidence concentration",
          value: shorten(summary.primaryPressureSummary, 16),
          support: shorten(summary.dominantPathSummary, 14),
        },
        summary.evidenceAnchorsCompact.slice(0, 3).map((anchor) => `${anchor.shortTitle} ${anchor.shortSubtitle}`),
      ),
    ],
  };
};

const slide = (id: string, title: string, headline: string, bullets: string[]): PresentationSlideContent => ({
  id,
  title,
  headline: compressFragment(headline, 8),
  bullets: bullets.map((bullet) => compressSentence(bullet, 16)).slice(0, 4),
});

export const renderPresentationBrief = (summary: CanonicalExportSummary, compact = false): PresentationBriefContent => {
  const short = (text: string, words: number) => compressSentence(text, compact ? Math.max(8, words - 4) : words);

  return {
    title: summary.scenarioTitle,
    replayMonth: summary.replayMonth,
    timestamp: summary.timestamp,
    confidentialityLabel: summary.confidentialityLabel,
    slides: [
      slide("title", "Situation frame", "Situation frame", [
        short(summary.currentStateSummary, 12),
        short(summary.primaryPressureSummary, 10),
      ]),
      slide("system", "System state", "System state", [
        `Phase is ${summary.phase}.`,
        `Density is ${summary.density}.`,
        `Momentum is ${summary.momentum}.`,
      ]),
      slide("takeaways", "Key takeaways", "Key takeaways", [
        short(summary.currentStateSummary, 12),
        short(summary.dominantPathSummary, 10),
        short(summary.primaryPressureSummary, 10),
      ]),
      slide("progression", "Narrative progression", "Narrative progression", [
        short(summary.narrativeDevelopment.earlySignalsSummary, 12),
        short(summary.narrativeDevelopment.systemicUptakeSummary, 12),
        short(summary.narrativeDevelopment.currentStateFormationSummary, 12),
      ]),
      slide("interpretation", "Structural read", "Structural read", [
        short(summary.structuralInterpretationSummary, 12),
        short(summary.implicationsSummary, 10),
      ]),
      slide("paths", "Scenario paths", "Scenario paths", [
        short(summary.forwardOrientationSummary, 12),
        short(summary.alternatePathSummary, 12),
      ]),
      slide("monitoring", "Risk and monitoring", "Risk and monitoring", [
        short(summary.monitoringSummary, 10),
        short(summary.watchpointSummary, 10),
        short(summary.primaryPressureSummary, 10),
      ]),
      slide("closing", "Closing synthesis", "Closing synthesis", [
        short(summary.strategicPositioningSummary, 12),
        short(summary.dominantPathSummary, 10),
      ]),
    ],
  };
};
