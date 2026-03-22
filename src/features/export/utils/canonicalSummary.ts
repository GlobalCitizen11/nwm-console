import type { CanonicalEvidenceAnchor, CanonicalExportSummary, ExportSemanticData } from "../types/export";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const DISALLOWED_ENDINGS = /\b(and|which|because|with|the|one|one of|of|to|for|in|on|a|an)$/i;

const stripTerminal = (text: string) => clean(text).replace(/[.!?]+$/g, "").trim();

const ensureSentence = (text: string) => {
  const normalized = stripTerminal(text).replace(/[;:]+$/g, "").trim();
  if (!normalized) {
    return "";
  }
  const repaired = DISALLOWED_ENDINGS.test(normalized) ? normalized.replace(DISALLOWED_ENDINGS, "").trim() : normalized;
  return repaired ? `${repaired}.` : "";
};

const sentence = (...parts: string[]) => ensureSentence(parts.filter(Boolean).map((part) => stripTerminal(part)).join(" "));

const takeWords = (text: string, count: number) => clean(text).split(/\s+/).filter(Boolean).slice(0, count).join(" ");

const pickClause = (text: string) =>
  clean(text)
    .split(/[.!?]/)[0]
    ?.split(/[;:]/)[0]
    ?.split(/,\s+/)[0]
    ?.trim() ?? "";

const compactPhrase = (text: string | undefined, fallback: string, count = 5) => {
  const source = pickClause(text ?? "")
    .replace(/^(the system|the world|the environment|current state|latest shift|dominant path|monitoring)\s+(is|shows|remains|stays)\s+/i, "")
    .replace(/\b(the|a|an)\b/gi, " ")
    .replace(/[()]/g, " ")
    .replace(/[^A-Za-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return takeWords(source || fallback, count) || fallback;
};

const titleCase = (text: string) =>
  clean(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const buildEvidenceAnchor = (text: string, index: number): CanonicalEvidenceAnchor => {
  const month = text.match(/M\d+/i)?.[0]?.toUpperCase() ?? `M${index + 11}`;
  const withoutMonth = pickClause(text).replace(/^M\d+\s*[—-]?\s*/i, "");
  const title = titleCase(takeWords(withoutMonth || `Signal anchor ${index + 1}`, 4));
  const subtitleSource = clean(text)
    .replace(/^M\d+\s*[—-]?\s*/i, "")
    .replace(withoutMonth, "")
    .replace(/[.:;]+/g, " ")
    .trim();
  const subtitle = titleCase(takeWords(subtitleSource || "Observed boundary signal", 5));

  return {
    id: `${month}-${index}`,
    shortTitle: `${month} — ${title}`,
    shortSubtitle: subtitle || "Observed Boundary Signal",
  };
};

export const buildCanonicalSummary = (data: ExportSemanticData): CanonicalExportSummary => {
  const state = data.sourceState;
  const pressureSubject = compactPhrase(state.pressurePoints[0] ?? state.structuralShift, "infrastructure control");
  const prioritySubject = compactPhrase(state.priorities[0] ?? state.structuralShift, "coordination and allocation");
  const monitoringSubject = compactPhrase(
    state.visibilityNeeds[0] ?? state.sensitivities[0] ?? state.stabilitySignals[0],
    "coordination thresholds",
    6,
  );
  const watchpointSubject = compactPhrase(state.visibilityNeeds[0] ?? state.stabilitySignals[0], "pressure transmission", 5);

  const evidenceSource = [
    ...state.signalAnchors.slice(0, 3),
    ...data.evidenceAnchors.slice(0, 3).map((anchor) => `${anchor.headline}. ${anchor.support}`),
  ].filter(Boolean);

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
    currentStateSummary: `${sentence(`The system is operating in ${data.metadata.phase}`)} ${sentence(
      `Narrative density is ${state.narrativeDensity}`,
    )}`,
    dominantPathSummary: sentence(
      `${state.structuralMomentum.charAt(0).toUpperCase()}${state.structuralMomentum.slice(1)} behavior is likely to deepen without a stabilizing interruption`,
    ),
    primaryPressureSummary: sentence(`Pressure is concentrated in ${pressureSubject}`),
    implicationsSummary: sentence(`That pressure is now shaping ${prioritySubject}`),
    monitoringSummary: sentence(`Monitoring should stay fixed on ${monitoringSubject}`),
    narrativeDevelopment: {
      earlySignalsSummary: sentence(
        `Early signals first appeared around ${compactPhrase(state.earlySignals[0], "coordination stress", 5)}`,
      ),
      systemicUptakeSummary: sentence(
        `Systemic uptake widened across ${compactPhrase(state.systemicUptake[0], "institutions and adjacent domains", 5)}`,
      ),
      currentStateFormationSummary: sentence(
        `Recent developments turned the pattern into an operating condition inside the boundary`,
      ),
    },
    structuralInterpretationSummary: `${sentence(
      "The sequence now carries structural meaning",
    )} ${sentence(`Reversibility is ${state.reversibility}`)}`,
    forwardOrientationSummary: sentence(
      `The next interval favors deeper ${state.structuralMomentum} behavior across the boundary`,
    ),
    alternatePathSummary: sentence("A credible alternate path requires a visible break in coordination"),
    strategicPositioningSummary: sentence(
      `Decision posture should stay disciplined where ${compactPhrase(state.sensitivities[0], "exposure and timing", 5)} is most exposed`,
    ),
    watchpointSummary: sentence(`The main watchpoint is whether ${watchpointSubject} begins to change`),
    evidenceAnchorsCompact: evidenceSource.slice(0, 3).map(buildEvidenceAnchor),
  };
};
