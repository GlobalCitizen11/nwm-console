export type SourceType =
  | "policy"
  | "media"
  | "market"
  | "legal"
  | "infrastructure"
  | "sovereign";

export type StructuralEffect = "reinforce" | "destabilize" | "reclassify";

export interface NarrativeEvent {
  id: string;
  month: number;
  label: string;
  title: string;
  description: string;
  sourceType: SourceType;
  domainTags: string[];
  structuralEffect: StructuralEffect;
  metrics: {
    velocity: number;
    density: number;
    coherence: number;
    reversibility: number;
  };
  phase: string;
  haloColor: string;
}

export interface ProofObject {
  proofId: string;
  transitionRef: {
    fromPhase: string;
    toPhase: string;
    ruleVersion: string;
  };
  evidenceHashes: string[];
  quantitativeDeltas: {
    velocityDelta: number;
    densityDelta: number;
    coherenceDelta: number;
    reversibilityDelta: number;
  };
  relationshipEvidence: string[];
  thresholdConditions: string[];
  uncertaintyScore: number;
  timestamp: string;
  rationale: string;
  auditHash: string;
  challengeStatus: "unchallenged" | "under_review" | "resolved";
  oversight: {
    reviewState: "reviewed" | "not_reviewed" | "challenged" | "resolved";
    reviewer: string;
    timestamp: string;
    analystNotes: string;
  };
}

export interface ProofOverride {
  challengeStatus: ProofObject["challengeStatus"];
  oversight: ProofObject["oversight"];
}

export interface HaloOrientation {
  dominantOrientationColor: string;
  momentum: number;
  emergenceRatio: number;
  evidentiaryMass: number;
  instability: number;
}

export interface WorldDefinition {
  name: string;
  domain: string;
  geography: string;
  timeHorizonMonths: number;
  governanceMode: "Demo" | "Institutional" | "Public-grade";
  boundedDescription: string;
  summary: string;
  sourceClasses?: string[];
}

export interface ScenarioDataset {
  world: WorldDefinition;
  events: NarrativeEvent[];
}

export interface ScenarioDefinition {
  id: string;
  label: string;
  description: string;
  dataset: ScenarioDataset;
}

export interface WorldStatePoint {
  month: number;
  phase: string;
  metrics: {
    velocity: number;
    density: number;
    coherence: number;
    reversibility: number;
  };
  halo: HaloOrientation;
  visibleEvents: NarrativeEvent[];
}

export interface TransitionRecord {
  id: string;
  month: number;
  fromPhase: string;
  toPhase: string;
  triggeringArtifacts: NarrativeEvent[];
  proof: ProofObject;
  ruleVersion: string;
  stabilityScore: number;
}

export interface SimulationResult {
  world: WorldDefinition;
  timeline: WorldStatePoint[];
  transitions: TransitionRecord[];
  proofObjects: ProofObject[];
}

export interface ViewSnapshot {
  id: string;
  name: string;
  scenarioId: string;
  role: string;
  month: number;
  eventId: string | null;
  transitionId: string | null;
  compareScenarioId: string | null;
}

export interface CounterfactualOperation {
  eventId: string;
  mode: "remove" | "delay" | "reduce";
  delayMonths: number;
  strengthMultiplier: number;
}

export type CounterfactualScenario = CounterfactualOperation[];

export interface NamedCounterfactualScenario {
  id: string;
  name: string;
  operations: CounterfactualScenario;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
  rationale: string;
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  event: NarrativeEvent;
}

export interface ProjectionAssumptions {
  horizonMonths: number;
  continuationBias: number;
  artifactCadence: number;
  reversibilityDecay: number;
  destabilizationBias: number;
}

export interface ProjectionConditionGap {
  label: string;
  currentValue: number;
  targetValue: number;
  gap: number;
  direction: "at_or_above" | "at_or_below";
}

export interface ProjectionPoint {
  month: number;
  phase: string;
  metrics: WorldStatePoint["metrics"];
  halo: HaloOrientation;
  syntheticArtifactId: string;
}

export interface ProjectionResult {
  assumptions: ProjectionAssumptions;
  currentPhase: string;
  nextPhaseTarget: string | null;
  thresholdProximity: ProjectionConditionGap[];
  projectedTimeline: ProjectionPoint[];
  projectedTransitions: TransitionRecord[];
  outlookSummary: string;
  uncertaintyBand: "low" | "medium" | "high";
}

export type DecisionSimulationActionType =
  | "de-risk-allocation"
  | "accelerate-coordination"
  | "protect-supply-access"
  | "hold-position";

export interface DecisionSimulationAction {
  id: DecisionSimulationActionType;
  label: string;
  description: string;
}

export interface DecisionSimulationImpact {
  summary: string;
  delta: number;
  direction: "improves" | "worsens" | "holds";
}

export interface DecisionSimulationResult {
  action: DecisionSimulationAction;
  projectedPhase: string;
  narrative: DecisionSimulationImpact;
  risk: DecisionSimulationImpact;
  capitalFlow: DecisionSimulationImpact;
  outlookSummary: string;
  uncertaintyBand: ProjectionResult["uncertaintyBand"];
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action:
    | "scenario_imported"
    | "scenario_removed"
    | "scenario_exported"
    | "proof_updated"
    | "brief_exported"
    | "view_changed";
  subject: string;
  detail: string;
}

export interface BriefingRawState {
  scenarioName: string;
  result: SimulationResult;
  point: WorldStatePoint;
  currentView: ViewSnapshot;
}

export interface ExecutiveBriefGateCheck {
  id:
    | "narrative-world-boundary"
    | "structural-memory"
    | "state-vector-completeness"
    | "phase-adjudication"
    | "structural-momentum"
    | "density-threshold"
    | "reversibility-classification"
    | "proof-object-sufficiency"
    | "halo-orientation-integrity"
    | "category-separation";
  label: string;
  passed: boolean;
  detail: string;
  failureMode: string;
}

export interface ExecutiveBriefBoundaryWindow {
  start: string;
  end: string;
  resolution: "Monthly";
  current: string;
}

export interface ExecutiveBriefBoundaryDefinition {
  includedEntities: string[];
  excludedEntities: string[];
  temporalWindow: ExecutiveBriefBoundaryWindow;
  spatialDomain: string;
  platformDomain: string;
  artifactInclusionCriteria: string[];
}

export interface ExecutiveBriefProofTrace {
  visibleArtifactIds: string[];
  transitionIds: string[];
  proofIds: string[];
  ruleVersions: string[];
  challengeStates: ProofObject["challengeStatus"][];
  reviewStates: ProofObject["oversight"]["reviewState"][];
}

export interface ExecutiveBriefOrientationGate {
  mode: "Orientation";
  framework: "HALO + PAL";
  validity: "Structurally Valid" | "Structurally Incomplete";
  boundaryDefinition: ExecutiveBriefBoundaryDefinition;
  boundarySummary: string;
  temporalWindowSummary: string;
  platformDomainSummary: string;
  artifactCriteriaSummary: string;
  dominantNarratives: string[];
  competingNarratives: string[];
  synchronizationSummary: string;
  proofTrace: ExecutiveBriefProofTrace;
  proofTraceSummary: string;
  traceabilityMarkers: string[];
  unmetRequirements: string[];
  checks: ExecutiveBriefGateCheck[];
}

export type ArtifactStructuralRole =
  | "world-definition"
  | "burden"
  | "infrastructure"
  | "reinforcement"
  | "counterweight";

export interface ArtifactRecord {
  id: string;
  sourceType: SourceType;
  title: string;
  summary: string;
  observedAt: string;
  eventTime: string;
  domainTags: string[];
  primaryFunction: string;
  stateEffects: {
    velocity: number;
    density: number;
    coherence: number;
    reversibility: number;
  };
  structuralRole: ArtifactStructuralRole;
}

export interface StateVectorV2 {
  velocity: number;
  density: number;
  coherence: number;
  reversibility: number;
  confidence: number;
  basis: "deterministic-replay";
}

export interface PhaseResolutionV2 {
  phase: string;
  adjudicationStatus: "pal-like-threshold";
  rationale: string;
  thresholdConditions: string[];
}

export interface ProofObjectScaffold {
  proofStatus: "pre-governance-grade";
  linkedTransition: string;
  artifactIds: string[];
  thresholdConditions: string[];
  quantitativeDeltas: ProofObject["quantitativeDeltas"];
  rationale: string;
  uncertainty: number;
  auditHash: string;
  oversightState: {
    reviewState: ProofObject["oversight"]["reviewState"];
    challengeStatus: ProofObject["challengeStatus"];
  };
}

export interface ArtifactStateMappingRow {
  artifactId: string;
  artifact: string;
  primaryFunction: string;
  stateEffect: string;
  interpretiveRole: string;
}

export interface TemporalSpineEntry {
  id: string;
  label: string;
  month: number;
  phase: string;
  artifactIds: string[];
  structuralEffect: StructuralEffect;
  summary: string;
}

export interface PreGCSSensitivityLayer {
  enabled: true;
  reason: "phase adjudication is threshold-based, not formal PAL";
  provisionalLabel: "pre-gcs";
  primarySensitivities: string[];
  counterweightConditions: string[];
  nonEffectZones: string[];
  reversibilityConstraints: string[];
}

export interface BriefingStateV2 {
  artifactSetSummary: string;
  artifactRecords: ArtifactRecord[];
  stateVector: StateVectorV2;
  phaseResolution: PhaseResolutionV2;
  proofScaffolds: ProofObjectScaffold[];
  artifactStateMapping: ArtifactStateMappingRow[];
  temporalSpine: TemporalSpineEntry[];
  preGcsSensitivity: PreGCSSensitivityLayer;
}

export interface BriefingState {
  scenarioName: string;
  boundedWorld: string;
  boundaryDefinition: string;
  asOf: string;
  phase: string;
  narrativeDensity: "low" | "building" | "high" | "saturated";
  structuralMomentum: "fragmenting" | "consolidating" | "cascading";
  reversibility: "high" | "conditional" | "low" | "locked-in";
  cyclePosition: "emergence" | "expansion" | "entrenchment" | "resolution-pressure";
  currentCondition: string;
  structuralShift: string;
  earlySignals: string[];
  systemicUptake: string[];
  latestDevelopments: string[];
  pressurePoints: string[];
  crossDomainEffects: string[];
  stabilitySignals: string[];
  signalAnchors: string[];
  primaryPath: string;
  alternatePaths: string[];
  priorities: string[];
  sensitivities: string[];
  visibilityNeeds: string[];
  executiveBriefGate: ExecutiveBriefOrientationGate;
  v2: BriefingStateV2;
}

export interface PresentationBriefSlide {
  title: string;
  bullets: string[];
  speakerNotes: string;
}

export interface PresentationBrief {
  slides: PresentationBriefSlide[];
}

export interface BoardOnePager {
  situationInBrief: string;
  whyThisMattersNow: string;
  whatHasShifted: string[];
  structuralReading: string;
  oversightPriorities: string[];
  signalBasis: string[];
  stabilitySignals: string[];
}

export type ExportMode = "executive-brief" | "presentation-brief" | "board-onepager";

export type ExportModuleKind =
  | "cover"
  | "summary-cards"
  | "kpi-strip"
  | "interpretation"
  | "takeaways"
  | "forward-paths"
  | "implications"
  | "timeline"
  | "development"
  | "strategic"
  | "evidence"
  | "cross-domain"
  | "containment"
  | "closing"
  | "title-slide"
  | "system-overview"
  | "scenario-paths"
  | "risk-monitoring"
  | "synthesis"
  | "board-topline"
  | "board-kpis"
  | "board-risks"
  | "board-evidence";

export type ExportModuleSize = "compact" | "standard" | "expanded";

export interface ExportModule {
  id: string;
  kind: ExportModuleKind;
  title: string;
  label?: string;
  size: ExportModuleSize;
  items?: string[];
  narrative?: string[];
  accent?: string;
  estimatedUnits: number;
  keepTogether?: boolean;
}

export interface ExportPagePlan {
  id: string;
  title: string;
  pageNumber: number;
  modules: ExportModule[];
  targetUnits: number;
  totalUnits: number;
}

export interface ExportDocumentPlan {
  mode: ExportMode;
  title: string;
  subtitle: string;
  pages: ExportPagePlan[];
  metadata: {
    scenarioName: string;
    asOf: string;
    phase: string;
    generatedAt: string;
    confidentialityLabel: string;
    currentViewName: string;
  };
}

export interface ExportQaIssue {
  severity: "warning" | "error";
  code:
    | "underfilled-page"
    | "overflow-risk"
    | "broken-module"
    | "widow-heading-risk"
    | "spacing-imbalance"
    | "contrast-risk";
  message: string;
  pageId: string;
}

export interface ExportQaReport {
  ok: boolean;
  issues: ExportQaIssue[];
}

export interface ExportPreviewPayload {
  mode: ExportMode;
  filename: string;
  orientation: "portrait" | "landscape";
  html: string;
  qa: ExportQaReport;
  metadata: ExportDocumentPlan["metadata"];
}
