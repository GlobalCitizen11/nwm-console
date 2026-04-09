import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { runWorldSimulation } from "../engine/stateEngine";
import { SYSTEM_DISPLAY_LABELS } from "../lib/systemLabels";
import {
  composeBoardOnePager,
  composeExecutiveBrief,
  composePresentationBrief,
  extractBriefingState,
} from "./briefingArtifacts";

const scenario = loadScenarioDataset(scenarioData);
const result = runWorldSimulation(scenario.world, scenario.events);

const makeState = (month: number) =>
  extractBriefingState({
    scenarioName: "Capital Fragmentation",
    result,
    point: result.timeline[month]!,
    currentView: {
      id: `view-${month}`,
      name: `Month ${month}`,
      scenarioId: "capital-fragmentation",
      role: "Executive",
      month,
      eventId: null,
      transitionId: null,
      compareScenarioId: null,
    },
  });

describe("briefing artifacts", () => {
  it("extracts deterministic briefing state across early, mid, and late positions", () => {
    const early = makeState(2);
    const mid = makeState(11);
    const late = makeState(18);

    expect(early.phase).toBe("Escalating");
    expect(mid.phase).toBe("Structural Reclassification");
    expect(late.phase).toBe("Fragmented Regime");

    expect(early.narrativeDensity).not.toBe(late.narrativeDensity);
    expect(early.currentCondition).not.toBe(late.currentCondition);
    expect(mid.signalAnchors.length).toBeGreaterThanOrEqual(3);
    expect(late.crossDomainEffects.length).toBeGreaterThan(0);
    expect(late.stabilitySignals.length).toBeGreaterThan(0);
  });

  it("builds an executive brief with the required structural sections", () => {
    const brief = composeExecutiveBrief(makeState(11));

    expect(brief).toContain(`Mode: Orientation (${SYSTEM_DISPLAY_LABELS.framework})`);
    expect(brief).toContain("1. Narrative World Boundary");
    expect(brief).toContain("3. Adjudication Layer");
    expect(brief).toContain(`4. ${SYSTEM_DISPLAY_LABELS.interpretationLayerIntegrity}`);
    expect(brief).toContain("5. Proof Object Traceability");
    expect(brief).toContain("6. Evidence Base");
    expect(brief).toContain("Structural Reclassification");
  });

  it("withholds the legacy executive brief when structural integrity fails", () => {
    const invalidState = extractBriefingState({
      scenarioName: "Capital Fragmentation",
      result,
      point: result.timeline[1]!,
      currentView: {
        id: "invalid-view",
        name: "Ops View",
        scenarioId: "capital-fragmentation",
        role: "Operations",
        month: 1,
        eventId: null,
        transitionId: null,
        compareScenarioId: null,
      },
    });
    const brief = composeExecutiveBrief(invalidState);

    expect(brief).toContain("EXECUTIVE BRIEF WITHHELD");
    expect(brief).toContain("UNMET CONDITIONS");
    expect(brief).toContain("Category separation maintained");
  });

  it("builds a slide-ready presentation brief with eight non-redundant slides", () => {
    const presentation = composePresentationBrief(makeState(11));

    expect(presentation.slides).toHaveLength(8);
    expect(presentation.slides.map((slide) => slide.title)).toEqual([
      "Situation Frame",
      "Executive Takeaway",
      "System State",
      "How It Emerged",
      "What Changed",
      "Structural Reading",
      "Near-Range Paths",
      "Leadership Attention",
    ]);
    expect(presentation.slides[2]?.bullets).toContain("Phase: Structural Reclassification");
    expect(presentation.slides.every((slide) => slide.bullets.length >= 2 && slide.bullets.length <= 4)).toBe(true);
  });

  it("builds a board one-pager with governance-focused density", () => {
    const onePager = composeBoardOnePager(makeState(18));

    expect(onePager.situationInBrief).toContain("Fragmented Regime");
    expect(onePager.whatHasShifted.length).toBeGreaterThan(0);
    expect(onePager.oversightPriorities.length).toBeGreaterThan(0);
    expect(onePager.signalBasis.length).toBeGreaterThanOrEqual(3);
    expect(onePager.stabilitySignals.length).toBeGreaterThan(0);
  });
});
