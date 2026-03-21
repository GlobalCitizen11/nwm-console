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
