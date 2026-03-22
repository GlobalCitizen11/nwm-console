import type { CanonicalEvidenceAnchor, CanonicalExportSummary, ExportSemanticData } from "../types/export";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const ensureSentence = (text: string) => {
  const normalized = clean(text).replace(/[;:]+$/g, "");
  if (!normalized) {
    return "";
  }
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
};

const complete = (text: string, fallback: string) => ensureSentence(text || fallback);

const joinParts = (parts: string[], fallback: string) =>
  ensureSentence(parts.map(clean).filter(Boolean).slice(0, 2).join(" ")) || ensureSentence(fallback);

const shortTitle = (text: string, fallback: string) => {
  const firstClause = clean(text)
    .replace(/^M\d+\s*[—-]\s*/i, "")
    .split(/[.!?]/)[0]
    ?.split(/,\s+/)[0]
    ?.trim();
  const words = (firstClause || fallback).split(/\s+/).slice(0, 6);
  return words.join(" ");
};

const shortSubtitle = (text: string, fallback: string) => {
  const source = clean(text).split(/[.!?]/)[0] || fallback;
  const words = source.split(/\s+/).slice(0, 8);
  return words.join(" ");
};

const buildEvidenceAnchors = (data: ExportSemanticData): CanonicalEvidenceAnchor[] =>
  data.evidenceAnchors.slice(0, 3).map((anchor, index) => ({
    id: anchor.id,
    shortTitle: shortTitle(anchor.headline, `Anchor ${index + 1}`),
    shortSubtitle: shortSubtitle(anchor.support || anchor.signalTag || "Observed signal", "Observed signal"),
  }));

export const buildCanonicalSummary = (data: ExportSemanticData): CanonicalExportSummary => {
  const state = data.sourceState;

  return {
    scenarioTitle: data.title,
    replayMonth: data.metadata.asOf,
    timestamp: data.metadata.generatedAt,
    confidentialityLabel: data.metadata.confidentiality,
    boundedWorld: data.metadata.boundedWorld,
    phase: data.metadata.phase,
    density: data.systemStats.find((stat) => stat.label === "Narrative Density")?.value ?? state.narrativeDensity,
    momentum: data.systemStats.find((stat) => stat.label === "Structural Momentum")?.value ?? state.structuralMomentum,
    reversibility: data.systemStats.find((stat) => stat.label === "Reversibility")?.value ?? state.reversibility,
    currentStateSummary: complete(
      `${state.currentCondition} The environment now behaves through persistent coordination rather than isolated disturbance.`,
      "The bounded world is now operating through persistent structural pressure.",
    ),
    dominantPathSummary: complete(
      state.primaryPath,
      "The dominant path continues to reinforce the current structural readout.",
    ),
    primaryPressureSummary: complete(
      state.pressurePoints[0] ?? state.structuralShift,
      "Pressure remains concentrated in the most active channels inside the boundary.",
    ),
    implicationsSummary: complete(
      state.priorities[0] ?? state.structuralShift,
      "Strategic implications are now moving from interpretation into operating consequence.",
    ),
    monitoringSummary: complete(
      state.visibilityNeeds[0] ?? state.sensitivities[0],
      "Monitoring should stay focused on the narrow signals that can change the read.",
    ),
    narrativeDevelopment: {
      earlySignalsSummary: joinParts(
        state.earlySignals,
        "Early signals first showed that the prior operating logic was losing explanatory power.",
      ),
      systemicUptakeSummary: joinParts(
        state.systemicUptake,
        "Systemic uptake widened as institutions and adjacent domains began responding to the same pressure.",
      ),
      currentStateFormationSummary: joinParts(
        state.latestDevelopments,
        "Recent developments converted the pattern into a durable operating condition.",
      ),
    },
    structuralInterpretationSummary: complete(
      `${state.structuralShift} ${state.crossDomainEffects[0] ?? ""}`,
      "The sequence now points to a structural transition with narrower room for reversal.",
    ),
    forwardOrientationSummary: complete(
      `${state.primaryPath} ${state.priorities[0] ?? ""}`,
      "The current trajectory favors a deeper version of the present operating condition.",
    ),
    alternatePathSummary: complete(
      state.alternatePaths[0] ?? "A credible alternate path would require structural interruption rather than rhetorical relief.",
      "A credible alternate path would require structural interruption rather than rhetorical relief.",
    ),
    strategicPositioningSummary: complete(
      `${state.priorities[0] ?? ""} ${state.sensitivities[0] ?? ""}`,
      "Executive posture should stay disciplined where sensitivity and structural pressure intersect.",
    ),
    watchpointSummary: complete(
      state.visibilityNeeds[0] ?? state.stabilitySignals[0],
      "The main watchpoint is whether pressure continues to compound through the same channels.",
    ),
    evidenceAnchorsCompact: buildEvidenceAnchors(data),
  };
};
