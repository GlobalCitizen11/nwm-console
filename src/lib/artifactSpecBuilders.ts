import type {
  CanonicalEvidenceAnchor,
  CanonicalExportSummary,
  PresentationSlideContent,
} from "../features/export/types/export";
import {
  BoardOnePagerSpec as boardRules,
  PresentationBriefSpec as presentationRules,
  makeFieldRule,
} from "../features/export/specs/artifactSpecs";
import type {
  BoardContainedSpreadItem,
  BoardOnePagerFieldPack,
  BoardOnePagerRenderedSectionMapping,
  BoardOnePagerSpec,
  ExecutiveBriefFieldPack,
  ExecutiveBriefRenderedSectionMapping,
  ExecutiveBriefSpec,
  ExecutiveEvidenceSignal,
  FieldRule,
  EvidenceSignal,
  PresentationBriefFieldPack,
  PresentationBriefRenderedSectionMapping,
  PresentationBriefSpec,
} from "../types/artifactSpecs";
import type {
  VoiceBriefIntelligence,
  VoiceBriefTranscriptIntelligence,
} from "../types/voiceBriefIntelligence";
import {
  mapVoiceBriefToBoardOnePagerSpec,
  mapVoiceBriefToPresentationBriefSpec,
  normalizeVoiceBriefIntelligence,
} from "./voiceBriefArtifactAdapters";
import {
  buildExecutiveBriefFieldPack as buildExecutiveBriefFieldPackV2,
  buildExecutiveBriefSourceIntelligence,
  buildExecutiveBriefSpecFromSummary as buildExecutiveBriefSpecFromSummaryV2,
  mapExecutiveBriefSpecToRenderedSections as mapExecutiveBriefSpecToRenderedSectionsV2,
} from "./buildExecutiveBriefSpec";
import { getAdjudicationStatusDisplay, getPhaseResolutionReasonDisplay, SYSTEM_LABELS } from "./systemLabels";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const words = (text: string) => clean(text).split(/\s+/).filter(Boolean);
const danglingEndings = /\b(and|which|because|with|the|one|one of|of|to|for|in|on|a|an)$/i;

const stripTerminal = (text: string) => clean(text).replace(/[.!?]+$/g, "").trim();

const finalizeSentence = (text: string) => {
  const normalized = stripTerminal(text).replace(/[;:]+$/g, "").trim();
  if (!normalized) {
    return "";
  }
  const repaired = danglingEndings.test(normalized)
    ? normalized.replace(danglingEndings, "").trim()
    : normalized;
  return repaired ? `${repaired}.` : "";
};

const limitWords = (text: string, max: number) => {
  const source = words(text);
  if (source.length <= max) {
    return finalizeSentence(source.join(" "));
  }
  let trimmed = source.slice(0, max);
  while (trimmed.length > 4 && danglingEndings.test(trimmed[trimmed.length - 1] ?? "")) {
    trimmed = trimmed.slice(0, -1);
  }
  return finalizeSentence(trimmed.join(" "));
};

const compactSentence = (text: string, maxWordsCount: number) => limitWords(text, maxWordsCount);

const humanize = (text: string) =>
  clean(text)
    .replace(/-/g, " ")
    .replace(/\bbloc competition\b/gi, "bloc competition")
    .replace(/\bai\b/g, "AI")
    .replace(/\bcurrent posture is sensitive to\b/gi, "")
    .replace(/\bvisibility is needed on whether\b/gi, "")
    .replace(/\bmonitoring should stay fixed on\b/gi, "")
    .replace(/\bdecision posture should stay disciplined where\b/gi, "")
    .replace(/\bthat pressure is now shaping\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const lower = (text: string) => clean(text).toLowerCase();

const removeLead = (text: string, pattern: RegExp) => clean(text).replace(pattern, "").trim();

const titleCase = (text: string) =>
  clean(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^(AI|M\d+)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

const asPhrase = (text: string, pattern: RegExp, fallback: string) => {
  const phrase = humanize(removeLead(text, pattern)).replace(/[.]+$/g, "");
  return phrase || fallback;
};

const refinePressurePhrase = (phrase: string) => {
  const normalized = humanize(phrase);
  if (normalized === "bloc competition") {
    return "bloc competition, allocation, and infrastructure";
  }
  return normalized;
};

const refineEvidenceTitle = (text: string) =>
  titleCase(
    clean(text)
      .replace(/\bTransition To\b/gi, "")
      .replace(/\bObserved Boundary Signal\b/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
  );

const refineEvidenceSubtitle = (text: string) =>
  titleCase(
    clean(text)
      .replace(/\bObserved Boundary Signal\b/gi, "Boundary signal")
      .replace(/\bRetaliation\b/gi, "Retaliatory action")
      .replace(/\bDestabilization\b/gi, "Market destabilization")
      .replace(/\s+/g, " ")
      .trim(),
  );

function ruleConfig<T>(rule: FieldRule<T>): Omit<FieldRule<T>, "value"> {
  const { value, ...config } = rule;
  void value;
  return config;
}

const resolveVoiceBriefIntelligence = (
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
) => {
  if (!intelligence) {
    return undefined;
  }

  return "boardRead" in intelligence ? intelligence : normalizeVoiceBriefIntelligence(intelligence);
};

const makeBullet = (text: string, maxWordsCount = 14) => limitWords(text, maxWordsCount);

const slide = (id: string, title: string, headline: string, bullets: string[]): PresentationSlideContent => ({
  id,
  title,
  headline: clean(headline).split(/\s+/).slice(0, 8).join(" "),
  bullets: bullets.slice(0, 4).map((bullet) => finalizeSentence(bullet)),
});

const executivePressurePhrase = (summary: CanonicalExportSummary) =>
  refinePressurePhrase(asPhrase(summary.primaryPressureSummary, /^pressure is concentrated in\s+/i, "coordination bottlenecks"));

const compactAnchor = (anchor: CanonicalEvidenceAnchor): CanonicalEvidenceAnchor => ({
  ...anchor,
  shortTitle: refineEvidenceTitle(clean(anchor.shortTitle).replace(/[()]/g, " ").split(/\s+/).slice(0, 6).join(" ")),
  shortSubtitle: refineEvidenceSubtitle(
    clean(anchor.shortSubtitle)
      .replace(/[(),]/g, " ")
      .replace(/\bDestabilize\b/gi, "Destabilization")
      .split(/\s+/)
      .slice(0, 8)
      .join(" "),
  ),
});

const boardAnchorSignal = (anchor: CanonicalEvidenceAnchor): EvidenceSignal => {
  const compact = compactAnchor(anchor);
  const title = compact.shortTitle
    .replace(/^M\d+(?:-\d+)?\s+[—-]\s+/i, "")
    .replace(/\bReclassification\b/gi, "Structural reclassification")
    .replace(/\bStructural Structural\b/gi, "Structural")
    .replace(/\bFragmented Regime\b/gi, "Fragmented regime formalized")
    .replace(/\bSemiconductor Shock\b/gi, "Semiconductor shock repriced access");
  const subtitle = compact.shortSubtitle
    .replace(/\bBoundary Signal\b/gi, "Cross-border constraints tightened")
    .replace(/\bRetaliatory Action\b/gi, "Retaliation hardened bloc boundaries")
    .replace(/\bMarket Destabilization\b/gi, "Supply access repriced across markets");
  const combined = `${titleCase(title)} ${titleCase(subtitle)}`.trim();
  let signal = combined;
  if (/reclassification/i.test(combined)) {
    signal = "Structural reclassification tightened cross-border constraints";
  } else if (/fragmented regime/i.test(combined)) {
    signal = "Fragmented regime formalized bloc-level retaliation risk";
  } else if (/semiconductor/i.test(combined) || /supply shock/i.test(combined)) {
    signal = "Semiconductor supply shock repriced access across critical markets";
  }
  return {
    code: clean(anchor.id),
    signal,
  };
};

const executiveEvidenceSignal = (anchor: CanonicalEvidenceAnchor): ExecutiveEvidenceSignal => {
  const signal = boardAnchorSignal(anchor);
  let significance = "This anchor confirms the current operating read.";
  if (/reclassification/i.test(signal.signal)) {
    significance = "This shifted the boundary condition from friction to active cross-border constraint.";
  } else if (/fragmented regime/i.test(signal.signal)) {
    significance = "This formalized fragmentation as a governing condition rather than a temporary dispute.";
  } else if (/semiconductor|supply shock/i.test(signal.signal)) {
    significance = "This repriced supply access directly and raised downstream execution risk.";
  }
  return {
    code: signal.code,
    signal: signal.signal,
    significance: compactSentence(significance, 11),
  };
};

const boardSignalGridItems = () => [
  {
    domain: "coordination" as const,
    state: "Misaligned",
    direction: "up" as const,
    implication: compactSentence("Missed synchronization blocks decision windows.", 5),
  },
  {
    domain: "allocation" as const,
    state: "Sovereign-led",
    direction: "up" as const,
    implication: compactSentence("State control redirects capital flows.", 5),
  },
  {
    domain: "infrastructure" as const,
    state: "Constrained",
    direction: "up" as const,
    implication: compactSentence("Access friction raises execution costs.", 5),
  },
  {
    domain: "markets" as const,
    state: "Repriced",
    direction: "flat" as const,
    implication: compactSentence("Structural repricing drains confidence.", 4),
  },
];

const boardReadLines = (summary: CanonicalExportSummary) => {
  const headline = compactSentence(
    `${summary.phaseResolution.phase} is the current operating state under threshold adjudication`,
    9,
  );
  const summaryLine = compactSentence(summary.currentStateSummary, 12);
  return {
    headline: compactSentence(headline, 7),
    summary: compactSentence(summaryLine, 9),
  };
};

const boardDecisionHeadline = () => "Immediate implications";

const boardDecisionBullets = (summary: CanonicalExportSummary) =>
  [
    summary.implicationsSummary,
    summary.proofSummary,
    summary.traceabilitySummary,
  ].map((item) => compactSentence(item, 13));

const boardRiskConcentrations = (summary: CanonicalExportSummary) =>
  summary.preGcsSensitivity.reversibilityConstraints
    .slice(0, 3)
    .map((item) => compactSentence(item, 13));

const boardInflectionPaths = (summary: CanonicalExportSummary) => ({
  continuation: compactSentence(summary.preGcsSensitivity.counterweightConditions[0] ?? "Counterweight conditions remain provisional.", 13),
  reversal: compactSentence(summary.preGcsSensitivity.counterweightConditions[1] ?? "Counterweight conditions require threshold-relevant change.", 13),
  acceleration: compactSentence(summary.preGcsSensitivity.primarySensitivities[0] ?? "Sensitivity remains concentrated in the visible state.", 13),
});

const boardReadShiftSignals = (summary: CanonicalExportSummary) =>
  summary.preGcsSensitivity.nonEffectZones
    .slice(0, 2)
    .map((item) => compactSentence(item, 13));

const boardContainedVsSpreading = (summary: CanonicalExportSummary): BoardContainedSpreadItem[] => [
  {
    label: SYSTEM_LABELS.PAL,
    value: compactSentence(getAdjudicationStatusDisplay(summary.phaseResolution.adjudicationStatus), 5),
  },
  {
    label: "Proof",
    value: compactSentence(summary.proofSummary, 7),
  },
];

export function buildBoardOnePagerSpec(
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): BoardOnePagerSpec {
  const normalizedVoice = resolveVoiceBriefIntelligence(intelligence);
  if (normalizedVoice) {
    return mapVoiceBriefToBoardOnePagerSpec(normalizedVoice);
  }

  const boardRead = boardReadLines(summary);

  return {
    header: {
      scenarioTitle: makeFieldRule(summary.scenarioTitle, ruleConfig(boardRules.header.scenarioTitle)),
      replayMonthLabel: makeFieldRule(summary.replayMonth, ruleConfig(boardRules.header.replayMonthLabel)),
      confidentialityLabel: makeFieldRule(summary.confidentialityLabel, ruleConfig(boardRules.header.confidentialityLabel)),
    },
    stateBand: {
      phase: makeFieldRule(summary.phase, ruleConfig(boardRules.stateBand.phase)),
      density: makeFieldRule(summary.density, ruleConfig(boardRules.stateBand.density)),
      momentum: makeFieldRule(summary.momentum, ruleConfig(boardRules.stateBand.momentum)),
      reversibility: makeFieldRule(summary.reversibility, ruleConfig(boardRules.stateBand.reversibility)),
      stateInterpretation: makeFieldRule(
        compactSentence("Supply power shifts toward sovereign networks.", 6),
        ruleConfig(boardRules.stateBand.stateInterpretation),
      ),
    },
      boardRead: {
        headline: makeFieldRule(boardRead.headline, ruleConfig(boardRules.boardRead.headline)),
        summary: makeFieldRule(boardRead.summary, ruleConfig(boardRules.boardRead.summary)),
      },
      decisionBox: {
        title: makeFieldRule(boardDecisionHeadline(), ruleConfig(boardRules.decisionBox.title)),
        actions: makeFieldRule(boardDecisionBullets(summary), ruleConfig(boardRules.decisionBox.actions)),
      },
      dominantPath: {
        statement: makeFieldRule(
          compactSentence(summary.dominantPathSummary, 13),
          ruleConfig(boardRules.dominantPath.statement),
        ),
      },
      primaryPressure: {
        statement: makeFieldRule(
          compactSentence(summary.primaryPressureSummary, 13),
          ruleConfig(boardRules.primaryPressure.statement),
        ),
      },
      riskConcentration: {
        items: makeFieldRule(boardRiskConcentrations(summary), ruleConfig(boardRules.riskConcentration.items)),
      },
      inflectionPaths: {
        continuation: makeFieldRule(boardInflectionPaths(summary).continuation, ruleConfig(boardRules.inflectionPaths.continuation)),
        reversal: makeFieldRule(boardInflectionPaths(summary).reversal, ruleConfig(boardRules.inflectionPaths.reversal)),
        acceleration: makeFieldRule(boardInflectionPaths(summary).acceleration, ruleConfig(boardRules.inflectionPaths.acceleration!)),
      },
      triggers: {
        items: makeFieldRule(
        [
          compactSentence(summary.watchpointSummary, 13),
          ...summary.preGcsSensitivity.primarySensitivities.slice(0, 2).map((item) => compactSentence(item, 13)),
        ].slice(0, 3),
        ruleConfig(boardRules.triggers.items),
      ),
    },
    evidenceSignals: {
      items: makeFieldRule(summary.evidenceAnchorsCompact.slice(0, 3).map(boardAnchorSignal), ruleConfig(boardRules.evidenceSignals.items)),
    },
    signalGrid: {
      items: makeFieldRule(boardSignalGridItems(), ruleConfig(boardRules.signalGrid.items)),
    },
    readShiftSignals: {
      items: makeFieldRule(boardReadShiftSignals(summary), {
        required: false,
        tone: "signal",
        renderStyle: "list",
        placement: "lower-right",
        fallback: "omit",
        minItems: 2,
        maxItems: 3,
        maxWords: 8,
      }),
    },
    containedVsSpreading: {
      items: makeFieldRule(boardContainedVsSpreading(summary), {
        required: false,
        tone: "interpretive",
        renderStyle: "row",
        placement: "lower-right",
        fallback: "omit",
        minItems: 2,
        maxItems: 2,
      }),
    },
  };
}

export function buildExecutiveBriefSpec(
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): ExecutiveBriefSpec {
  return buildExecutiveBriefSpecFromSummaryV2(summary, intelligence);
}

export function buildPresentationBriefSpec(
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): PresentationBriefSpec {
  const normalizedVoice = resolveVoiceBriefIntelligence(intelligence);
  if (normalizedVoice) {
    return mapVoiceBriefToPresentationBriefSpec(normalizedVoice);
  }

  const rule = (index: number) => presentationRules.slides[index]!;

  return {
    slides: [
      {
        slideType: makeFieldRule("title", ruleConfig(rule(0).slideType)),
        title: makeFieldRule("Current State Read", ruleConfig(rule(0).title)),
        bullets: makeFieldRule(
          [
            makeBullet(summary.currentStateSummary, rule(0).bullets.maxWords),
            makeBullet(`State basis remains ${summary.stateVector.basis}.`, rule(0).bullets.maxWords),
            makeBullet(`Confidence is ${summary.stateVector.confidence.toFixed(1)} with ${getAdjudicationStatusDisplay(summary.phaseResolution.adjudicationStatus)}.`, rule(0).bullets.maxWords),
          ],
          ruleConfig(rule(0).bullets),
        ),
      },
      {
        slideType: makeFieldRule("system-state", ruleConfig(rule(1).slideType)),
        title: makeFieldRule("State Vector", ruleConfig(rule(1).title)),
        bullets: makeFieldRule(
          [
            makeBullet(`Velocity ${summary.stateVector.velocity.toFixed(1)} and density ${summary.stateVector.density.toFixed(1)} are explicit.`, rule(1).bullets.maxWords),
            makeBullet(`Coherence ${summary.stateVector.coherence.toFixed(1)} and reversibility ${summary.stateVector.reversibility.toFixed(1)} remain explicit.`, rule(1).bullets.maxWords),
            makeBullet(`The current phase is ${summary.phaseResolution.phase}.`, rule(1).bullets.maxWords),
          ],
          ruleConfig(rule(1).bullets),
        ),
      },
      {
        slideType: makeFieldRule("key-risk", ruleConfig(rule(2).slideType)),
        title: makeFieldRule("Adjudication Status", ruleConfig(rule(2).title)),
        bullets: makeFieldRule(
          [
            makeBullet(`${SYSTEM_LABELS.PAL} is labeled ${getAdjudicationStatusDisplay(summary.phaseResolution.adjudicationStatus)}.`, rule(2).bullets.maxWords),
            makeBullet(getPhaseResolutionReasonDisplay(summary.phaseResolution.rationale), rule(2).bullets.maxWords),
            makeBullet(summary.phaseResolution.thresholdConditions[0] ?? "Threshold conditions remain visible.", rule(2).bullets.maxWords),
          ],
          ruleConfig(rule(2).bullets),
        ),
      },
      {
        slideType: makeFieldRule("pressure", ruleConfig(rule(3).slideType)),
        title: makeFieldRule("Artifact Traceability", ruleConfig(rule(3).title)),
        bullets: makeFieldRule(
          [
            makeBullet(summary.traceabilitySummary, rule(3).bullets.maxWords),
            makeBullet(summary.artifactSetSummary, rule(3).bullets.maxWords),
            makeBullet(summary.artifactStateMapping[0]?.stateEffect ?? "Artifact-to-state mapping remains explicit.", rule(3).bullets.maxWords),
          ],
          ruleConfig(rule(3).bullets),
        ),
      },
      {
        slideType: makeFieldRule("path", ruleConfig(rule(4).slideType)),
        title: makeFieldRule("Temporal Spine", ruleConfig(rule(4).title)),
        bullets: makeFieldRule(
          [
            ...summary.temporalSpine.slice(0, 3).map((entry) => makeBullet(`${entry.label}: ${entry.summary}`, rule(4).bullets.maxWords)),
          ],
          ruleConfig(rule(4).bullets),
        ),
      },
      {
        slideType: makeFieldRule("decision", ruleConfig(rule(5).slideType)),
        title: makeFieldRule("Proof Scaffold", ruleConfig(rule(5).title)),
        bullets: makeFieldRule(
          [
            makeBullet(summary.proofSummary, rule(5).bullets.maxWords),
            makeBullet(`Visible proof scaffolds: ${summary.proofScaffolds.length}.`, rule(5).bullets.maxWords),
            makeBullet(summary.proofScaffolds[0] ? `Proof scaffold ${summary.proofScaffolds[0].linkedTransition} remains audit-visible.` : "No linked transition is yet visible.", rule(5).bullets.maxWords),
          ],
          ruleConfig(rule(5).bullets),
        ),
      },
      {
        slideType: makeFieldRule("triggers", ruleConfig(rule(6).slideType)),
        title: makeFieldRule("Pre-GCS Sensitivity", ruleConfig(rule(6).title)),
        bullets: makeFieldRule(
          [
            makeBullet(summary.preGcsSensitivity.primarySensitivities[0] ?? "Primary sensitivities remain explicit.", rule(6).bullets.maxWords),
            makeBullet(summary.preGcsSensitivity.counterweightConditions[0] ?? "Counterweight conditions remain explicit.", rule(6).bullets.maxWords),
            makeBullet(summary.preGcsSensitivity.reversibilityConstraints[0] ?? "Reversibility constraints remain explicit.", rule(6).bullets.maxWords),
          ],
          ruleConfig(rule(6).bullets),
        ),
      },
      {
        slideType: makeFieldRule("evidence", ruleConfig(rule(7).slideType)),
        title: makeFieldRule("What To Watch", ruleConfig(rule(7).title)),
        bullets: makeFieldRule(
          [
            makeBullet(summary.watchpointSummary, rule(7).bullets.maxWords),
            makeBullet(summary.preGcsSensitivity.nonEffectZones[0] ?? "Non-effect zones remain explicit.", rule(7).bullets.maxWords),
            makeBullet(summary.preGcsSensitivity.nonEffectZones[1] ?? "Artifact repetition alone does not change the read.", rule(7).bullets.maxWords),
          ],
          ruleConfig(rule(7).bullets),
        ),
      },
    ],
  };
}

export function buildBoardOnePagerFieldPack(spec: BoardOnePagerSpec): BoardOnePagerFieldPack {
  return {
    topInterpretation: spec.stateBand.stateInterpretation.value,
    boardRead: [spec.boardRead.headline.value, spec.boardRead.summary.value],
    decisionHeadline: spec.decisionBox.title.value,
    signalGrid: spec.signalGrid.items.value.map((item) => ({
      label: titleCase(item.domain),
      value: item.state,
      direction: item.direction === "up" ? "↑" : item.direction === "down" ? "↓" : "→",
      implication: item.implication,
    })),
    decisionBullets: spec.decisionBox.actions.value,
    dominantPath: spec.dominantPath.statement.value,
    primaryPressure: spec.primaryPressure.statement.value,
    riskConcentrations: spec.riskConcentration.items.value,
    inflectionPaths: [
      spec.inflectionPaths.continuation.value,
      spec.inflectionPaths.reversal.value,
      spec.inflectionPaths.acceleration?.value ?? "",
    ].filter(Boolean),
    monitoringTriggers: spec.triggers.items.value,
    readShiftSignals: spec.readShiftSignals?.items.value ?? [],
    containedSpreadSplit: spec.containedVsSpreading?.items.value ?? [],
    evidenceAnchors: spec.evidenceSignals.items.value.map((item) => {
      const parts = item.signal.split(" ");
      const titleWords = parts.slice(0, 2);
      const rest = parts.slice(2, 8);
      return {
        id: item.code,
        shortTitle: `${item.code} — ${titleWords.join(" ")}`.trim(),
        shortSubtitle: rest.join(" ").trim(),
      };
    }),
  };
}

export function buildExecutiveBriefFieldPack(spec: ExecutiveBriefSpec): ExecutiveBriefFieldPack {
  return buildExecutiveBriefFieldPackV2(spec);
}

export function buildPresentationBriefFieldPack(spec: PresentationBriefSpec): PresentationBriefFieldPack {
  return {
    titleSlide: slide("title", spec.slides[0].title.value, "Current state at a glance", spec.slides[0].bullets.value),
    systemStateSlide: {
      ...slide("system", spec.slides[1].title.value, "The state vector is explicit", spec.slides[1].bullets.value),
      signalStrip: [
        { label: "Phase", value: "Active" },
        { label: "Mode", value: "Boarded" },
        { label: "Boundary", value: "Active" },
      ],
    },
    keyJudgmentsSlide: slide("takeaways", spec.slides[2].title.value, "Adjudication remains threshold-driven", spec.slides[2].bullets.value),
    progressionSlide: slide("progression", spec.slides[3].title.value, "Artifacts map into visible state", spec.slides[3].bullets.value),
    inflectionSlide: slide("inflections", spec.slides[4].title.value, "Temporal spine remains explicit", spec.slides[4].bullets.value),
    impactSlide: slide("implications", spec.slides[5].title.value, "Proof scaffold remains audit-visible", spec.slides[5].bullets.value),
    pathwaysSlide: {
      ...slide("paths", spec.slides[6].title.value, "Pre-GCS sensitivity remains separate", spec.slides[6].bullets.value),
      signalStrip: [
        { label: "Primary", value: "Sensitivity" },
        { label: "Mode", value: "Pre-GCS" },
      ],
    },
    monitoringSlide: slide("monitoring", spec.slides[7].title.value, "Sensitivity boundaries remain explicit", spec.slides[7].bullets.value),
  };
}

export function mapBoardOnePagerSpecToRenderedSections(
  spec: BoardOnePagerSpec,
): BoardOnePagerRenderedSectionMapping {
  return {
    header: {
      title: spec.header.scenarioTitle.value,
      asOf: spec.header.replayMonthLabel.value,
      confidentiality: spec.header.confidentialityLabel.value,
    },
    stateBand: {
      metrics: [
        spec.stateBand.phase.value,
        spec.stateBand.density.value,
        spec.stateBand.momentum.value,
        spec.stateBand.reversibility.value,
      ],
      interpretation: spec.stateBand.stateInterpretation.value,
    },
    boardRead: [spec.boardRead.headline.value, spec.boardRead.summary.value],
    decisionBox: {
      title: spec.decisionBox.title.value,
      actions: spec.decisionBox.actions.value,
    },
    commandStrip: {
      dominantPath: spec.dominantPath.statement.value,
      primaryPressure: spec.primaryPressure.statement.value,
      riskConcentration: spec.riskConcentration.items.value,
    },
    inflectionPaths: {
      continuation: spec.inflectionPaths.continuation.value,
      reversal: spec.inflectionPaths.reversal.value,
      acceleration: spec.inflectionPaths.acceleration?.value,
    },
    triggers: spec.triggers.items.value,
    readShiftSignals: spec.readShiftSignals?.items.value ?? [],
    containedVsSpreading: spec.containedVsSpreading?.items.value ?? [],
    evidenceSignals: spec.evidenceSignals.items.value,
  };
}

export function mapExecutiveBriefSpecToRenderedSections(
  spec: ExecutiveBriefSpec,
): ExecutiveBriefRenderedSectionMapping {
  return mapExecutiveBriefSpecToRenderedSectionsV2(spec);
}

export function mapPresentationBriefSpecToRenderedSections(
  spec: PresentationBriefSpec,
): PresentationBriefRenderedSectionMapping {
  const pack = buildPresentationBriefFieldPack(spec);
  const slides = [
    pack.titleSlide,
    pack.systemStateSlide,
    pack.keyJudgmentsSlide,
    pack.progressionSlide,
    pack.inflectionSlide,
    pack.impactSlide,
    pack.pathwaysSlide,
    pack.monitoringSlide,
  ];

  return {
    slides: slides.map((item) => ({
      id: item.id,
      title: item.title,
      headline: item.headline,
      bulletCount: item.bullets.length,
      totalWords:
        words(item.headline).length +
        item.bullets.reduce((sum, bullet) => sum + words(bullet).length, 0),
      hasSignalStrip: Boolean(item.signalStrip?.length),
    })),
  };
}

export function buildBoardOnePagerSpecFromVoiceBrief(
  intelligence: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): BoardOnePagerSpec {
  return buildBoardOnePagerSpec({} as CanonicalExportSummary, intelligence);
}

export function buildExecutiveBriefSpecFromVoiceBrief(
  intelligence: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): ExecutiveBriefSpec {
  return buildExecutiveBriefSpecFromSummaryV2({} as CanonicalExportSummary, intelligence);
}

export function buildPresentationBriefSpecFromVoiceBrief(
  intelligence: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): PresentationBriefSpec {
  return buildPresentationBriefSpec({} as CanonicalExportSummary, intelligence);
}

export function buildAssistedIntelligenceFromSummary(
  summary: CanonicalExportSummary,
): VoiceBriefIntelligence {
  const boardSpec = buildBoardOnePagerSpec(summary);
  const executiveSpec = buildExecutiveBriefSpec(summary);
  const presentationSpec = buildPresentationBriefSpec(summary);
  const boardPack = buildBoardOnePagerFieldPack(boardSpec);
  const executiveSource = buildExecutiveBriefSourceIntelligence(summary);

  return {
    transcriptId: `assisted-${Date.now()}`,
    capturedAt: summary.timestamp,
    scenarioTitle: summary.scenarioTitle,
    replayMonthLabel: summary.replayMonth,
    confidentialityLabel: summary.confidentialityLabel,
    boundedWorld: summary.boundedWorld,
    phase: boardSpec.stateBand.phase.value,
    density: boardSpec.stateBand.density.value,
    momentum: boardSpec.stateBand.momentum.value,
    reversibility: boardSpec.stateBand.reversibility.value,
    executiveHeadline: executiveSpec.header.executiveHeadline.value,
    boardRead: {
      headline: boardSpec.boardRead.headline.value,
      summary: boardSpec.boardRead.summary.value,
    },
    decisionActions: boardSpec.decisionBox.actions.value,
    dominantPath: boardSpec.dominantPath.statement.value,
    primaryPressure: boardSpec.primaryPressure.statement.value,
    riskConcentration: boardSpec.riskConcentration.items.value,
    inflectionPaths: {
      continuation: boardSpec.inflectionPaths.continuation.value,
      reversal: boardSpec.inflectionPaths.reversal.value,
      acceleration: boardSpec.inflectionPaths.acceleration?.value,
    },
    triggers: boardSpec.triggers.items.value,
    signalGrid: boardSpec.signalGrid.items.value,
    evidenceSignals: boardSpec.evidenceSignals.items.value.map((item) => ({
      ...item,
      significance: executiveEvidenceSignal({
        id: item.code,
        shortTitle: item.signal,
        shortSubtitle: "",
      }).significance,
    })),
    systemState: {
      title: executiveSpec.systemStateOverview.sectionTitle.value,
      summary: executiveSpec.systemStateOverview.currentConditionParagraph.value,
      sidebarInsight: executiveSpec.systemStateOverview.sidebarInsight?.value ?? executiveSource.systemStateSidebar ?? "",
    },
    narrativeProgression: {
      title: executiveSpec.narrativeDevelopment.sectionTitle.value,
      summary: executiveSpec.narrativeDevelopment.earlySignalsParagraph.value,
      sidebarInsight: executiveSpec.narrativeDevelopment.sidebarInsight?.value ?? executiveSource.narrativeSidebar ?? "",
    },
    structuralRead: {
      title: executiveSpec.structuralInterpretation.sectionTitle.value,
      summary: executiveSpec.structuralInterpretation.interpretationParagraph1.value,
      sidebarInsight: executiveSpec.structuralInterpretation.sidebarInsight?.value ?? executiveSource.structuralSidebar ?? "",
    },
    forwardView: {
      title: executiveSpec.forwardOrientation.sectionTitle.value,
      summary: executiveSpec.forwardOrientation.primaryPathParagraph.value,
      sidebarInsight: executiveSpec.forwardOrientation.sidebarInsight?.value ?? executiveSource.haloSidebar ?? "",
    },
    decisionPosture: {
      title: executiveSpec.strategicPositioning.sectionTitle.value,
      summary: executiveSpec.strategicPositioning.positioningParagraph1.value,
      sidebarInsight: executiveSpec.strategicPositioning.sidebarInsight?.value ?? executiveSource.traceabilitySidebar ?? "",
      actions: executiveSpec.strategicPositioning.priorityAreas?.value,
    },
    evidenceBase: {
      title: executiveSpec.evidenceBase.sectionTitle.value,
      intro: executiveSpec.evidenceBase.intro.value,
      items: executiveSpec.evidenceBase.items.value,
    },
    presentation: {
      slides: presentationSpec.slides.map((slideSpec) => ({
        slideType: slideSpec.slideType.value,
        title: slideSpec.title.value,
        subtitle: slideSpec.subtitle?.value,
        bullets: slideSpec.bullets.value,
        presenterNote: slideSpec.presenterNote?.value,
      })),
    },
    intelligenceSchema: {
      systemState: { statement: executiveSpec.systemStateOverview.currentConditionParagraph.value },
      dominantPath: { statement: boardSpec.dominantPath.statement.value },
      primaryPressure: { statement: boardSpec.primaryPressure.statement.value },
      keySignals: boardPack.signalGrid.slice(0, 3).map((item) => ({
        label: item.label,
        statement: item.implication,
      })),
      risks: boardSpec.riskConcentration.items.value.slice(0, 3).map((item, index) => ({
        area: `Risk ${index + 1}`,
        statement: item,
      })),
      triggers: boardSpec.triggers.items.value.slice(0, 3).map((statement) => ({ statement })),
      decisionIntent: {
        headline: boardSpec.decisionBox.title.value,
        actions: boardSpec.decisionBox.actions.value,
      },
    },
  };
}
