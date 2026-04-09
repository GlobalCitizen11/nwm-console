import type {
  ArtifactRecord,
  ArtifactStateMappingRow,
  ArtifactStructuralRole,
  BriefingRawState,
  BriefingStateV2,
  NarrativeEvent,
  PhaseResolutionV2,
  PreGCSSensitivityLayer,
  ProofObjectScaffold,
  StateVectorV2,
  StructuralEffect,
  TemporalSpineEntry,
  TransitionRecord,
} from "../types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const joinList = (items: string[]) => {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const sentence = (text: string) => {
  const normalized = clean(text).replace(/[.!?]+$/g, "").trim();
  return normalized ? `${normalized}.` : "";
};

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const take = <T,>(items: T[], count: number) => items.slice(0, count);

const earliestMonth = (events: NarrativeEvent[]) =>
  events.reduce((min, event) => Math.min(min, event.month), Number.POSITIVE_INFINITY);

const summarize = (text: string, fallback: string) => {
  const picked =
    clean(text)
      .split(/[.!?]/)[0]
      ?.trim() ?? "";
  return picked || fallback;
};

const structuralRoleLabel: Record<ArtifactStructuralRole, string> = {
  "world-definition": "world-definition anchor",
  burden: "burden-bearing signal",
  infrastructure: "infrastructure constraint signal",
  reinforcement: "reinforcement signal",
  counterweight: "counterweight signal",
};

const determineStructuralRole = (
  event: NarrativeEvent,
  firstMonth: number,
): ArtifactStructuralRole => {
  if (event.month === firstMonth) {
    return "world-definition";
  }
  if (event.sourceType === "infrastructure") {
    return "infrastructure";
  }
  if (event.structuralEffect === "destabilize") {
    return "burden";
  }
  if (event.structuralEffect === "reinforce" && event.metrics.reversibility >= 60) {
    return "counterweight";
  }
  if (event.structuralEffect === "reinforce") {
    return "reinforcement";
  }
  return "burden";
};

const determinePrimaryFunction = (event: NarrativeEvent, role: ArtifactStructuralRole) => {
  if (role === "world-definition") {
    return "bounded-world framing";
  }
  if (role === "infrastructure") {
    return "infrastructure pressure anchoring";
  }
  if (role === "counterweight") {
    return "counterweight condition signal";
  }
  if (event.structuralEffect === "reclassify") {
    return "state reclassification signal";
  }
  if (event.structuralEffect === "reinforce") {
    return "structural reinforcement";
  }
  return "burden concentration";
};

const buildStateEffectSummary = (event: NarrativeEvent, role: ArtifactStructuralRole) => {
  if (role === "infrastructure") {
    return "Raises density around infrastructure constraint and compresses reversibility.";
  }
  if (role === "counterweight") {
    return "Adds coherence and preserves remaining reversibility.";
  }
  if (event.structuralEffect === "reclassify") {
    return "Raises density and coherence, shifting the world interpretation.";
  }
  if (event.structuralEffect === "reinforce") {
    return "Reinforces the current state and steadies the active interpretation.";
  }
  return "Raises pressure and reduces the room for reversal.";
};

const buildInterpretiveRole = (event: NarrativeEvent, role: ArtifactStructuralRole) => {
  if (role === "world-definition") {
    return "Defines the world boundary and initial narrative posture.";
  }
  if (role === "infrastructure") {
    return "Anchors the read in physical constraint rather than abstract framing.";
  }
  if (role === "counterweight") {
    return "Provides the clearest available counterweight to unilateral burden accumulation.";
  }
  if (event.structuralEffect === "reclassify") {
    return "Pushes the system from topical signal into structural condition.";
  }
  if (event.structuralEffect === "reinforce") {
    return "Confirms the current state without materially changing the world definition.";
  }
  return "Concentrates burden and makes the active read harder to ignore.";
};

export const buildArtifactRecord = (
  event: NarrativeEvent,
  firstMonth: number,
): ArtifactRecord => {
  const structuralRole = determineStructuralRole(event, firstMonth);
  const primaryFunction = determinePrimaryFunction(event, structuralRole);

  return {
    id: event.id,
    sourceType: event.sourceType,
    title: event.title,
    summary: summarize(event.description, event.title),
    observedAt: `M${event.month}`,
    eventTime: `M${event.month}`,
    domainTags: event.domainTags,
    primaryFunction,
    stateEffects: {
      velocity: event.metrics.velocity,
      density: event.metrics.density,
      coherence: event.metrics.coherence,
      reversibility: event.metrics.reversibility,
    },
    structuralRole,
  };
};

export const buildArtifactRecords = (events: NarrativeEvent[]): ArtifactRecord[] => {
  const firstMonth = earliestMonth(events);
  return events.map((event) => buildArtifactRecord(event, Number.isFinite(firstMonth) ? firstMonth : event.month));
};

export const buildStateVectorV2 = (
  point: BriefingRawState["point"],
  artifactRecords: ArtifactRecord[],
): StateVectorV2 => {
  const artifactDensityScore = clamp(artifactRecords.length * 9);
  const confidence = Number((artifactDensityScore * 0.45 + point.metrics.coherence * 0.55).toFixed(1));

  return {
    velocity: point.metrics.velocity,
    density: point.metrics.density,
    coherence: point.metrics.coherence,
    reversibility: point.metrics.reversibility,
    confidence,
    basis: "deterministic-replay",
  };
};

const latestVisibleTransition = (
  transitions: TransitionRecord[],
  month: number,
  phase: string,
) =>
  [...transitions]
    .filter((transition) => transition.month <= month && transition.toPhase === phase)
    .sort((left, right) => right.month - left.month)[0] ??
  [...transitions]
    .filter((transition) => transition.month <= month)
    .sort((left, right) => right.month - left.month)[0] ??
  null;

export const buildPhaseResolutionV2 = (
  point: BriefingRawState["point"],
  transitions: TransitionRecord[],
): PhaseResolutionV2 => {
  const transition = latestVisibleTransition(transitions, point.month, point.phase);

  return {
    phase: point.phase,
    adjudicationStatus: "pal-like-threshold",
    rationale:
      transition?.proof.rationale ??
      "Current phase is resolved through deterministic threshold adjudication rather than institutional PAL.",
    thresholdConditions:
      transition?.proof.thresholdConditions ??
      ["No phase-transition proof is yet visible for the current replay point."],
  };
};

export const buildProofObjectScaffold = (
  transition: TransitionRecord,
): ProofObjectScaffold => ({
  proofStatus: "pre-governance-grade",
  linkedTransition: transition.id,
  artifactIds: transition.triggeringArtifacts.map((artifact) => artifact.id),
  thresholdConditions: transition.proof.thresholdConditions,
  quantitativeDeltas: transition.proof.quantitativeDeltas,
  rationale: transition.proof.rationale,
  uncertainty: transition.proof.uncertaintyScore,
  auditHash: transition.proof.auditHash,
  oversightState: {
    reviewState: transition.proof.oversight.reviewState,
    challengeStatus: transition.proof.challengeStatus,
  },
});

export const buildProofObjectScaffolds = (
  transitions: TransitionRecord[],
  month: number,
): ProofObjectScaffold[] =>
  transitions
    .filter((transition) => transition.month <= month)
    .map(buildProofObjectScaffold);

export const buildArtifactStateMapping = (
  artifacts: ArtifactRecord[],
): ArtifactStateMappingRow[] =>
  artifacts.map((artifact) => ({
    artifactId: artifact.id,
    artifact: artifact.title,
    primaryFunction: artifact.primaryFunction,
    stateEffect: buildStateEffectSummary(
      {
        id: artifact.id,
        month: Number(artifact.eventTime.replace(/^M/, "")),
        label: artifact.id,
        title: artifact.title,
        description: artifact.summary,
        sourceType: artifact.sourceType,
        domainTags: artifact.domainTags,
        structuralEffect:
          artifact.structuralRole === "reinforcement" || artifact.structuralRole === "counterweight"
            ? "reinforce"
            : artifact.structuralRole === "infrastructure" || artifact.structuralRole === "burden"
              ? "destabilize"
              : "reclassify",
        metrics: artifact.stateEffects,
        phase: "",
        haloColor: "",
      },
      artifact.structuralRole,
    ),
    interpretiveRole: buildInterpretiveRole(
      {
        id: artifact.id,
        month: Number(artifact.eventTime.replace(/^M/, "")),
        label: artifact.id,
        title: artifact.title,
        description: artifact.summary,
        sourceType: artifact.sourceType,
        domainTags: artifact.domainTags,
        structuralEffect:
          artifact.structuralRole === "reinforcement" || artifact.structuralRole === "counterweight"
            ? "reinforce"
            : artifact.structuralRole === "infrastructure" || artifact.structuralRole === "burden"
              ? "destabilize"
              : "reclassify",
        metrics: artifact.stateEffects,
        phase: "",
        haloColor: "",
      },
      artifact.structuralRole,
    ),
  }));

const dominantEffectAtMonth = (events: NarrativeEvent[]): StructuralEffect => {
  const counts = new Map<StructuralEffect, number>();
  for (const event of events) {
    counts.set(event.structuralEffect, (counts.get(event.structuralEffect) ?? 0) + 1);
  }
  return (
    Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "reinforce"
  );
};

export const buildTemporalSpine = (
  rawState: BriefingRawState,
  visibleEvents: NarrativeEvent[],
): TemporalSpineEntry[] => {
  const transitionMonths = rawState.result.transitions
    .filter((transition) => transition.month <= rawState.point.month)
    .map((transition) => transition.month);
  const candidateMonths = unique([
    ...(visibleEvents.length > 0 ? [visibleEvents[0]!.month] : []),
    ...transitionMonths,
    rawState.point.month,
  ])
    .sort((left, right) => left - right)
    .slice(0, 5);

  return candidateMonths.map((month, index) => {
    const eventsAtMonth = visibleEvents.filter((event) => event.month === month);
    const dominantEffect = dominantEffectAtMonth(eventsAtMonth);
    const titles = take(eventsAtMonth.map((event) => event.title), 2);

    return {
      id: `temporal-spine-${index + 1}`,
      label: `T${index + 1}`,
      month,
      phase: rawState.result.timeline[Math.min(month, rawState.result.timeline.length - 1)]?.phase ?? rawState.point.phase,
      artifactIds: eventsAtMonth.map((event) => event.id),
      structuralEffect: dominantEffect,
      summary: sentence(
        titles.length > 0
          ? `M${month} centers on ${joinList(titles)} and carries a ${dominantEffect} effect`
          : `M${month} marks a replay checkpoint inside the current state spine`,
      ),
    };
  });
};

export const buildPreGCSSensitivityLayer = (
  stateVector: StateVectorV2,
  artifacts: ArtifactRecord[],
  phaseResolution: PhaseResolutionV2,
): PreGCSSensitivityLayer => {
  const roleCounts = new Map<ArtifactStructuralRole, number>();
  for (const artifact of artifacts) {
    roleCounts.set(artifact.structuralRole, (roleCounts.get(artifact.structuralRole) ?? 0) + 1);
  }

  const topRoles = Array.from(roleCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([role]) => structuralRoleLabel[role]);
  const burdenLoad = (roleCounts.get("burden") ?? 0) + (roleCounts.get("infrastructure") ?? 0);
  const counterweightLoad = (roleCounts.get("counterweight") ?? 0) + (roleCounts.get("reinforcement") ?? 0);
  const reversibilityBand =
    stateVector.reversibility >= 65
      ? "high"
      : stateVector.reversibility >= 40
        ? "conditional"
        : stateVector.reversibility >= 20
          ? "low"
          : "locked-in";

  return {
    enabled: true,
    reason: "phase adjudication is threshold-based, not formal PAL",
    provisionalLabel: "pre-gcs",
    primarySensitivities: take(
      unique([
        sentence(
          `The current read is most sensitive to additional ${joinList(topRoles.slice(0, 2)) || "burden"} artifacts because density is ${stateVector.density.toFixed(1)} and confidence is ${stateVector.confidence.toFixed(1)}`,
        ),
        sentence(
          burdenLoad >= counterweightLoad
            ? "Burden and infrastructure records currently outweigh counterweight records in the visible artifact set"
            : "Counterweight records remain visible enough to keep the current state sensitive to coherence changes",
        ),
      ]),
      3,
    ),
    counterweightConditions: take(
      unique([
        sentence("A material counterweight condition requires artifacts that raise coherence without compressing reversibility"),
        sentence(
          phaseResolution.thresholdConditions.length > 0
            ? `Any read shift still has to matter against the current threshold stack: ${phaseResolution.thresholdConditions[0]}`
            : "Any read shift has to alter the current threshold stack rather than restate existing framing",
        ),
      ]),
      3,
    ),
    nonEffectZones: take(
      unique([
        sentence("Artifacts that repeat existing framing without changing state-vector pressure are non-effective"),
        sentence("Single-source echoes that do not alter cross-domain spread remain outside the highest-impact zone"),
      ]),
      3,
    ),
    reversibilityConstraints: take(
      unique([
        sentence(`Current reversibility is ${reversibilityBand}, which constrains how easily additional artifacts can change the read`),
        sentence(
          reversibilityBand === "high" || reversibilityBand === "conditional"
            ? "The system still retains some room for interruption, but only if new artifacts alter coherence and density together"
            : "Low reversibility means counterweight artifacts must do more than slow the current pattern to matter structurally",
        ),
      ]),
      3,
    ),
  };
};

export const buildBriefingStateV2 = (
  rawState: BriefingRawState,
): BriefingStateV2 => {
  // Provisional V2 wrapper. This formalizes the current deterministic replay outputs without replacing the engines beneath them.
  const visibleEvents = [...rawState.point.visibleEvents].sort(
    (left, right) => left.month - right.month || left.title.localeCompare(right.title),
  );
  const artifactRecords = buildArtifactRecords(visibleEvents);
  const stateVector = buildStateVectorV2(rawState.point, artifactRecords);
  const phaseResolution = buildPhaseResolutionV2(rawState.point, rawState.result.transitions);
  const proofScaffolds = buildProofObjectScaffolds(rawState.result.transitions, rawState.point.month);
  const artifactStateMapping = buildArtifactStateMapping(artifactRecords);
  const temporalSpine = buildTemporalSpine(rawState, visibleEvents);
  const preGcsSensitivity = buildPreGCSSensitivityLayer(stateVector, artifactRecords, phaseResolution);
  const sourceClasses = unique(artifactRecords.map((artifact) => artifact.sourceType));
  const topRoles = unique(artifactRecords.map((artifact) => structuralRoleLabel[artifact.structuralRole]));

  return {
    artifactSetSummary: sentence(
      `${artifactRecords.length} normalized artifacts are visible across ${sourceClasses.length} source classes, with roles concentrated in ${joinList(topRoles.slice(0, 3)) || "the current bounded world"}`,
    ),
    artifactRecords,
    stateVector,
    phaseResolution,
    proofScaffolds,
    artifactStateMapping,
    temporalSpine,
    preGcsSensitivity,
  };
};
