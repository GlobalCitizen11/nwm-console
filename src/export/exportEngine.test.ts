import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { runWorldSimulation } from "../engine/stateEngine";
import { buildBoardOnePagerPlan } from "./boardOnePager";
import { buildExecutiveBriefPlan } from "./executiveBrief";
import { buildPresentationBriefPlan } from "./presentationBrief";
import { extractBriefingState } from "../utils/briefingArtifacts";
import { SYSTEM_DISPLAY_LABELS } from "../lib/systemLabels";

const scenario = loadScenarioDataset(scenarioData);
const result = runWorldSimulation(scenario.world, scenario.events);

const state = extractBriefingState({
  scenarioName: "Capital Fragmentation",
  result,
  point: result.timeline[11]!,
  currentView: {
    id: "export-test",
    name: "Executive View",
    scenarioId: "capital-fragmentation",
    role: "Executive",
    month: 11,
    eventId: null,
    transitionId: null,
    compareScenarioId: null,
  },
});

describe("export engine", () => {
  it("builds a six-page executive brief plan", () => {
    const plan = buildExecutiveBriefPlan(state, "Executive View");

    expect(plan.pages).toHaveLength(6);
    expect(plan.pages[0]?.title).toBe("Cover");
    expect(plan.pages[1]?.title).toBe("Narrative World Boundary");
    expect(plan.pages[4]?.title).toBe(SYSTEM_DISPLAY_LABELS.interpretationLayerIntegrity);
    expect(plan.pages[5]?.title).toBe("Proof Object Traceability");
  });

  it("builds a slide-based presentation plan", () => {
    const plan = buildPresentationBriefPlan(state, "Executive View");

    expect(plan.pages.length).toBeGreaterThanOrEqual(9);
    expect(plan.pages[0]?.title).toBe("Title Slide");
  });

  it("builds a strict one-page board snapshot", () => {
    const plan = buildBoardOnePagerPlan(state, "Executive View");

    expect(plan.pages).toHaveLength(1);
    expect(plan.pages[0]?.modules.length).toBeGreaterThanOrEqual(4);
  });
});
