import type {
  BoardOnePagerFieldPack,
  BoardOnePagerSpec as FeatureBoardOnePagerSpec,
  EvidenceSignal,
  ExecutiveEvidenceSignal,
  FallbackBehavior,
  FieldRule,
  PresentationBriefFieldPack,
  PresentationBriefSpec,
  PresentationSlideSpec,
  PresentationSlideType,
  RenderStyle,
  SignalGridItem,
  ToneType,
} from "../features/export/types/export";

export type {
  FieldRule,
  ToneType,
  RenderStyle,
  FallbackBehavior,
  EvidenceSignal,
  ExecutiveEvidenceSignal,
  SignalGridItem,
  PresentationSlideType,
  PresentationSlideSpec,
  PresentationBriefSpec,
  BoardOnePagerFieldPack,
  PresentationBriefFieldPack,
};
export type {
  ExecutiveBriefSpec,
  ExecutiveBriefFieldPack,
  ExecutiveBriefRenderedSectionMapping,
  ExecutiveBriefSourceIntelligence,
} from "./executiveBriefSpec";

export interface BoardContainedSpreadItem {
  label: string;
  value: string;
}

export interface BoardOnePagerSpec extends FeatureBoardOnePagerSpec {
  readShiftSignals?: {
    items: FieldRule<string[]>;
  };
  containedVsSpreading?: {
    items: FieldRule<BoardContainedSpreadItem[]>;
  };
}

export interface ArtifactSpecValidationIssue {
  path: string;
  message: string;
  code: "missing" | "word-budget" | "item-count" | "tone" | "render-style" | "artifact-fail";
  level: "warning" | "error";
}

export interface ArtifactSpecValidationResult {
  ok: boolean;
  issues: ArtifactSpecValidationIssue[];
}

export interface ArtifactFieldValidationStatus {
  path: string;
  ok: boolean;
  message: string;
}

export interface ExecutiveBodyRailSimilarity {
  sectionId: string;
  title: string;
  ok: boolean;
  overlapScore: number;
  message: string;
}

export interface BoardOnePagerRenderedSectionMapping {
  header: {
    title: string;
    asOf: string;
    confidentiality: string;
  };
  stateBand: {
    metrics: string[];
    interpretation: string;
  };
  boardRead: string[];
  decisionBox: {
    title: string;
    actions: string[];
  };
  commandStrip: {
    dominantPath: string;
    primaryPressure: string;
    riskConcentration: string[];
  };
  inflectionPaths: {
    continuation: string;
    reversal: string;
    acceleration?: string;
  };
  triggers: string[];
  readShiftSignals: string[];
  containedVsSpreading: BoardContainedSpreadItem[];
  evidenceSignals: EvidenceSignal[];
}

export interface PresentationBriefRenderedSectionMapping {
  slides: Array<{
    id: string;
    title: string;
    headline: string;
    bulletCount: number;
    totalWords: number;
    hasSignalStrip: boolean;
  }>;
}
