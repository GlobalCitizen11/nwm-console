import type { BriefingState } from "../../../types";

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
  htmlByMode: Record<ExportMode, string>;
  qaByMode: Record<ExportMode, ExportQaResult>;
  filenameByMode: Record<ExportMode, string>;
  orientationByMode: Record<ExportMode, "portrait" | "landscape">;
}
