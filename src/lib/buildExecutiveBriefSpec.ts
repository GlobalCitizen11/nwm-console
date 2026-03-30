import type { CanonicalEvidenceAnchor, CanonicalExportSummary } from "../features/export/types/export";
import type { VoiceBriefIntelligence, VoiceBriefTranscriptIntelligence } from "../types/voiceBriefIntelligence";
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

function keySubject(text: string, fallback: string, maxWords = 5) {
  const picked = clause(text, fallback)
    .replace(
      /^(pressure is concentrated in|monitoring should stay fixed on|decision posture should stay disciplined where|the main watchpoint is whether|that pressure is now shaping|visibility is needed on|what matters most is)\s+/i,
      "",
    )
    .replace(/\b(visibility is needed on|what matters most is|monitoring should stay fixed on)\b/gi, "")
    .replace(/\b(the|a|an)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const resolved = picked && !/^(on|whether|where)$/i.test(picked) ? picked : fallback;
  return words(resolved).slice(0, maxWords).join(" ") || fallback;
}

function phaseCurrentCondition(phase: string) {
  const value = lower(phase);
  if (value.includes("pal")) return "The system is now operating under actively enforced boundary conditions.";
  if (value.includes("halo")) return "The system is still early enough that boundary conditions are forming rather than fully locked.";
  if (value.includes("lat")) return "The system is operating under late-stage constraint with narrower room for low-cost adaptation.";
  return "The system is operating under a bounded condition that now shapes decisions directly.";
}

function environmentCharacterization(phase: string, density: string, momentum: string) {
  const phaseValue = lower(phase);
  const densityValue = lower(density);
  const momentumValue = lower(momentum);

  if (phaseValue.includes("pal") && densityValue.includes("high")) {
    return "The environment is dense, politically conditioned, and less tolerant of plans built on broad coordination.";
  }
  if (momentumValue.includes("acceler")) {
    return "The environment is moving quickly enough that exposed assumptions lose value before institutions can stabilize them.";
  }
  if (densityValue.includes("medium")) {
    return "The environment is still legible, but pressure is building fast enough to alter operating choices before consensus catches up.";
  }
  return "The environment now rewards control, resilience, and selective exposure over speed, scale, and presumed alignment.";
}

function brokenAssumptionsFromSummary(summary: CanonicalExportSummary) {
  const assumptions = [
    "Rapid normalization can no longer anchor planning.",
    "Cross-border efficiency can no longer be treated as default.",
    "Coordinated relief can no longer be assumed in exposed systems.",
  ];

  if (lower(summary.reversibility).includes("low")) {
    assumptions[2] = "Reversible room can no longer be assumed once exposure is widened.";
  }
  if (lower(summary.momentum).includes("acceler")) {
    assumptions[0] = "Adjustment windows no longer stay open long enough to anchor slow planning.";
  }

  return assumptions.map((item) => trimToMaxWords(item, 10));
}

function transitionSentence(summary: CanonicalExportSummary) {
  const phase = lower(summary.phase);
  const momentum = lower(summary.momentum);
  if (phase.includes("pal") && momentum.includes("acceler")) {
    return "The system is transitioning into harder boundary-led operating behavior.";
  }
  if (momentum.includes("slow")) {
    return "The system is consolidating into a more persistent bounded condition.";
  }
  return `The system is transitioning toward ${summary.phase.toLowerCase()} operating conditions.`;
}

function stateClass(source: ExecutiveBriefSourceIntelligence) {
  const phase = lower(source.currentPhase);
  const current = lower(source.currentState);
  const headline = lower(source.executiveHeadline);
  if (phase.includes("pal") || current.includes("fragment") || headline.includes("fragment")) {
    return "fragmented";
  }
  if (phase.includes("halo")) {
    return "forming";
  }
  if (phase.includes("lat")) {
    return "late";
  }
  return "bounded";
}

function momentumClass(source: ExecutiveBriefSourceIntelligence) {
  const transition = lower(source.transitionType);
  const path = lower(source.primaryPath);
  if (transition.includes("harder") || transition.includes("acceler") || path.includes("deeper")) {
    return "accelerating";
  }
  if (transition.includes("persistent") || transition.includes("consolid")) {
    return "consolidating";
  }
  return "steady";
}

function conditionPattern(source: ExecutiveBriefSourceIntelligence) {
  const state = stateClass(source);
  const momentum = momentumClass(source);
  if (state === "forming") return "forming";
  if (state === "late") return "late";
  if (momentum === "accelerating") return "accelerating";
  if (momentum === "consolidating") return "consolidating";
  return "default";
}

function makeFieldRule<T>(
  value: T,
  config: Omit<FieldRule<T>, "value">,
): FieldRule<T> {
  return { value, ...config };
}

function anchorToEvidence(anchor: CanonicalEvidenceAnchor): ExecutiveEvidenceItem {
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
    code: clean(anchor.id).split(/\s+/).slice(0, 2).join(" "),
    signal,
    significance,
  };
}

function normalizeVoiceIntelligence(
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
) {
  if (!intelligence) {
    return undefined;
  }

  if ("boardRead" in intelligence) {
    return intelligence;
  }

  return undefined;
}

export function buildExecutiveBriefSourceIntelligence(
  summary: CanonicalExportSummary,
  intelligence?: VoiceBriefTranscriptIntelligence | VoiceBriefIntelligence,
): ExecutiveBriefSourceIntelligence {
  const assisted = normalizeVoiceIntelligence(intelligence);
  const evidenceSignals = summary.evidenceAnchorsCompact.slice(0, 4).map(anchorToEvidence);
  const pressureSubject = keySubject(summary.primaryPressureSummary, "coordination, allocation, and access");
  const implicationSubject = keySubject(summary.implicationsSummary, "operating exposure");
  const monitoringSubject = keySubject(summary.monitoringSummary, "boundary changes that reopen coordination", 6);
  const watchpointSubject = keySubject(summary.watchpointSummary, "pressure transmission", 6);

  return {
    scenarioName: summary.scenarioTitle,
    boundedWorld: summary.boundedWorld,
    asOfLabel: `As of ${summary.replayMonth}`,
    currentPhase: summary.phase,
    haloSnapshotVisual: undefined,
    executiveHeadline: trimToMaxWords(
      assisted?.executiveHeadline ?? "Fragmentation now constrains allocation, coordination, and access simultaneously.",
      12,
    ),
    executiveSubline: trimToMaxWords(
      assisted?.systemState?.sidebarInsight ??
        `State-dependent operating constraint now matters more than assumptions built around ${implicationSubject}.`,
      20,
    ),
    currentState: summary.currentStateSummary,
    environmentalCharacterization: environmentCharacterization(summary.phase, summary.density, summary.momentum),
    operatingMeaning:
      assisted?.decisionPosture?.summary ??
      `${clause(summary.implicationsSummary, "The current condition now changes how the system operates")}. ${clause(summary.strategicPositioningSummary, "Decision posture now needs to be revisited")}.`,
    brokenAssumptions: brokenAssumptionsFromSummary(summary),
    pressureZones: [
      trimToMaxWords(`Pressure is now building fastest around ${pressureSubject}.`, 12),
      trimToMaxWords(`Pressure also builds where ${monitoringSubject} can change execution conditions quickly.`, 12),
    ],
    earlySignals: summary.narrativeDevelopment.earlySignalsSummary,
    systemicUptake: summary.narrativeDevelopment.systemicUptakeSummary,
    recentDevelopments: summary.narrativeDevelopment.currentStateFormationSummary,
    structuralMeaning: summary.structuralInterpretationSummary,
    implicitVariableBehavior:
      `Variables are no longer moving independently. ${pressureSubject} now transmits directly into allocation, access, and timing.`,
    transitionType: trimToMaxWords(transitionSentence(summary), 12),
    primaryPath: summary.forwardOrientationSummary,
    alternatePath: summary.alternatePathSummary,
    currentExposures:
      `Exposure is highest where ${pressureSubject} overlaps with commitments that still depend on ${implicationSubject}.`,
    flexibilityNeeds:
      `Leadership now needs reversibility, selective commitments, and clear trigger discipline around ${watchpointSubject}.`,
    visibilityNeeds: [
      trimToMaxWords(`Watch for ${monitoringSubject}.`, 9),
      trimToMaxWords(`Watch for changes in ${watchpointSubject}.`, 9),
      trimToMaxWords("Watch for policy easing that materially widens flexibility.", 9),
    ],
    priorityAreas:
      assisted?.decisionPosture?.actions?.slice(0, 4).map((item) => trimToMaxWords(item, 10)) ?? [
        trimToMaxWords(`Reduce exposure where ${pressureSubject} drives downside.`, 10),
        trimToMaxWords(`Protect access where ${implicationSubject} can harden fastest.`, 10),
        trimToMaxWords(`Preserve reversibility before ${watchpointSubject} widens.`, 10),
      ],
    sensitivityPoints: [
      trimToMaxWords(pressureSubject, 4),
      trimToMaxWords(implicationSubject, 5),
      trimToMaxWords(watchpointSubject, 4),
    ],
    evidenceSignals,
  };
}

export function buildExecutiveBriefSpec(
  source: ExecutiveBriefSourceIntelligence,
): ExecutiveBriefSpec {
  const pattern = conditionPattern(source);
  const systemStateSidebar =
    pattern === "forming"
      ? "Boundary tightening now punishes delay before the condition fully settles."
      : pattern === "late"
        ? "Hardened constraint now prices hesitation directly into exposed commitments."
        : pattern === "accelerating"
          ? "Active constraint now penalizes slow repositioning across exposed decisions."
          : "Operating constraint now narrows room before institutions restore confidence.";
  const sectionVariants = {
    currentCondition:
      pattern === "forming"
        ? [
            source.currentState,
            "The boundary is forming faster than consensus, so operating choices are tightening before the wider system fully reprices them.",
            source.environmentalCharacterization,
            "That leaves leadership with less room to treat the present condition as provisional.",
          ]
        : pattern === "late"
          ? [
              source.currentState,
              phaseCurrentCondition(source.currentPhase),
              "The condition is mature enough that exposed positions now carry operating cost rather than just scenario risk.",
              source.environmentalCharacterization,
            ]
          : pattern === "accelerating"
            ? [
                source.currentState,
                phaseCurrentCondition(source.currentPhase),
                source.environmentalCharacterization,
                "Pressure is moving quickly enough that institutions are reacting after the condition has already changed exposure.",
              ]
            : [
                source.currentState,
                phaseCurrentCondition(source.currentPhase),
                source.environmentalCharacterization,
                "Constraint is active enough to shape exposure decisions before institutions can restore wider confidence.",
              ],
    meaning:
      pattern === "forming"
        ? [
            source.operatingMeaning,
            source.brokenAssumptions[0],
            source.pressureZones[0],
            "The main change is that assumptions are breaking before the system has fully settled into a stable new equilibrium.",
          ]
        : pattern === "late"
          ? [
              source.operatingMeaning,
              source.brokenAssumptions[1],
              source.brokenAssumptions[2],
              source.pressureZones[1],
              "This now changes operating logic more than it changes narrative interpretation.",
            ]
          : [
              source.operatingMeaning,
              source.brokenAssumptions[0],
              source.brokenAssumptions[1],
              source.pressureZones[0],
              source.pressureZones[1],
            ],
    earlySignals:
      pattern === "forming"
        ? [
            source.earlySignals,
            "The first signals mattered because they revealed the boundary tightening before most participants treated it as structural.",
            "That early asymmetry created the initial advantage for faster repositioning.",
          ]
        : [
            source.earlySignals,
            "The early signal phase mattered because it showed the boundary tightening before the wider system repriced around it.",
            "Those developments narrowed the room for low-cost adaptation before most operators changed posture.",
          ],
    systemicUptake:
      pattern === "accelerating"
        ? [
            source.systemicUptake,
            "Uptake accelerated once adjacent domains began responding to the same pressure at the same time.",
            "That synchronization widened the cost of misalignment and made slow interpretation more expensive.",
            "It also pulled more institutions into the same operating logic before they could preserve independent room to act.",
          ]
        : pattern === "consolidating"
          ? [
              source.systemicUptake,
              "Systemic uptake mattered because the signal set stopped looking isolated and started hardening into shared operating behavior.",
              "Once that happened, the system became more persistent and less tolerant of exposed assumptions.",
              "That persistence reduced the value of waiting for a cleaner reset and increased the value of earlier controlled adjustment.",
            ]
          : [
              source.systemicUptake,
              "Systemic uptake mattered because the signal set stopped looking isolated and started changing behavior across adjacent domains.",
              "Once uptake broadened, delay carried more consequence than incremental interpretation.",
              "That spread widened the cost of misalignment and narrowed the value of waiting for clarification.",
            ],
    currentConditionNarrative:
      pattern === "late"
        ? [
            source.recentDevelopments,
            "Recent developments now confirm a settled operating condition rather than a temporary sequence of disruptions.",
            "That leaves little room to treat relief as the default case.",
          ]
        : [
            source.recentDevelopments,
            "The current condition now reflects accumulated system behavior rather than a temporary sequence of unrelated disruptions.",
            "That leaves the system operating through constraint instead of waiting for rhetorical relief.",
          ],
    structural1:
      pattern === "accelerating"
        ? [
            source.structuralMeaning,
            "The pattern indicates a fast transmission mechanism in which coordination stress now moves directly into allocation, access, and timing.",
            "That interaction narrows flexibility earlier than most exposed plans assume.",
            "It also raises the penalty for commitments that still depend on broad alignment or slow institutional response.",
          ]
        : pattern === "consolidating"
          ? [
              source.structuralMeaning,
              "The pattern indicates a consolidating transition in which once-separate variables are beginning to reinforce one another consistently.",
              "That consistency matters because it turns episodic stress into operating structure.",
              "Once stress behaves like structure, exposed plans lose more value from delay than from early controlled revision.",
            ]
          : [
              source.structuralMeaning,
              "The pattern indicates a transition in which coordination stress now transmits directly into allocation, access, and timing.",
              "Variables that once moved separately now reinforce one another under pressure.",
              "That interaction changes the operating model by narrowing flexibility and raising the cost of exposed commitments.",
            ],
    structural2:
      pattern === "forming"
        ? [
            source.implicitVariableBehavior,
            "The system is still forming, but the direction is already clear enough to invalidate neutral planning assumptions.",
          ]
        : [
            source.implicitVariableBehavior,
            "That behavior points to a system shifting away from efficiency-led adjustment and toward boundary-led operating discipline.",
            "This transition rewards reversible positioning and punishes commitments that depend on rapid normalization.",
          ],
    primaryPath:
      pattern === "accelerating"
        ? [
            source.primaryPath,
            "The primary path still points to faster hardening of the current condition before any broader reopening of flexibility appears.",
            "That path rewards earlier repositioning and penalizes reliance on delayed stabilization.",
          ]
        : [
            source.primaryPath,
            "The primary path still favors further hardening of the current condition before any broader reopening of flexibility appears.",
            "That path increases the value of early repositioning and reduces the value of waiting for informal relief.",
          ],
    alternatePath:
      pattern === "forming"
        ? [
            source.alternatePath,
            "An alternate path remains possible only if behavior changes across the boundary before the current condition fully locks in.",
            "If that happens early enough, leadership regains room to revise commitments at lower cost.",
          ]
        : [
            source.alternatePath,
            "An alternate path opens only if behavior changes across the boundary rather than remaining rhetorical.",
            "If that shift appears, execution pressure can ease, flexibility can widen, and delayed commitments can be revisited on better terms.",
          ],
    positioning1:
      pattern === "late"
        ? [
            source.currentExposures,
            "Leadership should now revisit commitments that are expensive to reverse under hardened boundary conditions.",
            "The cost of exposed positioning is now operational, not hypothetical.",
          ]
        : [
            source.currentExposures,
            "Leadership should now revisit commitments that depend on cooperative clearance, low-friction access, or rapid normalization.",
            "Exposures tied to those assumptions now carry avoidable downside as the current condition persists and reprices decision room.",
          ],
    positioning2:
      pattern === "consolidating"
        ? [
            source.flexibilityNeeds,
            "Selective commitments and clearer triggers now preserve more value than broad optionality language.",
            "Attention should stay fixed on the few developments that materially reopen room to move.",
          ]
        : [
            source.flexibilityNeeds,
            "Reversible commitments, selective concentration, and trigger discipline now preserve more value than broad expansion.",
            "Attention should stay fixed on the few developments that materially reopen room to move.",
          ],
  };

  const currentConditionParagraph = composeWithinRange(
    sectionVariants.currentCondition,
    45,
    85,
  );

  const meaningParagraph = composeWithinRange(
    sectionVariants.meaning,
    45,
    85,
  );

  const earlySignalsParagraph = composeWithinRange(
    sectionVariants.earlySignals,
    40,
    75,
  );

  const systemicUptakeParagraph = composeWithinRange(
    sectionVariants.systemicUptake,
    40,
    75,
  );

  const currentConditionNarrativeParagraph = composeWithinRange(
    sectionVariants.currentConditionNarrative,
    40,
    75,
  );

  const structuralParagraph1 = composeWithinRange(
    sectionVariants.structural1,
    45,
    90,
  );

  const structuralParagraph2 = composeWithinRange(
    sectionVariants.structural2,
    35,
    80,
  );

  const primaryPathParagraph = composeWithinRange(
    sectionVariants.primaryPath,
    40,
    75,
  );

  const alternatePathParagraph = composeWithinRange(
    sectionVariants.alternatePath,
    40,
    75,
  );

  const positioningParagraph1 = composeWithinRange(
    sectionVariants.positioning1,
    40,
    80,
  );

  const positioningParagraph2 = composeWithinRange(
    sectionVariants.positioning2,
    30,
    70,
  );

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
      sectionTitle: makeFieldRule("System State Overview", {
        required: true,
        maxWords: 3,
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
      sidebarInsight: makeFieldRule(trimToMaxWords(systemStateSidebar, 18), {
        required: false,
        maxWords: 18,
        tone: "signal",
        renderStyle: "signalRow",
        placement: "page1.systemState.sidebar",
        fallback: "omit",
      }),
    },
    narrativeDevelopment: {
      sectionTitle: makeFieldRule("Narrative Development", {
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
      sidebarInsight: makeFieldRule(trimToMaxWords("The narrative crossed from signal recognition into operating behavior.", 18), {
        required: false,
        maxWords: 18,
        tone: "signal",
        renderStyle: "signalRow",
        placement: "page2.narrative.sidebar",
        fallback: "omit",
      }),
    },
    structuralInterpretation: {
      sectionTitle: makeFieldRule("Structural Interpretation", {
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
      sidebarInsight: makeFieldRule(trimToMaxWords("Correlated stress now removes the benefit of isolated fixes.", 18), {
        required: false,
        maxWords: 18,
        tone: "signal",
        renderStyle: "signalRow",
        placement: "page2.structural.sidebar",
        fallback: "omit",
      }),
    },
    forwardOrientation: {
      sectionTitle: makeFieldRule("Forward Orientation", {
        required: true,
        maxWords: 3,
        tone: "framing",
        renderStyle: "headline",
        placement: "page3.forward.title",
        fallback: "replace-with-default",
      }),
      primaryPathParagraph: makeFieldRule(primaryPathParagraph, {
        required: true,
        minWords: 40,
        maxWords: 75,
        tone: "predictive",
        renderStyle: "paragraph",
        placement: "page3.forward.p1",
        fallback: "compress",
      }),
      alternatePathParagraph: makeFieldRule(alternatePathParagraph, {
        required: true,
        minWords: 40,
        maxWords: 75,
        tone: "predictive",
        renderStyle: "paragraph",
        placement: "page3.forward.p2",
        fallback: "compress",
      }),
      sidebarInsight: makeFieldRule(trimToMaxWords("Only visible behavioral reopening widens flexibility from here.", 18), {
        required: false,
        maxWords: 18,
        tone: "signal",
        renderStyle: "signalRow",
        placement: "page3.forward.sidebar",
        fallback: "omit",
      }),
    },
    strategicPositioning: {
      sectionTitle: makeFieldRule("Strategic Positioning", {
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
        tone: "directive",
        renderStyle: "paragraph",
        placement: "page3.positioning.p1",
        fallback: "compress",
      }),
      positioningParagraph2: makeFieldRule(positioningParagraph2, {
        required: false,
        minWords: 30,
        maxWords: 70,
        tone: "directive",
        renderStyle: "paragraph",
        placement: "page3.positioning.p2",
        fallback: "omit",
      }),
      priorityAreas: makeFieldRule(source.priorityAreas.slice(0, 4).map((item) => trimToMaxWords(item, 10)), {
        required: false,
        minItems: 2,
        maxItems: 4,
        maxWords: 10,
        tone: "directive",
        renderStyle: "bulletList",
        placement: "page3.positioning.support.priorityAreas",
        fallback: "omit",
      }),
      sensitivityPoints: makeFieldRule(source.sensitivityPoints.slice(0, 4).map((item) => trimToMaxWords(item, 10)), {
        required: false,
        minItems: 2,
        maxItems: 4,
        maxWords: 10,
        tone: "analytical",
        renderStyle: "bulletList",
        placement: "page3.positioning.support.sensitivityPoints",
        fallback: "omit",
      }),
      visibilityNeeds: makeFieldRule(source.visibilityNeeds.slice(0, 4).map((item) => trimToMaxWords(item, 10)), {
        required: false,
        minItems: 2,
        maxItems: 4,
        maxWords: 10,
        tone: "signal",
        renderStyle: "bulletList",
        placement: "page3.positioning.support.visibilityNeeds",
        fallback: "omit",
      }),
      sidebarInsight: makeFieldRule(trimToMaxWords("Reversibility now protects value better than speed.", 18), {
        required: false,
        maxWords: 18,
        tone: "signal",
        renderStyle: "signalRow",
        placement: "page3.positioning.sidebar",
        fallback: "omit",
      }),
    },
    evidenceBase: {
      sectionTitle: makeFieldRule("Evidence Base", {
        required: true,
        maxWords: 2,
        tone: "framing",
        renderStyle: "headline",
        placement: "page3.evidence.title",
        fallback: "replace-with-default",
      }),
      intro: makeFieldRule(
        trimToMaxWords(
          "These anchors confirm that the present read is grounded in active operating signals rather than narrative drift.",
          40,
        ),
        {
          required: true,
          maxWords: 40,
          tone: "explanatory",
          renderStyle: "paragraph",
          placement: "page3.evidence.intro",
          fallback: "compress",
        },
      ),
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
