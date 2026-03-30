import type {
  BoardOnePagerSpec,
  ExecutiveBriefSpec,
  FieldRule,
  PresentationBriefSpec,
} from "../types/artifactSpecs";
import type {
  VoiceBriefIntelligence,
  VoiceBriefTranscriptIntelligence,
} from "../types/voiceBriefIntelligence";
import { adaptVoiceBriefTranscript } from "./voiceBriefAdapter";
import {
  BoardOnePagerSpec as boardRules,
  PresentationBriefSpec as presentationRules,
  makeFieldRule,
} from "../features/export/specs/artifactSpecs";
import { buildExecutiveBriefSpec } from "./buildExecutiveBriefSpec";

function ruleConfig<T>(rule: FieldRule<T>): Omit<FieldRule<T>, "value"> {
  const { value, ...config } = rule;
  void value;
  return config;
}

export function normalizeVoiceBriefIntelligence(
  intelligence: VoiceBriefTranscriptIntelligence,
): VoiceBriefIntelligence {
  return adaptVoiceBriefTranscript(intelligence);
}

export function mapVoiceBriefToBoardOnePagerSpec(
  intelligence: VoiceBriefIntelligence,
): BoardOnePagerSpec {
  return {
    header: {
      scenarioTitle: makeFieldRule(intelligence.scenarioTitle, ruleConfig(boardRules.header.scenarioTitle)),
      replayMonthLabel: makeFieldRule(intelligence.replayMonthLabel, ruleConfig(boardRules.header.replayMonthLabel)),
      confidentialityLabel: makeFieldRule(intelligence.confidentialityLabel, ruleConfig(boardRules.header.confidentialityLabel)),
    },
    stateBand: {
      phase: makeFieldRule(intelligence.phase, ruleConfig(boardRules.stateBand.phase)),
      density: makeFieldRule(intelligence.density, ruleConfig(boardRules.stateBand.density)),
      momentum: makeFieldRule(intelligence.momentum, ruleConfig(boardRules.stateBand.momentum)),
      reversibility: makeFieldRule(intelligence.reversibility, ruleConfig(boardRules.stateBand.reversibility)),
      stateInterpretation: makeFieldRule(intelligence.executiveHeadline, ruleConfig(boardRules.stateBand.stateInterpretation)),
    },
    boardRead: {
      headline: makeFieldRule(intelligence.boardRead.headline, ruleConfig(boardRules.boardRead.headline)),
      summary: makeFieldRule(intelligence.boardRead.summary, ruleConfig(boardRules.boardRead.summary)),
    },
    decisionBox: {
      title: makeFieldRule(intelligence.intelligenceSchema?.decisionIntent.headline ?? "Reallocate capital before coordination failure hardens.", ruleConfig(boardRules.decisionBox.title)),
      actions: makeFieldRule(intelligence.decisionActions, ruleConfig(boardRules.decisionBox.actions)),
    },
    dominantPath: {
      statement: makeFieldRule(intelligence.dominantPath, ruleConfig(boardRules.dominantPath.statement)),
    },
    primaryPressure: {
      statement: makeFieldRule(intelligence.primaryPressure, ruleConfig(boardRules.primaryPressure.statement)),
    },
    riskConcentration: {
      items: makeFieldRule(intelligence.riskConcentration, ruleConfig(boardRules.riskConcentration.items)),
    },
    inflectionPaths: {
      continuation: makeFieldRule(intelligence.inflectionPaths.continuation, ruleConfig(boardRules.inflectionPaths.continuation)),
      reversal: makeFieldRule(intelligence.inflectionPaths.reversal, ruleConfig(boardRules.inflectionPaths.reversal)),
      acceleration: intelligence.inflectionPaths.acceleration
        ? makeFieldRule(intelligence.inflectionPaths.acceleration, ruleConfig(boardRules.inflectionPaths.acceleration!))
        : undefined,
    },
    triggers: {
      items: makeFieldRule(intelligence.triggers, ruleConfig(boardRules.triggers.items)),
    },
    evidenceSignals: {
      items: makeFieldRule(
        intelligence.evidenceSignals.map((item) => ({ code: item.code, signal: `${item.signal} ${item.significance}`.trim() })),
        ruleConfig(boardRules.evidenceSignals.items),
      ),
    },
    signalGrid: {
      items: makeFieldRule(intelligence.signalGrid, ruleConfig(boardRules.signalGrid.items)),
    },
    readShiftSignals: {
      items: makeFieldRule(
        [
          "Control easing changes capital routing.",
          "Coordination reopening changes execution risk.",
        ],
        {
          required: false,
          tone: "signal",
          renderStyle: "list",
          placement: "lower-right",
          fallback: "omit",
          minItems: 2,
          maxItems: 3,
          maxWords: 8,
        },
      ),
    },
    containedVsSpreading: {
      items: makeFieldRule(
        [
          {
            label: "Spreading",
            value: "Constraint spreads through allocation and access.",
          },
          {
            label: "Contained",
            value: "Relief remains local and reversible.",
          },
        ],
        {
          required: false,
          tone: "interpretive",
          renderStyle: "row",
          placement: "lower-right",
          fallback: "omit",
          minItems: 2,
          maxItems: 2,
        },
      ),
    },
  };
}

export function mapVoiceBriefToExecutiveBriefSpec(
  intelligence: VoiceBriefIntelligence,
): ExecutiveBriefSpec {
  return buildExecutiveBriefSpec({
    scenarioName: intelligence.scenarioTitle,
    boundedWorld: intelligence.boundedWorld,
    asOfLabel: intelligence.replayMonthLabel,
    currentPhase: intelligence.phase,
    haloSnapshotVisual: undefined,
    executiveHeadline: intelligence.executiveHeadline,
    executiveSubline: intelligence.systemState.sidebarInsight,
    currentState: intelligence.systemState.summary,
    environmentalCharacterization: intelligence.systemState.sidebarInsight,
    operatingMeaning: intelligence.decisionPosture.summary,
    brokenAssumptions: [
      "Rapid normalization can no longer anchor planning.",
      "Cross-border efficiency can no longer be treated as default.",
    ],
    pressureZones: [
      intelligence.primaryPressure,
      intelligence.structuralRead.sidebarInsight,
    ],
    earlySignals: intelligence.narrativeProgression.summary,
    systemicUptake: intelligence.structuralRead.summary,
    recentDevelopments: intelligence.systemState.summary,
    structuralMeaning: intelligence.structuralRead.summary,
    implicitVariableBehavior: intelligence.structuralRead.sidebarInsight,
    transitionType: intelligence.narrativeProgression.sidebarInsight,
    primaryPath: intelligence.forwardView.summary,
    alternatePath: intelligence.forwardView.sidebarInsight,
    currentExposures: intelligence.decisionPosture.summary,
    flexibilityNeeds: intelligence.decisionPosture.sidebarInsight,
    visibilityNeeds: intelligence.decisionPosture.actions?.slice(0, 3) ?? [],
    priorityAreas: intelligence.decisionPosture.actions?.slice(0, 4) ?? [],
    sensitivityPoints: intelligence.riskConcentration.slice(0, 4),
    evidenceSignals: intelligence.evidenceBase.items.map((item) => ({
      code: item.code,
      signal: item.signal,
      significance: item.significance,
    })),
  });
}

export function mapVoiceBriefToPresentationBriefSpec(
  intelligence: VoiceBriefIntelligence,
): PresentationBriefSpec {
  const baseSlides = presentationRules.slides;
  return {
    slides: intelligence.presentation.slides.map((slide, index) => {
      const rule = baseSlides[index];
      const fallbackRule = baseSlides[0]!;
      return {
        slideType: makeFieldRule(slide.slideType, ruleConfig(rule?.slideType ?? fallbackRule.slideType)),
        title: makeFieldRule(slide.title, ruleConfig(rule?.title ?? fallbackRule.title)),
        subtitle: slide.subtitle
          ? makeFieldRule(slide.subtitle, {
              required: false,
              tone: "framing",
              renderStyle: "chip",
              placement: "slide-header",
              fallback: "omit",
              maxWords: 10,
            })
          : undefined,
        bullets: makeFieldRule(slide.bullets, ruleConfig(rule?.bullets ?? fallbackRule.bullets)),
        presenterNote: slide.presenterNote
          ? makeFieldRule(slide.presenterNote, {
              required: false,
              tone: "explanatory",
              renderStyle: "paragraph",
              placement: "slide-body",
              fallback: "omit",
              maxWords: 40,
            })
          : undefined,
      };
    }),
  };
}
