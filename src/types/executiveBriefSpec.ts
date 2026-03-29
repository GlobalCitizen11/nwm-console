export type ToneType =
  | "framing"
  | "interpretive"
  | "analytical"
  | "predictive"
  | "directive"
  | "signal"
  | "explanatory";

export type RenderStyle =
  | "headline"
  | "paragraph"
  | "bulletList"
  | "signalRow"
  | "metricStrip"
  | "evidenceRow"
  | "metaRow";

export type FallbackBehavior =
  | "omit"
  | "compress"
  | "replace-with-default";

export interface FieldRule<T> {
  value: T;
  required: boolean;
  maxWords?: number;
  minWords?: number;
  minItems?: number;
  maxItems?: number;
  tone: ToneType;
  renderStyle: RenderStyle;
  placement: string;
  fallback: FallbackBehavior;
}

export interface ExecutiveEvidenceItem {
  code: string;
  signal: string;
  significance: string;
}

export interface ExecutiveBriefSpec {
  header: {
    scenarioName: FieldRule<string>;
    boundedWorld: FieldRule<string>;
    asOfLabel: FieldRule<string>;
    currentPhase: FieldRule<string>;
    haloSnapshotVisual?: FieldRule<string>;
    executiveHeadline: FieldRule<string>;
    executiveSubline: FieldRule<string>;
  };
  systemStateOverview: {
    sectionTitle: FieldRule<string>;
    currentConditionParagraph: FieldRule<string>;
    meaningParagraph: FieldRule<string>;
    sidebarInsight?: FieldRule<string>;
  };
  narrativeDevelopment: {
    sectionTitle: FieldRule<string>;
    earlySignalsParagraph: FieldRule<string>;
    systemicUptakeParagraph: FieldRule<string>;
    currentConditionParagraph: FieldRule<string>;
    sidebarInsight?: FieldRule<string>;
  };
  structuralInterpretation: {
    sectionTitle: FieldRule<string>;
    interpretationParagraph1: FieldRule<string>;
    interpretationParagraph2?: FieldRule<string>;
    sidebarInsight?: FieldRule<string>;
  };
  forwardOrientation: {
    sectionTitle: FieldRule<string>;
    primaryPathParagraph: FieldRule<string>;
    alternatePathParagraph: FieldRule<string>;
    sidebarInsight?: FieldRule<string>;
  };
  strategicPositioning: {
    sectionTitle: FieldRule<string>;
    positioningParagraph1: FieldRule<string>;
    positioningParagraph2?: FieldRule<string>;
    priorityAreas?: FieldRule<string[]>;
    sensitivityPoints?: FieldRule<string[]>;
    visibilityNeeds?: FieldRule<string[]>;
    sidebarInsight?: FieldRule<string>;
  };
  evidenceBase: {
    sectionTitle: FieldRule<string>;
    intro: FieldRule<string>;
    items: FieldRule<ExecutiveEvidenceItem[]>;
  };
}

export interface ExecutiveBriefSourceIntelligence {
  scenarioName: string;
  boundedWorld: string;
  asOfLabel: string;
  currentPhase: string;
  haloSnapshotVisual?: string;
  executiveHeadline: string;
  executiveSubline: string;
  currentState: string;
  environmentalCharacterization: string;
  operatingMeaning: string;
  brokenAssumptions: string[];
  pressureZones: string[];
  earlySignals: string;
  systemicUptake: string;
  recentDevelopments: string;
  structuralMeaning: string;
  implicitVariableBehavior: string;
  transitionType: string;
  primaryPath: string;
  alternatePath: string;
  currentExposures: string;
  flexibilityNeeds: string;
  visibilityNeeds: string[];
  priorityAreas: string[];
  sensitivityPoints: string[];
  evidenceSignals: ExecutiveEvidenceItem[];
}

export interface ExecutiveBriefFieldPack {
  headerMeta: Array<{ label: string; value: string }>;
  pageModel: {
    page1: string[];
    page2: string[];
    page3: string[];
  };
}

export interface ExecutiveBriefRenderedSectionMapping {
  header: {
    scenarioName: string;
    boundedWorld: string;
    asOfLabel: string;
    currentPhase: string;
    executiveHeadline: string;
    executiveSubline: string;
  };
  page1: {
    systemStateOverview: {
      currentConditionParagraph: string;
      meaningParagraph: string;
      sidebarInsight?: string;
    };
  };
  page2: {
    narrativeDevelopment: {
      earlySignalsParagraph: string;
      systemicUptakeParagraph: string;
      currentConditionParagraph: string;
      sidebarInsight?: string;
    };
    structuralInterpretation: {
      interpretationParagraph1: string;
      interpretationParagraph2?: string;
      sidebarInsight?: string;
    };
  };
  page3: {
    forwardOrientation: {
      primaryPathParagraph: string;
      alternatePathParagraph: string;
      sidebarInsight?: string;
    };
    strategicPositioning: {
      positioningParagraph1: string;
      positioningParagraph2?: string;
      priorityAreas?: string[];
      sensitivityPoints?: string[];
      visibilityNeeds?: string[];
      sidebarInsight?: string;
    };
    evidenceBase: {
      intro: string;
      items: ExecutiveEvidenceItem[];
    };
  };
}
