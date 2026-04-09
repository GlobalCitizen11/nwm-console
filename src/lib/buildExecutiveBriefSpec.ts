import type { CanonicalEvidenceAnchor, CanonicalExportSummary } from "../features/export/types/export";
import type { VoiceBriefIntelligence, VoiceBriefTranscriptIntelligence } from "../types/voiceBriefIntelligence";
import { getFrameworkDisplayLabel, SYSTEM_DISPLAY_LABELS, SYSTEM_LABELS } from "./systemLabels";
import type {
  ExecutiveBriefFieldPack,
  ExecutiveBriefRenderedSectionMapping,
  ExecutiveBriefSourceIntelligence,
  ExecutiveBriefSpec,
  ExecutiveEvidenceItem,
  FieldRule,
} from "../types/executiveBriefSpec";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const words = (text: string) => clean(text).split(/\s+/).filter(Boolean);
const stripTerminal = (text: string) => clean(text).replace(/[.!?]+$/g, "").trim();
const lower = (text: string) => clean(text).toLowerCase();

function finalizeSentence(text: string) {
  const normalized = stripTerminal(text).replace(/[;:]+$/g, "").trim();
  return normalized ? `${normalized}.` : "";
}

function trimToMaxWords(text: string, maxWords: number) {
  const source = words(text);
  if (source.length <= maxWords) {
    return finalizeSentence(source.join(" "));
  }
  return finalizeSentence(source.slice(0, maxWords).join(" "));
}

function withinRange(text: string, minWords: number, maxWords: number) {
  const source = words(text);
  if (source.length >= minWords && source.length <= maxWords) {
    return finalizeSentence(source.join(" "));
  }
  if (source.length > maxWords) {
    return finalizeSentence(source.slice(0, maxWords).join(" "));
  }
  return finalizeSentence(source.join(" "));
}

function composeWithinRange(parts: string[], minWords: number, maxWords: number) {
  return withinRange(
    parts
      .map((part) => clean(part))
      .filter(Boolean)
      .join(" "),
    minWords,
    maxWords,
  );
}

function clause(text: string, fallback: string) {
  const picked = clean(text)
    .split(/[.!?]/)[0]
    ?.split(/[;:]/)[0]
    ?.trim();
  return picked || fallback;
}

function joinList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function makeFieldRule<T>(
  value: T,
  config: Omit<FieldRule<T>, "value">,
): FieldRule<T> {
  return { value, ...config };
}

function anchorToEvidence(anchor: CanonicalEvidenceAnchor, traceRef?: string): ExecutiveEvidenceItem {
  const compact = clean(`${anchor.shortTitle} ${anchor.shortSubtitle}`);
  const normalized = compact
    .replace(/^M\d+(?:-\d+)?\s+[—-]\s+/i, "")
    .replace(/\bStructural Reclassification\b/i, "Structural reclassification tightened cross-border constraint")
    .replace(/\bFragmented Regime\b/i, "Fragmented regime formalized operating fragmentation")
    .replace(/\bSemiconductor Shock\b/i, "Semiconductor supply shock repriced critical access");

  let signal = trimToMaxWords(normalized, 14);
  let significance = trimToMaxWords("This anchor confirms that operating constraint has become active rather than rhetorical.", 12);

  if (/reclassification/i.test(signal)) {
    signal = trimToMaxWords("Structural reclassification tightened cross-border constraint.", 14);
    significance = trimToMaxWords("Constraint moved from friction into enforceable boundary condition.", 12);
  } else if (/fragmented regime/i.test(signal)) {
    signal = trimToMaxWords("Fragmented regime formalized bloc-level operating separation.", 14);
    significance = trimToMaxWords("Fragmentation became governing structure, not a temporary dispute.", 12);
  } else if (/semiconductor|supply shock/i.test(signal)) {
    signal = trimToMaxWords("Supply shock repriced access across critical markets.", 14);
    significance = trimToMaxWords("Execution risk rose because critical access became more constrained.", 12);
  }

  return {
    code: clean(traceRef ? `${anchor.id}/${traceRef}` : anchor.id).replace(/\s+/g, "-"),
    signal,
    significance,
  };
}

export function buildExecutiveBriefSourceIntelligence(
  summary: CanonicalExportSummary,
  _intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): ExecutiveBriefSourceIntelligence {
  const gate = summary.executiveBriefGate;
  const valid = gate.validity === "Structurally Valid";
  const traceRefs = [
    ...gate.proofTrace.proofIds,
    ...gate.proofTrace.transitionIds,
    ...gate.proofTrace.visibleArtifactIds,
  ];
  const evidenceSignals = summary.evidenceAnchorsCompact.slice(0, 6).map((anchor, index) => anchorToEvidence(anchor, traceRefs[index]));
  const dominantNarratives = joinList(gate.dominantNarratives) || "the active bounded world";
  const competingNarratives = joinList(gate.competingNarratives) || "no stable competing narrative cluster";
  const getCheck = (id: typeof gate.checks[number]["id"]) =>
    gate.checks.find((check) => check.id === id);
  const boundaryCheck = getCheck("narrative-world-boundary");
  const memoryCheck = getCheck("structural-memory");
  const stateVectorCheck = getCheck("state-vector-completeness");
  const phaseCheck = getCheck("phase-adjudication");
  const momentumCheck = getCheck("structural-momentum");
  const densityCheck = getCheck("density-threshold");
  const reversibilityCheck = getCheck("reversibility-classification");
  const proofCheck = getCheck("proof-object-sufficiency");
  const haloCheck = getCheck("halo-orientation-integrity");
  const categoryCheck = getCheck("category-separation");
  const failureModes = gate.checks
    .filter((check) => !check.passed)
    .map((check) => trimToMaxWords(check.failureMode, 10));

  return {
    scenarioName: summary.scenarioTitle,
    boundedWorld: summary.boundedWorld,
    asOfLabel: summary.replayMonth,
    currentPhase: summary.phase,
    briefMode: getFrameworkDisplayLabel(gate.framework),
    validityLabel: gate.validity,
    haloSnapshotVisual: undefined,
    executiveHeadline: trimToMaxWords(
      valid
        ? "Phase-adjudicated orientation confirms the current system state."
        : "Executive brief withheld pending structural state integrity.",
      12,
    ),
    executiveSubline: trimToMaxWords(
      valid
        ? `${SYSTEM_DISPLAY_LABELS.framework} only. ${summary.phase}; ${summary.density} density, ${summary.momentum} momentum, ${summary.reversibility} reversibility.`
        : "Structural conditions remain incomplete, so this artifact stays a diagnostic orientation read.",
      20,
    ),
    systemStateTitle: "Narrative World Boundary",
    boundaryParagraph: composeWithinRange(
      [
        boundaryCheck?.detail ?? "",
        gate.boundarySummary,
        gate.temporalWindowSummary,
        gate.artifactCriteriaSummary,
      ],
      45,
      85,
    ),
    stateParagraph: composeWithinRange(
      [
        `Current state is ${summary.phase} with ${summary.density} density, ${summary.momentum} momentum, and ${summary.reversibility} reversibility.`,
        gate.platformDomainSummary,
        valid
          ? "The full structural gate is satisfied, so the brief can remain orientation-only while preserving industrial traceability."
          : "The full structural gate is not yet satisfied, so the artifact cannot be treated as a valid executive brief.",
        "That changes the read from generic description into a present-state, phase-adjudicated orientation artifact.",
      ],
      45,
      85,
    ),
    systemStateSidebar: trimToMaxWords(
      valid ? "Boundary and state integrity are sufficient." : "Boundary or state integrity remains incomplete.",
      18,
    ),
    narrativeTitle: "Structural Memory",
    longitudinalSignalsParagraph: composeWithinRange(
      [
        memoryCheck?.detail ?? "",
        summary.narrativeDevelopment.earlySignalsSummary,
        `Longitudinal signals currently preserve repeated motifs across ${dominantNarratives}.`,
      ],
      40,
      75,
    ),
    motifPersistenceParagraph: composeWithinRange(
      [
        summary.narrativeDevelopment.systemicUptakeSummary,
        summary.narrativeDevelopment.currentStateFormationSummary,
        `Dominant narratives are ${dominantNarratives}.`,
        `Competing narratives are ${competingNarratives}.`,
        gate.synchronizationSummary,
        "Accumulation now persists as a bounded structural condition rather than an isolated episode.",
      ],
      40,
      75,
    ),
    stateVectorParagraph: composeWithinRange(
      [
        stateVectorCheck?.detail ?? "",
        gate.synchronizationSummary,
        `State vector completeness is expressed through phase ${summary.phase}, density ${summary.density}, momentum ${summary.momentum}, and reversibility ${summary.reversibility} inside the bounded world.`,
      ],
      40,
      75,
    ),
    narrativeSidebar: trimToMaxWords(
      memoryCheck?.passed ? "Longitudinal memory is present and persistent." : "Longitudinal memory remains structurally thin.",
      18,
    ),
    structuralTitle: SYSTEM_LABELS.PAL,
    phaseAdjudicationParagraph: composeWithinRange(
      [
        phaseCheck?.detail ?? "",
        densityCheck?.detail ?? "",
        summary.structuralInterpretationSummary,
        "That changes the artifact from descriptive accumulation into an adjudicated representation of current system state.",
      ],
      45,
      90,
    ),
    momentumParagraph: composeWithinRange(
      [
        momentumCheck?.detail ?? "",
        reversibilityCheck?.detail ?? "",
        valid
          ? "This resolves state versus transition without moving into prediction or recommendation."
          : "State versus transition remains partially unresolved, which keeps the read diagnostic rather than fully executive-grade.",
      ],
      35,
      80,
    ),
    structuralSidebar: trimToMaxWords(
      phaseCheck?.passed ? `${SYSTEM_LABELS.PAL} is active and traceable.` : `${SYSTEM_LABELS.PAL} remains incomplete.`,
      18,
    ),
    haloTitle: SYSTEM_DISPLAY_LABELS.interpretationLayerIntegrity,
    haloIntegrityParagraph: composeWithinRange(
      [
        haloCheck?.detail ?? "",
        `This artifact includes only state, phase, density, momentum, reversibility, and proof-object traceability.`,
        "That constraint narrows the executive brief to present-state orientation and prevents spillover from forecasting or prescription.",
      ],
      40,
      75,
    ),
    categorySeparationParagraph: composeWithinRange(
      [
        categoryCheck?.detail ?? "",
        "Forecasting, advisory content, optimization logic, and actor-intent inference are excluded from the executive brief.",
        "Simulation outputs remain separate so the artifact preserves category discipline instead of mixing modes.",
      ],
      40,
      75,
    ),
    haloSidebar: trimToMaxWords("No forward-path or advisory language enters this artifact.", 18),
    traceabilityTitle: "Proof Object Traceability",
    traceabilityParagraph: composeWithinRange(
      [
        proofCheck?.detail ?? "",
        gate.proofTraceSummary,
        "The trace path remains input to state to output, which protects reproducibility and auditability.",
      ],
      40,
      80,
    ),
    auditParagraph: composeWithinRange(
      [
        valid
          ? "All required structural conditions are currently satisfied."
          : `Unmet conditions remain: ${joinList(gate.checks.filter((check) => !check.passed).map((check) => check.label.toLowerCase()))}.`,
        valid
          ? "The artifact can be treated as structurally valid and industrial-grade."
          : "The artifact remains a structural diagnostic rather than a valid executive brief.",
        "Audit readiness depends on the visible proof chain remaining intact through export and review.",
      ],
      30,
      70,
    ),
    validityConditions: gate.checks
      .filter((check) => check.passed)
      .map((check) => trimToMaxWords(check.label, 10))
      .slice(0, 4),
    failureModes: failureModes.slice(0, 4),
    traceabilityMarkers: gate.traceabilityMarkers.map((item) => trimToMaxWords(item, 10)).slice(0, 4),
    traceabilitySidebar: trimToMaxWords(
      proofCheck?.passed
        ? "Challenge-ready audit ledger."
        : "Proof trace is preserved but not yet sufficient.",
      18,
    ),
    evidenceTitle: "Evidence Base",
    evidenceIntro: trimToMaxWords(
      valid
        ? "Each claim remains traceable from source artifact to state, phase, and output."
        : "Evidence is preserved, but the structural gate remains incomplete.",
      40,
    ),
    evidenceSignals,
  };
}

export function buildExecutiveBriefSpec(
  source: ExecutiveBriefSourceIntelligence,
): ExecutiveBriefSpec {
  const currentConditionParagraph = withinRange(source.boundaryParagraph, 45, 85);
  const meaningParagraph = withinRange(source.stateParagraph, 45, 85);
  const earlySignalsParagraph = withinRange(source.longitudinalSignalsParagraph, 40, 75);
  const systemicUptakeParagraph = withinRange(source.motifPersistenceParagraph, 40, 75);
  const currentConditionNarrativeParagraph = withinRange(source.stateVectorParagraph, 40, 75);
  const structuralParagraph1 = withinRange(source.phaseAdjudicationParagraph, 45, 90);
  const structuralParagraph2 = withinRange(source.momentumParagraph, 35, 80);
  const primaryPathParagraph = withinRange(source.haloIntegrityParagraph, 40, 75);
  const alternatePathParagraph = withinRange(source.categorySeparationParagraph, 40, 75);
  const positioningParagraph1 = withinRange(source.traceabilityParagraph, 40, 80);
  const positioningParagraph2 = withinRange(source.auditParagraph ?? "", 30, 70);

  return {
    header: {
      scenarioName: makeFieldRule(source.scenarioName, {
        required: true,
        maxWords: 4,
        tone: "framing",
        renderStyle: "metaRow",
        placement: "page1.meta",
        fallback: "replace-with-default",
      }),
      boundedWorld: makeFieldRule(trimToMaxWords(source.boundedWorld, 14), {
        required: true,
        maxWords: 14,
        tone: "framing",
        renderStyle: "metaRow",
        placement: "page1.meta",
        fallback: "compress",
      }),
      asOfLabel: makeFieldRule(trimToMaxWords(source.asOfLabel, 8), {
        required: true,
        maxWords: 8,
        tone: "framing",
        renderStyle: "metaRow",
        placement: "page1.meta",
        fallback: "replace-with-default",
      }),
      currentPhase: makeFieldRule(trimToMaxWords(source.currentPhase, 4), {
        required: true,
        maxWords: 4,
        tone: "signal",
        renderStyle: "metaRow",
        placement: "page1.meta",
        fallback: "replace-with-default",
      }),
      briefMode: makeFieldRule(trimToMaxWords(source.briefMode, 6), {
        required: true,
        maxWords: 6,
        tone: "signal",
        renderStyle: "metaRow",
        placement: "page1.meta",
        fallback: "replace-with-default",
      }),
      validityLabel: makeFieldRule(trimToMaxWords(source.validityLabel, 4), {
        required: true,
        maxWords: 4,
        tone: "signal",
        renderStyle: "metaRow",
        placement: "page1.meta",
        fallback: "replace-with-default",
      }),
      haloSnapshotVisual: source.haloSnapshotVisual
        ? makeFieldRule(source.haloSnapshotVisual, {
            required: false,
            maxWords: 12,
            tone: "signal",
            renderStyle: "signalRow",
            placement: "page1.header",
            fallback: "omit",
          })
        : undefined,
      executiveHeadline: makeFieldRule(trimToMaxWords(source.executiveHeadline, 12), {
        required: true,
        maxWords: 12,
        tone: "framing",
        renderStyle: "headline",
        placement: "page1.header",
        fallback: "replace-with-default",
      }),
      executiveSubline: makeFieldRule(trimToMaxWords(source.executiveSubline, 20), {
        required: true,
        maxWords: 20,
        tone: "framing",
        renderStyle: "paragraph",
        placement: "page1.header",
        fallback: "compress",
      }),
    },
    systemStateOverview: {
      sectionTitle: makeFieldRule(source.systemStateTitle, {
        required: true,
        maxWords: 4,
        tone: "framing",
        renderStyle: "headline",
        placement: "page1.systemState.title",
        fallback: "replace-with-default",
      }),
      currentConditionParagraph: makeFieldRule(
        currentConditionParagraph,
        {
          required: true,
          minWords: 45,
          maxWords: 85,
          tone: "interpretive",
          renderStyle: "paragraph",
          placement: "page1.systemState.p1",
          fallback: "compress",
        },
      ),
      meaningParagraph: makeFieldRule(meaningParagraph, {
        required: true,
        minWords: 45,
        maxWords: 85,
        tone: "analytical",
        renderStyle: "paragraph",
        placement: "page1.systemState.p2",
        fallback: "compress",
      }),
      sidebarInsight: source.systemStateSidebar
        ? makeFieldRule(trimToMaxWords(source.systemStateSidebar, 18), {
            required: false,
            maxWords: 18,
            tone: "signal",
            renderStyle: "signalRow",
            placement: "page1.systemState.sidebar",
            fallback: "omit",
          })
        : undefined,
    },
    narrativeDevelopment: {
      sectionTitle: makeFieldRule(source.narrativeTitle, {
        required: true,
        maxWords: 3,
        tone: "framing",
        renderStyle: "headline",
        placement: "page2.narrative.title",
        fallback: "replace-with-default",
      }),
      earlySignalsParagraph: makeFieldRule(earlySignalsParagraph, {
        required: true,
        minWords: 40,
        maxWords: 75,
        tone: "explanatory",
        renderStyle: "paragraph",
        placement: "page2.narrative.p1",
        fallback: "compress",
      }),
      systemicUptakeParagraph: makeFieldRule(systemicUptakeParagraph, {
        required: true,
        minWords: 40,
        maxWords: 75,
        tone: "explanatory",
        renderStyle: "paragraph",
        placement: "page2.narrative.p2",
        fallback: "compress",
      }),
      currentConditionParagraph: makeFieldRule(currentConditionNarrativeParagraph, {
        required: true,
        minWords: 40,
        maxWords: 75,
        tone: "interpretive",
        renderStyle: "paragraph",
        placement: "page2.narrative.p3",
        fallback: "compress",
      }),
      sidebarInsight: source.narrativeSidebar
        ? makeFieldRule(trimToMaxWords(source.narrativeSidebar, 18), {
            required: false,
            maxWords: 18,
            tone: "signal",
            renderStyle: "signalRow",
            placement: "page2.narrative.sidebar",
            fallback: "omit",
          })
        : undefined,
    },
    structuralInterpretation: {
      sectionTitle: makeFieldRule(source.structuralTitle, {
        required: true,
        maxWords: 3,
        tone: "framing",
        renderStyle: "headline",
        placement: "page2.structural.title",
        fallback: "replace-with-default",
      }),
      interpretationParagraph1: makeFieldRule(structuralParagraph1, {
        required: true,
        minWords: 45,
        maxWords: 90,
        tone: "analytical",
        renderStyle: "paragraph",
        placement: "page2.structural.p1",
        fallback: "compress",
      }),
      interpretationParagraph2: makeFieldRule(structuralParagraph2, {
        required: false,
        minWords: 35,
        maxWords: 80,
        tone: "analytical",
        renderStyle: "paragraph",
        placement: "page2.structural.p2",
        fallback: "omit",
      }),
      sidebarInsight: source.structuralSidebar
        ? makeFieldRule(trimToMaxWords(source.structuralSidebar, 18), {
            required: false,
            maxWords: 18,
            tone: "signal",
            renderStyle: "signalRow",
            placement: "page2.structural.sidebar",
            fallback: "omit",
          })
        : undefined,
    },
    forwardOrientation: {
      sectionTitle: makeFieldRule(source.haloTitle, {
        required: true,
        maxWords: 4,
        tone: "framing",
        renderStyle: "headline",
        placement: "page3.forward.title",
        fallback: "replace-with-default",
      }),
      primaryPathParagraph: makeFieldRule(primaryPathParagraph, {
        required: true,
        minWords: 40,
        maxWords: 75,
        tone: "analytical",
        renderStyle: "paragraph",
        placement: "page3.forward.p1",
        fallback: "compress",
      }),
      alternatePathParagraph: makeFieldRule(alternatePathParagraph, {
        required: true,
        minWords: 40,
        maxWords: 75,
        tone: "analytical",
        renderStyle: "paragraph",
        placement: "page3.forward.p2",
        fallback: "compress",
      }),
      sidebarInsight: source.haloSidebar
        ? makeFieldRule(trimToMaxWords(source.haloSidebar, 18), {
            required: false,
            maxWords: 18,
            tone: "signal",
            renderStyle: "signalRow",
            placement: "page3.forward.sidebar",
            fallback: "omit",
          })
        : undefined,
    },
    strategicPositioning: {
      sectionTitle: makeFieldRule(source.traceabilityTitle, {
        required: true,
        maxWords: 3,
        tone: "framing",
        renderStyle: "headline",
        placement: "page3.positioning.title",
        fallback: "replace-with-default",
      }),
      positioningParagraph1: makeFieldRule(positioningParagraph1, {
        required: true,
        minWords: 40,
        maxWords: 80,
        tone: "analytical",
        renderStyle: "paragraph",
        placement: "page3.positioning.p1",
        fallback: "compress",
      }),
      positioningParagraph2: positioningParagraph2
        ? makeFieldRule(positioningParagraph2, {
            required: false,
            minWords: 30,
            maxWords: 70,
            tone: "analytical",
            renderStyle: "paragraph",
            placement: "page3.positioning.p2",
            fallback: "omit",
          })
        : undefined,
      priorityAreas:
        source.validityConditions.length > 0
          ? makeFieldRule(source.validityConditions.slice(0, 4).map((item) => trimToMaxWords(item, 10)), {
              required: false,
              minItems: 2,
              maxItems: 4,
              maxWords: 10,
              tone: "analytical",
              renderStyle: "bulletList",
              placement: "page3.positioning.support.priorityAreas",
              fallback: "omit",
            })
          : undefined,
      sensitivityPoints:
        source.failureModes.length > 0
          ? makeFieldRule(source.failureModes.slice(0, 4).map((item) => trimToMaxWords(item, 10)), {
              required: false,
              minItems: 1,
              maxItems: 4,
              maxWords: 10,
              tone: "analytical",
              renderStyle: "bulletList",
              placement: "page3.positioning.support.sensitivityPoints",
              fallback: "omit",
            })
          : undefined,
      visibilityNeeds:
        source.traceabilityMarkers.length > 0
          ? makeFieldRule(source.traceabilityMarkers.slice(0, 4).map((item) => trimToMaxWords(item, 10)), {
              required: false,
              minItems: 2,
              maxItems: 4,
              maxWords: 10,
              tone: "signal",
              renderStyle: "bulletList",
              placement: "page3.positioning.support.visibilityNeeds",
              fallback: "omit",
            })
          : undefined,
      sidebarInsight: source.traceabilitySidebar
        ? makeFieldRule(trimToMaxWords(source.traceabilitySidebar, 18), {
            required: false,
            maxWords: 18,
            tone: "signal",
            renderStyle: "signalRow",
            placement: "page3.positioning.sidebar",
            fallback: "omit",
          })
        : undefined,
    },
    evidenceBase: {
      sectionTitle: makeFieldRule(source.evidenceTitle, {
        required: true,
        maxWords: 2,
        tone: "framing",
        renderStyle: "headline",
        placement: "page3.evidence.title",
        fallback: "replace-with-default",
      }),
      intro: makeFieldRule(trimToMaxWords(source.evidenceIntro, 40), {
        required: true,
        maxWords: 40,
        tone: "explanatory",
        renderStyle: "paragraph",
        placement: "page3.evidence.intro",
        fallback: "compress",
      }),
      items: makeFieldRule(source.evidenceSignals.slice(0, 6), {
        required: true,
        minItems: 3,
        maxItems: 6,
        tone: "signal",
        renderStyle: "evidenceRow",
        placement: "page3.evidence.rows",
        fallback: "compress",
      }),
    },
  };
}

export function buildExecutiveBriefSpecFromSummary(
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): ExecutiveBriefSpec {
  return buildExecutiveBriefSpec(buildExecutiveBriefSourceIntelligence(summary, intelligence));
}

export function buildExecutiveBriefFieldPack(spec: ExecutiveBriefSpec): ExecutiveBriefFieldPack {
  return {
    headerMeta: [
      { label: "Scenario", value: spec.header.scenarioName.value },
      { label: "Bounded World", value: spec.header.boundedWorld.value },
      { label: "As Of", value: spec.header.asOfLabel.value },
      { label: "Phase", value: spec.header.currentPhase.value },
      { label: "Mode", value: spec.header.briefMode.value },
      { label: "Validity", value: spec.header.validityLabel.value },
    ],
    pageModel: {
      page1: ["header", "systemStateOverview"],
      page2: ["narrativeDevelopment", "structuralInterpretation"],
      page3: ["forwardOrientation", "strategicPositioning", "evidenceBase"],
    },
  };
}

export function mapExecutiveBriefSpecToRenderedSections(
  spec: ExecutiveBriefSpec,
): ExecutiveBriefRenderedSectionMapping {
  return {
    header: {
      scenarioName: spec.header.scenarioName.value,
      boundedWorld: spec.header.boundedWorld.value,
      asOfLabel: spec.header.asOfLabel.value,
      currentPhase: spec.header.currentPhase.value,
      briefMode: spec.header.briefMode.value,
      validityLabel: spec.header.validityLabel.value,
      executiveHeadline: spec.header.executiveHeadline.value,
      executiveSubline: spec.header.executiveSubline.value,
    },
    page1: {
      systemStateOverview: {
        currentConditionParagraph: spec.systemStateOverview.currentConditionParagraph.value,
        meaningParagraph: spec.systemStateOverview.meaningParagraph.value,
        sidebarInsight: spec.systemStateOverview.sidebarInsight?.value,
      },
    },
    page2: {
      narrativeDevelopment: {
        earlySignalsParagraph: spec.narrativeDevelopment.earlySignalsParagraph.value,
        systemicUptakeParagraph: spec.narrativeDevelopment.systemicUptakeParagraph.value,
        currentConditionParagraph: spec.narrativeDevelopment.currentConditionParagraph.value,
        sidebarInsight: spec.narrativeDevelopment.sidebarInsight?.value,
      },
      structuralInterpretation: {
        interpretationParagraph1: spec.structuralInterpretation.interpretationParagraph1.value,
        interpretationParagraph2: spec.structuralInterpretation.interpretationParagraph2?.value,
        sidebarInsight: spec.structuralInterpretation.sidebarInsight?.value,
      },
    },
    page3: {
      forwardOrientation: {
        primaryPathParagraph: spec.forwardOrientation.primaryPathParagraph.value,
        alternatePathParagraph: spec.forwardOrientation.alternatePathParagraph.value,
        sidebarInsight: spec.forwardOrientation.sidebarInsight?.value,
      },
      strategicPositioning: {
        positioningParagraph1: spec.strategicPositioning.positioningParagraph1.value,
        positioningParagraph2: spec.strategicPositioning.positioningParagraph2?.value,
        priorityAreas: spec.strategicPositioning.priorityAreas?.value,
        sensitivityPoints: spec.strategicPositioning.sensitivityPoints?.value,
        visibilityNeeds: spec.strategicPositioning.visibilityNeeds?.value,
        sidebarInsight: spec.strategicPositioning.sidebarInsight?.value,
      },
      evidenceBase: {
        intro: spec.evidenceBase.intro.value,
        items: spec.evidenceBase.items.value,
      },
    },
  };
}
