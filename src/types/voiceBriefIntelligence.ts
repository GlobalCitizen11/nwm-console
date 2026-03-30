import type {
  EvidenceSignal,
  ExecutiveEvidenceSignal,
  SignalGridItem,
} from "./artifactSpecs";

export interface VoiceBriefEvidenceSignal extends ExecutiveEvidenceSignal {
  confidence?: number;
}

export interface VoiceBriefSentenceField {
  statement: string;
}

export interface VoiceBriefSignalField {
  label: string;
  statement: string;
}

export interface VoiceBriefRiskField {
  area: string;
  statement: string;
}

export interface VoiceBriefDecisionIntentField {
  headline: string;
  actions: string[];
}

export interface VoiceBriefIntelligenceSchema {
  systemState: VoiceBriefSentenceField;
  dominantPath: VoiceBriefSentenceField;
  primaryPressure: VoiceBriefSentenceField;
  keySignals: VoiceBriefSignalField[];
  risks: VoiceBriefRiskField[];
  triggers: VoiceBriefSentenceField[];
  decisionIntent: VoiceBriefDecisionIntentField;
}

export interface VoiceBriefIntelligence {
  transcriptId: string;
  capturedAt: string;
  scenarioTitle: string;
  replayMonthLabel: string;
  confidentialityLabel: string;
  boundedWorld: string;
  phase: string;
  density: string;
  momentum: string;
  reversibility: string;
  executiveHeadline: string;
  boardRead: {
    headline: string;
    summary: string;
  };
  decisionActions: string[];
  dominantPath: string;
  primaryPressure: string;
  riskConcentration: string[];
  inflectionPaths: {
    continuation: string;
    reversal: string;
    acceleration?: string;
  };
  triggers: string[];
  signalGrid: SignalGridItem[];
  evidenceSignals: VoiceBriefEvidenceSignal[];
  systemState: {
    title: string;
    summary: string;
    sidebarInsight: string;
  };
  narrativeProgression: {
    title: string;
    summary: string;
    sidebarInsight: string;
  };
  structuralRead: {
    title: string;
    summary: string;
    sidebarInsight: string;
  };
  forwardView: {
    title: string;
    summary: string;
    sidebarInsight: string;
  };
  decisionPosture: {
    title: string;
    summary: string;
    sidebarInsight: string;
    actions?: string[];
  };
  evidenceBase: {
    title: string;
    intro: string;
    items: ExecutiveEvidenceSignal[];
  };
  presentation: {
    slides: Array<{
      slideType:
        | "title"
        | "system-state"
        | "key-risk"
        | "pressure"
        | "path"
        | "decision"
        | "triggers"
        | "evidence"
        | "close";
      title: string;
      subtitle?: string;
      bullets: string[];
      presenterNote?: string;
    }>;
  };
  intelligenceSchema?: VoiceBriefIntelligenceSchema;
}

export interface VoiceBriefTranscriptIntelligence {
  transcriptId: string;
  capturedAt: string;
  scenarioTitle: string;
  replayMonthLabel: string;
  confidentialityLabel: string;
  boundedWorld: string;
  phase: string;
  density: string;
  momentum: string;
  reversibility: string;
  executiveHeadline: string;
  boardReadHeadline: string;
  boardReadSummary: string;
  decisionActions: string[];
  dominantPath: string;
  primaryPressure: string;
  riskConcentration: string[];
  inflectionContinuation: string;
  inflectionReversal: string;
  inflectionAcceleration?: string;
  triggers: string[];
  signalGrid: SignalGridItem[];
  evidenceSignals: EvidenceSignal[];
  systemStateTitle: string;
  systemStateSummary: string;
  systemStateSidebarInsight: string;
  narrativeProgressionTitle: string;
  narrativeProgressionSummary: string;
  narrativeProgressionSidebarInsight: string;
  structuralReadTitle: string;
  structuralReadSummary: string;
  structuralReadSidebarInsight: string;
  forwardViewTitle: string;
  forwardViewSummary: string;
  forwardViewSidebarInsight: string;
  decisionPostureTitle: string;
  decisionPostureSummary: string;
  decisionPostureSidebarInsight: string;
  decisionPostureActions?: string[];
  evidenceBaseTitle: string;
  evidenceBaseIntro: string;
  executiveEvidenceSignals: ExecutiveEvidenceSignal[];
  presentationSlides: VoiceBriefIntelligence["presentation"]["slides"];
}
