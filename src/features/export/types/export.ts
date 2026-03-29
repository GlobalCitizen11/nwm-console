import type { BriefingState } from "../../../types";
import type { VoiceBriefIntelligence } from "../../../types/voiceBriefIntelligence";
import type {
  ExecutiveBriefFieldPack as NewExecutiveBriefFieldPack,
  ExecutiveBriefSpec as NewExecutiveBriefSpec,
} from "../../../types/executiveBriefSpec";

export type ExportMode = "executive-brief" | "presentation-brief" | "board-onepager";
export type DensityMode = "compact" | "standard" | "expanded";
export type CopyVariant = "full" | "medium" | "compact";
export type ModuleFitMode =
  | "hero"
  | "support"
  | "kpi"
  | "evidence"
  | "timeline"
  | "implication"
  | "monitoring"
  | "scenario"
  | "closing";

export interface ExportMetadata {
  scenarioName: string;
  boundedWorld: string;
  phase: string;
  asOf: string;
  generatedAt: string;
  confidentiality: string;
  currentViewName: string;
}

export interface ExportInsight {
  id: string;
  headline: string;
  support: string;
  emphasis?: "neutral" | "attention" | "stable";
  signalTag?: string;
  headlineVariants?: Record<CopyVariant, string>;
  bodyVariants?: Record<CopyVariant, string>;
  priority?: "primary" | "secondary";
  fitMode?: ModuleFitMode;
}

export interface ExportStat {
  label: string;
  value: string;
  support?: string;
  status?: "neutral" | "attention" | "stable";
}

export interface ExportTimelineItem {
  id: string;
  phase: string;
  summary: string;
  significance: string;
  summaryVariants?: Record<CopyVariant, string>;
  significanceVariants?: Record<CopyVariant, string>;
  fitMode?: ModuleFitMode;
}

export interface ExportSemanticData {
  title: string;
  subtitle: string;
  metadata: ExportMetadata;
  boundary: string;
  executiveLead: string;
  keyInsights: ExportInsight[];
  systemStats: ExportStat[];
  timeline: ExportTimelineItem[];
  implications: ExportInsight[];
  risks: ExportInsight[];
  evidenceAnchors: ExportInsight[];
  crossDomainEffects: ExportInsight[];
  containmentSignals: ExportInsight[];
  scenarioPaths: ExportInsight[];
  monitoringPriorities: ExportInsight[];
  closingSynthesis: string;
  sourceState: BriefingState;
}

export interface CanonicalSystemTruth {
  currentState: string;
  trajectory: string;
  primaryPressureSource: string;
  systemBehavior: string;
  narrativeEvolution: {
    earlySignals: string[];
    systemicUptake: string[];
    currentState: string[];
  };
}

export interface ExportModulePayload {
  id: string;
  title: string;
  label?: string;
  density: DensityMode;
  estimatedHeight: number;
  keepTogether?: boolean;
  content: ExportInsight[] | ExportStat[] | ExportTimelineItem[] | string[];
}

export interface LayoutScore {
  whitespaceBalance: number;
  visualHierarchy: number;
  densityFit: number;
  sectionCompleteness: number;
  breakIntegrity: number;
}

export interface OnePagerScore extends LayoutScore {
  signalDensity: number;
  gridBalance: number;
  scanability: number;
  decisionReadiness: number;
}

export interface ExportQaIssue {
  level: "warning" | "error";
  code:
    | "overflow"
    | "underfill"
    | "widow-heading"
    | "broken-card"
    | "spacing"
    | "contrast"
    | "density";
  message: string;
}

export interface ExportQaResult {
  ok: boolean;
  issues: ExportQaIssue[];
}

export interface ExportPreviewBundle {
  mode: ExportMode;
  data: ExportSemanticData;
  canonicalSummary: CanonicalExportSummary;
  intelligenceSource: "canonical-assisted";
  voiceIntelligence?: VoiceBriefIntelligence;
  contentByMode: ExportContentByMode;
  htmlByMode: Record<ExportMode, string>;
  qaByMode: Record<ExportMode, ExportQaResult>;
  filenameByMode: Record<ExportMode, string>;
  orientationByMode: Record<ExportMode, "portrait" | "landscape">;
}

export interface CanonicalEvidenceAnchor {
  id: string;
  shortTitle: string;
  shortSubtitle: string;
}

export type ToneType =
  | "directive"
  | "analytical"
  | "interpretive"
  | "predictive"
  | "signal"
  | "explanatory"
  | "framing"
  | "declarative";

export type RenderStyle = "headline" | "paragraph" | "bullet" | "chip" | "row" | "list" | "strip";

export type FallbackBehavior = "omit" | "compress" | "replace-with-default";

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

export interface BoardOnePagerFieldPack {
  topInterpretation: string;
  boardRead: string[];
  decisionHeadline: string;
  signalGrid: Array<{ label: string; value: string; direction: string; implication: string }>;
  decisionBullets: string[];
  dominantPath: string;
  primaryPressure: string;
  riskConcentrations: string[];
  inflectionPaths: string[];
  monitoringTriggers: string[];
  readShiftSignals: string[];
  containedSpreadSplit: Array<{ label: string; value: string }>;
  evidenceAnchors: CanonicalEvidenceAnchor[];
}

export interface EvidenceSignal {
  code: string;
  signal: string;
}

export interface ExecutiveEvidenceSignal extends EvidenceSignal {
  significance: string;
}

export interface SignalGridItem {
  domain: "coordination" | "allocation" | "infrastructure" | "markets";
  state: string;
  direction: "up" | "down" | "flat";
  implication: string;
}

export interface BoardOnePagerSpec {
  header: {
    scenarioTitle: FieldRule<string>;
    replayMonthLabel: FieldRule<string>;
    confidentialityLabel: FieldRule<string>;
  };
  stateBand: {
    phase: FieldRule<string>;
    density: FieldRule<string>;
    momentum: FieldRule<string>;
    reversibility: FieldRule<string>;
    stateInterpretation: FieldRule<string>;
  };
  boardRead: {
    headline: FieldRule<string>;
    summary: FieldRule<string>;
  };
  decisionBox: {
    title: FieldRule<string>;
    actions: FieldRule<string[]>;
  };
  dominantPath: {
    statement: FieldRule<string>;
  };
  primaryPressure: {
    statement: FieldRule<string>;
  };
  riskConcentration: {
    items: FieldRule<string[]>;
  };
  inflectionPaths: {
    continuation: FieldRule<string>;
    reversal: FieldRule<string>;
    acceleration?: FieldRule<string>;
  };
  triggers: {
    items: FieldRule<string[]>;
  };
  evidenceSignals: {
    items: FieldRule<EvidenceSignal[]>;
  };
  signalGrid: {
    items: FieldRule<SignalGridItem[]>;
  };
}

export interface ExecutiveBriefFieldPack {
  systemStrip: Array<{ label: string; value: string }>;
  assumptionsUnderStrain: string[];
  containedVsSpreading: Array<{ label: string; value: string }>;
  decisionFrames: {
    whatChanged: string;
    invalidates: string[];
    costOfDelay: string;
  };
  systemStateOverview: ExecutiveBriefSectionContent;
  narrativeDevelopment: ExecutiveBriefSectionContent;
  structuralInterpretation: ExecutiveBriefSectionContent;
  forwardOrientation: ExecutiveBriefSectionContent;
  strategicPositioning: ExecutiveBriefSectionContent;
  evidenceAnchors: ExecutiveBriefSectionContent;
}

export interface LegacyExecutiveBriefSpec {
  cover: {
    scenarioTitle: FieldRule<string>;
    replayMonthLabel: FieldRule<string>;
    phase: FieldRule<string>;
    density: FieldRule<string>;
    momentum: FieldRule<string>;
    reversibility: FieldRule<string>;
    executiveHeadline: FieldRule<string>;
  };
  systemState: {
    title: FieldRule<string>;
    summary: FieldRule<string>;
    sidebarInsight: FieldRule<string>;
  };
  narrativeProgression: {
    title: FieldRule<string>;
    summary: FieldRule<string>;
    sidebarInsight: FieldRule<string>;
  };
  structuralRead: {
    title: FieldRule<string>;
    summary: FieldRule<string>;
    sidebarInsight: FieldRule<string>;
  };
  forwardView: {
    title: FieldRule<string>;
    summary: FieldRule<string>;
    sidebarInsight: FieldRule<string>;
  };
  decisionPosture: {
    title: FieldRule<string>;
    summary: FieldRule<string>;
    sidebarInsight: FieldRule<string>;
    actions?: FieldRule<string[]>;
  };
  evidenceBase: {
    title: FieldRule<string>;
    intro: FieldRule<string>;
    items: FieldRule<ExecutiveEvidenceSignal[]>;
  };
}

export type PresentationSlideType =
  | "title"
  | "system-state"
  | "key-risk"
  | "pressure"
  | "path"
  | "decision"
  | "triggers"
  | "evidence"
  | "close";

export interface PresentationSlideSpec {
  slideType: FieldRule<PresentationSlideType>;
  title: FieldRule<string>;
  subtitle?: FieldRule<string>;
  bullets: FieldRule<string[]>;
  presenterNote?: FieldRule<string>;
}

export interface PresentationBriefFieldPack {
  titleSlide: PresentationSlideContent;
  systemStateSlide: PresentationSlideContent;
  keyJudgmentsSlide: PresentationSlideContent;
  progressionSlide: PresentationSlideContent;
  inflectionSlide: PresentationSlideContent;
  impactSlide: PresentationSlideContent;
  pathwaysSlide: PresentationSlideContent;
  monitoringSlide: PresentationSlideContent;
}

export interface PresentationBriefSpec {
  slides: PresentationSlideSpec[];
}

export interface CanonicalExportSummary {
  scenarioTitle: string;
  replayMonth: string;
  timestamp: string;
  confidentialityLabel: string;
  boundedWorld: string;
  phase: string;
  density: string;
  momentum: string;
  reversibility: string;
  currentStateSummary: string;
  dominantPathSummary: string;
  primaryPressureSummary: string;
  implicationsSummary: string;
  monitoringSummary: string;
  narrativeDevelopment: {
    earlySignalsSummary: string;
    systemicUptakeSummary: string;
    currentStateFormationSummary: string;
  };
  structuralInterpretationSummary: string;
  forwardOrientationSummary: string;
  alternatePathSummary: string;
  strategicPositioningSummary: string;
  watchpointSummary: string;
  evidenceAnchorsCompact: CanonicalEvidenceAnchor[];
}

export interface ExecutiveInsightCard {
  label: string;
  value: string;
  support?: string;
}

export interface ExecutiveBriefSectionContent {
  id:
    | "system-state-overview"
    | "narrative-development"
    | "structural-interpretation"
    | "forward-orientation"
    | "strategic-positioning"
    | "evidence-anchors";
  title: string;
  paragraphs: string[];
  bullets?: string[];
  insightCard: ExecutiveInsightCard;
}

export interface ExecutiveBriefContent {
  title: string;
  replayMonth: string;
  timestamp: string;
  confidentialityLabel: string;
  boundedWorld: string;
  spec: NewExecutiveBriefSpec;
  fieldPack: NewExecutiveBriefFieldPack;
}

export interface BoardOnePagerContent {
  title: string;
  replayMonth: string;
  timestamp: string;
  confidentialityLabel: string;
  boundedWorld: string;
  systemStrip: Array<{ label: string; value: string }>;
  spec: BoardOnePagerSpec;
  fieldPack: BoardOnePagerFieldPack;
  topInterpretation: string;
  boardRead: string[];
  decisionHeadline: string;
  signalGrid: Array<{ label: string; value: string; direction: string; implication: string }>;
  decisionBullets: string[];
  dominantPath: string;
  primaryPressure: string;
  riskConcentrations: string[];
  nextChangeSignals: string[];
  monitoringTriggers: string[];
  readShiftSignals: string[];
  containedSpreadSplit: Array<{ label: string; value: string }>;
  evidenceAnchors: CanonicalEvidenceAnchor[];
}

export interface PresentationSlideContent {
  id: string;
  title: string;
  headline: string;
  bullets: string[];
  signalStrip?: Array<{ label: string; value: string }>;
}

export interface PresentationBriefContent {
  title: string;
  replayMonth: string;
  timestamp: string;
  confidentialityLabel: string;
  spec: PresentationBriefSpec;
  fieldPack: PresentationBriefFieldPack;
  slides: PresentationSlideContent[];
}

export interface ExportContentByMode {
  "executive-brief": ExecutiveBriefContent;
  "presentation-brief": PresentationBriefContent;
  "board-onepager": BoardOnePagerContent;
}
