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
    .replace(
      /^(pressure is concentrated in|monitoring should stay fixed on|decision posture should stay disciplined where|the main watchpoint is whether|that pressure is now shaping|visibility is needed on|what matters most is)\s+/i,
      "",
    )
    .replace(/^(whether|recent developments such as)\s+/i, "")
    .replace(/\b(visibility is needed on|what matters most is|monitoring should stay fixed on)\b/gi, "")
    .replace(/^M\d+\s+/i, "")
    .replace(/\b(the|a|an)\b/gi, " ")
    .replace(/[()]/g, " ")
    .replace(/[^A-Za-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const resolved = source && !/^(on|whether|where)$/i.test(source) ? source : fallback;
  return takeWords(resolved, count) || fallback;
};

const monthLabel = (text: string | undefined, fallback = "the earliest interval") => {
  const match = clean(text ?? "").match(/\bM\d+\b/i);
  return match ? match[0].toUpperCase() : fallback;
};

const cleanEventPhrase = (text: string | undefined, fallback: string, count = 6) => {
  const source = pickClause(text ?? "")
    .replace(/^M\d+\s+/i, "")
    .replace(/\bU\.?\s*S\.?\b/gi, "US")
    .replace(/\(([^)]*)\)/g, " ")
    .replace(/^(expanded|expansion|contracted|widening|accelerating|deepening|broadening|heightened)\s+/i, "")
    .replace(/\b(expanded|contracted)\s+[A-Z]\b/g, "")
    .replace(/\b[A-Z]\b/g, " ")
    .replace(/[^A-Za-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = source
    .replace(/^(us\s+)?(export controls?|guidance|litigation|records)\b/i, (match) => match.trim())
    .trim();
  const resolved =
    normalized &&
    normalized.length > 6 &&
    !/^(expanded|contracted|widening|accelerating|deepening|broadening|heightened)\b/i.test(normalized)
      ? normalized
      : fallback;
  return takeWords(resolved, count);
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
  const earlySignalMonth = monthLabel(state.earlySignals[0]);
  const earlySignalEvent = cleanEventPhrase(state.earlySignals[0], "the first visible boundary break", 7);
  const systemicUptakeEvent = cleanEventPhrase(state.systemicUptake[0], "institutions and adjacent domains", 7);
  const sensitivitySubject = compactPhrase(state.sensitivities[0], "exposure and timing", 5);

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
        `The earliest signals appeared by ${earlySignalMonth}, when ${earlySignalEvent} began to shift the boundary condition`,
      ),
      systemicUptakeSummary: sentence(
        `Systemic uptake widened through ${systemicUptakeEvent}, which spread the read across adjacent institutions`,
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
      `Decision posture should stay disciplined where ${sensitivitySubject} is most exposed`,
    ),
    watchpointSummary: sentence(`The main watchpoint is whether ${watchpointSubject} begins to change`),
    evidenceAnchorsCompact: evidenceSource.slice(0, 3).map(buildEvidenceAnchor),
  };
};
