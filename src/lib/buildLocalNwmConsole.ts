import type {
  ArtifactRecord,
  ArtifactStateMappingRow,
  BriefingRawState,
  SourceType,
} from "../types";
import type { CanonicalExportSummary } from "../features/export/types/export";
import { buildCanonicalSummary } from "../features/export/utils/canonicalSummary";
import { normalizeExportData } from "../features/export/utils/normalizeExportData";
import {
  getAdjudicationStatusDisplay,
  getFrameworkDisplayLabel,
  getGateAdjudicationStatusDisplay,
  getPhaseResolutionReasonDisplay,
  SYSTEM_LABELS,
} from "./systemLabels";
import { extractBriefingState } from "../utils/briefingArtifacts";

export type LocalNwmConsoleTabId = "executive" | "one-pager";

export interface LocalNwmConsoleTab {
  id: LocalNwmConsoleTabId;
  label: string;
  text: string;
}

export interface LocalNwmConsolePayload {
  briefStatus: "Exportable" | "Withheld";
  validity: CanonicalExportSummary["executiveBriefGate"]["validity"];
  adjudicationStatus: string;
  withheldReason?: string;
  tabs: LocalNwmConsoleTab[];
}

const sourceTypeTitle: Record<SourceType, string> = {
  policy: "Policy",
  media: "Media",
  market: "Market",
  legal: "Legal",
  infrastructure: "Infrastructure",
  sovereign: "Sovereign",
};

const sourceTypeNoun: Record<SourceType, { singular: string; plural: string }> = {
  policy: { singular: "policy document", plural: "policy documents" },
  media: { singular: "media signal", plural: "media signals" },
  market: { singular: "market signal", plural: "market signals" },
  legal: { singular: "legal action", plural: "legal actions" },
  infrastructure: { singular: "infrastructure signal", plural: "infrastructure signals" },
  sovereign: { singular: "sovereign action", plural: "sovereign actions" },
};

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const sentence = (text: string) => {
  const normalized = clean(text).replace(/[.!?]+$/g, "").trim();
  return normalized ? `${normalized}.` : "";
};

const take = <T,>(items: T[], count: number) => items.slice(0, count);

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const joinList = (items: string[]) => {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const classifyVariable = (value: number) => {
  if (value >= 75) {
    return "High";
  }
  if (value >= 55) {
    return "Medium-High";
  }
  if (value >= 30) {
    return "Medium";
  }
  return "Low";
};

const buildArtifactSetSummary = (artifacts: ArtifactRecord[]) => {
  const counts = new Map<SourceType, number>();
  for (const artifact of artifacts) {
    counts.set(artifact.sourceType, (counts.get(artifact.sourceType) ?? 0) + 1);
  }

  const ordered = Array.from(counts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  if (ordered.length === 0) {
    return "No artifact set is visible yet.";
  }

  return sentence(
    `The current world read is anchored by ${joinList(
      ordered.map(([sourceType, count]) => `${count} ${count === 1 ? sourceTypeNoun[sourceType].singular : sourceTypeNoun[sourceType].plural}`),
    )}`,
  );
};

const pickContinuityEntries = (entries: CanonicalExportSummary["temporalSpine"]) => {
  if (entries.length <= 4) {
    return entries;
  }

  const indexes = unique([
    0,
    Math.floor((entries.length - 1) / 3),
    Math.floor(((entries.length - 1) * 2) / 3),
    entries.length - 1,
  ]).sort((left, right) => left - right);

  return indexes.map((index) => entries[index]!).slice(0, 4);
};

const buildContinuityLines = (entries: CanonicalExportSummary["temporalSpine"]) => {
  const selected = pickContinuityEntries(entries);
  if (selected.length === 0) {
    return ["T1: No temporal spine is available yet."];
  }

  return selected.map(
    (entry, index) =>
      `T${index + 1} (M${entry.month}): ${sentence(`${entry.summary} Phase ${entry.phase}`)}`,
  );
};

const buildArtifactTypeMappings = (artifacts: ArtifactRecord[], mappings: ArtifactStateMappingRow[]) => {
  const mappingById = new Map(mappings.map((mapping) => [mapping.artifactId, mapping]));
  const grouped = new Map<
    SourceType,
    {
      primaryFunctions: string[];
      stateEffects: string[];
      interpretiveRoles: string[];
    }
  >();

  for (const artifact of artifacts) {
    const current = grouped.get(artifact.sourceType) ?? {
      primaryFunctions: [],
      stateEffects: [],
      interpretiveRoles: [],
    };
    const mapping = mappingById.get(artifact.id);

    current.primaryFunctions.push(artifact.primaryFunction);
    if (mapping?.stateEffect) {
      current.stateEffects.push(mapping.stateEffect);
    }
    if (mapping?.interpretiveRole) {
      current.interpretiveRoles.push(mapping.interpretiveRole);
    }

    grouped.set(artifact.sourceType, current);
  }

  if (grouped.size === 0) {
    return ["- No artifact-to-state mapping is available yet."];
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([sourceType, group]) => {
      const primaryFunction = sentence(joinList(take(unique(group.primaryFunctions), 2))) || "No primary function resolved.";
      const stateEffect = sentence(joinList(take(unique(group.stateEffects), 2))) || "No state effect resolved.";
      const interpretiveRole = sentence(joinList(take(unique(group.interpretiveRoles), 2))) || "No interpretive role resolved.";
      return `- ${sourceTypeTitle[sourceType]}: Primary Function ${primaryFunction} State Effect ${stateEffect} Interpretive Role ${interpretiveRole}`;
    });
};

const getAuditStatuses = (summary: CanonicalExportSummary) => {
  const gate = summary.executiveBriefGate;
  const proofCheck = gate.checks.find((check) => check.id === "proof-object-sufficiency");
  const phaseCheck = gate.checks.find((check) => check.id === "phase-adjudication");
  const traceability =
    proofCheck?.passed
      ? "formal"
      : summary.artifactStateMapping.length > 0 || gate.proofTrace.visibleArtifactIds.length > 0
        ? "semi-structured"
        : "manual";
  const stateDerivation =
    summary.stateVector.basis === "deterministic-replay" && summary.artifactStateMapping.length > 0
      ? "formal"
      : summary.artifactSetSummary
        ? "semi-structured"
        : "manual";
  const phaseAdjudication = phaseCheck?.passed ? SYSTEM_LABELS.PAL : "Interpretive only";
  const proofObjectStatus = summary.proofScaffolds.every((scaffold) => scaffold.proofStatus === "pre-governance-grade")
    ? "pre-governance-grade"
    : "governance-grade";

  return {
    traceability,
    stateDerivation,
    phaseAdjudication,
    proofObjectStatus,
  };
};

const buildAuditText = (
  summary: CanonicalExportSummary,
  artifacts: ArtifactRecord[],
) => {
  const audit = getAuditStatuses(summary);
  const gate = summary.executiveBriefGate;

  return [
    "10. TRACEABILITY + AUDIT LAYER",
    "Artifact -> State Mapping",
    ...buildArtifactTypeMappings(artifacts, summary.artifactStateMapping),
    "",
    "Audit Status",
    `- Traceability: ${audit.traceability}`,
    `- State Derivation: ${audit.stateDerivation}`,
    `- ${SYSTEM_LABELS.PAL}: ${audit.phaseAdjudication}`,
    `- Proof Object Status: ${audit.proofObjectStatus}`,
    `- Linkage: artifacts ${joinList(gate.proofTrace.visibleArtifactIds) || "none"} -> transitions ${joinList(gate.proofTrace.transitionIds) || "none"} -> proofs ${joinList(gate.proofTrace.proofIds) || "none"}.`,
    `- Review States: ${joinList(gate.proofTrace.reviewStates) || "none"}.`,
    `- Challenge States: ${joinList(gate.proofTrace.challengeStates) || "none"}.`,
  ].join("\n");
};

const buildExecutiveText = (
  rawState: BriefingRawState,
  summary: CanonicalExportSummary,
  artifactSetSummary: string,
  adjudicationStatus: LocalNwmConsolePayload["adjudicationStatus"],
  auditText: string,
) => {
  const gate = summary.executiveBriefGate;
  const phaseCheck = gate.checks.find((check) => check.id === "phase-adjudication");
  const systemNote =
    gate.validity === "Structurally Valid"
      ? "The current bounded world clears the orientation gate, so this read holds as an export-grade Executive Brief."
      : `The current bounded world is readable, but the orientation gate remains incomplete for an export-grade Executive Brief. ${sentence(
          `Unmet conditions are ${joinList(gate.unmetRequirements) || "not yet fully resolved"}`,
        )}`;

  const lines = [
    "EXECUTIVE BRIEF",
    `Scenario: ${rawState.scenarioName}`,
    `Bounded World: ${summary.boundedWorld}`,
    `Mode: ${gate.mode} (${getFrameworkDisplayLabel(gate.framework)})`,
    `Executive Brief Status: ${gate.validity === "Structurally Valid" ? "Exportable" : "Withheld"}`,
    `Validity: ${gate.validity}`,
    `As Of: ${summary.replayMonth}`,
    "",
    "1. STATE AT A GLANCE",
    sentence(`${systemNote} ${summary.currentStateSummary}`),
    sentence(`${summary.dominantPathSummary} ${summary.structuralInterpretationSummary}`),
    "",
    "2. BOUNDED WORLD DEFINITION",
    `Domain: ${rawState.result.world.domain}.`,
    `Scope: Included entities are ${joinList(gate.boundaryDefinition.includedEntities) || rawState.result.world.name}; excluded entities are ${joinList(gate.boundaryDefinition.excludedEntities) || "not yet explicit"}.`,
    `Timeframe: ${gate.boundaryDefinition.temporalWindow.start} to ${gate.boundaryDefinition.temporalWindow.end} at ${gate.boundaryDefinition.temporalWindow.resolution.toLowerCase()} resolution; current replay read is ${gate.boundaryDefinition.temporalWindow.current}.`,
    `Artifact Set: ${artifactSetSummary}`,
    sentence(`Artifact inclusion criteria remain ${joinList(gate.boundaryDefinition.artifactInclusionCriteria) || "undefined"}`),
    "",
    "3. SYSTEM STATE OVERVIEW",
    sentence(`${summary.currentStateSummary} ${summary.primaryPressureSummary}`),
    sentence(`${summary.implicationsSummary} ${summary.traceabilitySummary}`),
    "",
    "4. NARRATIVE DEVELOPMENT (ARTIFACT-GROUNDED)",
    sentence(`${artifactSetSummary} ${summary.narrativeDevelopment.earlySignalsSummary}`),
    sentence(summary.narrativeDevelopment.systemicUptakeSummary),
    sentence(summary.narrativeDevelopment.currentStateFormationSummary),
    "",
    "5. STATE VARIABLES",
    `Velocity: ${classifyVariable(summary.stateVector.velocity)} (${summary.stateVector.velocity.toFixed(1)})`,
    `Density: ${classifyVariable(summary.stateVector.density)} (${summary.stateVector.density.toFixed(1)})`,
    `Coherence: ${classifyVariable(summary.stateVector.coherence)} (${summary.stateVector.coherence.toFixed(1)})`,
    `Reversibility: ${classifyVariable(summary.stateVector.reversibility)} (${summary.stateVector.reversibility.toFixed(1)})`,
    "",
    "6. PHASE RESOLUTION",
    `Phase: ${summary.phaseResolution.phase}`,
    `Adjudication Status: ${adjudicationStatus}`,
    sentence(phaseCheck?.detail ?? getPhaseResolutionReasonDisplay(summary.phaseResolution.rationale)),
    "",
    "7. TEMPORAL CONTINUITY",
    ...buildContinuityLines(summary.temporalSpine),
    "",
    "8. FORWARD ORIENTATION (CONDITIONAL ONLY)",
    sentence(summary.forwardOrientationSummary),
    sentence(summary.alternatePathSummary),
    "",
    auditText,
  ];

  if (!phaseCheck?.passed) {
    lines.push(
      "",
      "11. PRE-GCS SENSITIVITY LAYER",
      "Primary Sensitivities",
      ...summary.preGcsSensitivity.primarySensitivities.map((item) => `- ${item}`),
      "Counterweight Conditions",
      ...summary.preGcsSensitivity.counterweightConditions.map((item) => `- ${item}`),
      "Non-Effect Zones",
      ...summary.preGcsSensitivity.nonEffectZones.map((item) => `- ${item}`),
      "Reversibility Constraints",
      ...summary.preGcsSensitivity.reversibilityConstraints.map((item) => `- ${item}`),
    );
  }

  return lines.join("\n");
};

const buildBoardText = (
  rawState: BriefingRawState,
  summary: CanonicalExportSummary,
  adjudicationStatus: LocalNwmConsolePayload["adjudicationStatus"],
) =>
  [
    "ONE-PAGER",
    `Scenario: ${rawState.scenarioName}`,
    `As Of: ${summary.replayMonth}`,
    "",
    "9. ONE-PAGER",
    "Current State",
    sentence(summary.currentStateSummary),
    "Structural Reality",
    sentence(summary.dominantPathSummary),
    "Key Drivers",
    `- ${sentence(summary.primaryPressureSummary)}`,
    `- ${sentence(summary.artifactSetSummary)}`,
    `- ${sentence(summary.traceabilitySummary)}`,
    "Immediate Implications",
    `- ${sentence(summary.implicationsSummary)}`,
    `- ${sentence(summary.proofSummary)}`,
    `- ${sentence(
      `State vector remains at density ${summary.stateVector.density.toFixed(1)}, coherence ${summary.stateVector.coherence.toFixed(1)}, and reversibility ${summary.stateVector.reversibility.toFixed(1)}`,
    )}`,
    "What to Watch",
    `- ${sentence(summary.monitoringSummary)}`,
    `- ${sentence(summary.watchpointSummary)}`,
    ...summary.preGcsSensitivity.primarySensitivities.slice(0, 1).map((item) => `- ${sentence(item)}`),
    "Adjudication Status",
    `${adjudicationStatus}. ${sentence(getPhaseResolutionReasonDisplay(summary.phaseResolution.rationale))}`,
  ].join("\n");

export function buildLocalNwmConsolePayload(rawState: BriefingRawState): LocalNwmConsolePayload {
  const state = extractBriefingState(rawState);
  const summary = buildCanonicalSummary(normalizeExportData(state, rawState.currentView.name));
  const gate = summary.executiveBriefGate;
  const phaseCheck = gate.checks.find((check) => check.id === "phase-adjudication");
  const adjudicationStatus: LocalNwmConsolePayload["adjudicationStatus"] =
    getGateAdjudicationStatusDisplay(Boolean(phaseCheck?.passed));
  const briefStatus: LocalNwmConsolePayload["briefStatus"] =
    gate.validity === "Structurally Valid" ? "Exportable" : "Withheld";
  const withheldReason = gate.unmetRequirements.length > 0 ? gate.unmetRequirements.join(", ") : undefined;
  const artifactSetSummary = buildArtifactSetSummary(state.v2.artifactRecords);
  const auditText = buildAuditText(summary, state.v2.artifactRecords);
  const executiveText = buildExecutiveText(rawState, summary, artifactSetSummary, adjudicationStatus, auditText);
  const boardText = buildBoardText(rawState, summary, adjudicationStatus);

  return {
    briefStatus,
    validity: gate.validity,
    adjudicationStatus,
    withheldReason,
    tabs: [
      { id: "executive", label: "Executive Brief", text: executiveText },
      { id: "one-pager", label: "One Pager", text: boardText },
    ],
  };
}
