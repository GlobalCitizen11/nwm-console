import type {
  VoiceBriefDecisionIntentField,
  VoiceBriefIntelligence,
  VoiceBriefIntelligenceSchema,
  VoiceBriefRiskField,
  VoiceBriefSignalField,
  VoiceBriefTranscriptIntelligence,
} from "../types/voiceBriefIntelligence";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

function sentence(statement: string) {
  return { statement: clean(statement) };
}

function signal(label: string, statement: string): VoiceBriefSignalField {
  return {
    label: clean(label),
    statement: clean(statement),
  };
}

function risk(area: string, statement: string): VoiceBriefRiskField {
  return {
    area: clean(area),
    statement: clean(statement),
  };
}

function decisionIntent(headline: string, actions: string[]): VoiceBriefDecisionIntentField {
  return {
    headline: clean(headline),
    actions: actions.map(clean),
  };
}

export function buildVoiceBriefIntelligenceSchema(
  transcript: VoiceBriefTranscriptIntelligence,
): VoiceBriefIntelligenceSchema {
  return {
    systemState: sentence(transcript.systemStateSummary),
    dominantPath: sentence(transcript.dominantPath),
    primaryPressure: sentence(transcript.primaryPressure),
    keySignals: transcript.signalGrid.map((item) =>
      signal(item.domain, `${item.state}. ${item.implication}`),
    ),
    risks: transcript.riskConcentration.map((item) => risk("Risk concentration", item)),
    triggers: transcript.triggers.map((item) => sentence(item)),
    decisionIntent: decisionIntent(
      transcript.decisionPostureSummary || transcript.boardReadSummary,
      transcript.decisionPostureActions?.length ? transcript.decisionPostureActions : transcript.decisionActions,
    ),
  };
}

export function adaptVoiceBriefTranscript(
  transcript: VoiceBriefTranscriptIntelligence,
): VoiceBriefIntelligence {
  const intelligenceSchema = buildVoiceBriefIntelligenceSchema(transcript);

  return {
    transcriptId: transcript.transcriptId,
    capturedAt: transcript.capturedAt,
    scenarioTitle: clean(transcript.scenarioTitle),
    replayMonthLabel: clean(transcript.replayMonthLabel),
    confidentialityLabel: clean(transcript.confidentialityLabel),
    boundedWorld: clean(transcript.boundedWorld),
    phase: clean(transcript.phase),
    density: clean(transcript.density),
    momentum: clean(transcript.momentum),
    reversibility: clean(transcript.reversibility),
    executiveHeadline: clean(transcript.executiveHeadline),
    boardRead: {
      headline: clean(transcript.boardReadHeadline),
      summary: clean(transcript.boardReadSummary),
    },
    decisionActions: transcript.decisionActions.map(clean),
    dominantPath: clean(transcript.dominantPath),
    primaryPressure: clean(transcript.primaryPressure),
    riskConcentration: transcript.riskConcentration.map(clean),
    inflectionPaths: {
      continuation: clean(transcript.inflectionContinuation),
      reversal: clean(transcript.inflectionReversal),
      acceleration: transcript.inflectionAcceleration ? clean(transcript.inflectionAcceleration) : undefined,
    },
    triggers: transcript.triggers.map(clean),
    signalGrid: transcript.signalGrid.map((item) => ({
      ...item,
      state: clean(item.state),
      implication: clean(item.implication),
    })),
    evidenceSignals: transcript.executiveEvidenceSignals.map((item, index) => ({
      code: clean(item.code || transcript.evidenceSignals[index]?.code || `V${index + 1}`),
      signal: clean(item.signal || transcript.evidenceSignals[index]?.signal || ""),
      significance: clean(item.significance),
    })),
    systemState: {
      title: clean(transcript.systemStateTitle),
      summary: clean(transcript.systemStateSummary),
      sidebarInsight: clean(transcript.systemStateSidebarInsight),
    },
    narrativeProgression: {
      title: clean(transcript.narrativeProgressionTitle),
      summary: clean(transcript.narrativeProgressionSummary),
      sidebarInsight: clean(transcript.narrativeProgressionSidebarInsight),
    },
    structuralRead: {
      title: clean(transcript.structuralReadTitle),
      summary: clean(transcript.structuralReadSummary),
      sidebarInsight: clean(transcript.structuralReadSidebarInsight),
    },
    forwardView: {
      title: clean(transcript.forwardViewTitle),
      summary: clean(transcript.forwardViewSummary),
      sidebarInsight: clean(transcript.forwardViewSidebarInsight),
    },
    decisionPosture: {
      title: clean(transcript.decisionPostureTitle),
      summary: clean(transcript.decisionPostureSummary),
      sidebarInsight: clean(transcript.decisionPostureSidebarInsight),
      actions: transcript.decisionPostureActions?.map(clean),
    },
    evidenceBase: {
      title: clean(transcript.evidenceBaseTitle),
      intro: clean(transcript.evidenceBaseIntro),
      items: transcript.executiveEvidenceSignals.map((item) => ({
        code: clean(item.code),
        signal: clean(item.signal),
        significance: clean(item.significance),
      })),
    },
    presentation: {
      slides: transcript.presentationSlides.map((slide) => ({
        ...slide,
        title: clean(slide.title),
        subtitle: slide.subtitle ? clean(slide.subtitle) : undefined,
        bullets: slide.bullets.map(clean),
        presenterNote: slide.presenterNote ? clean(slide.presenterNote) : undefined,
      })),
    },
    intelligenceSchema,
  };
}
