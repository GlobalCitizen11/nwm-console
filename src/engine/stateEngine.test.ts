import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { adjudicatePhases } from "./phaseAdjudicator";
import { runCounterfactualSimulation } from "./counterfactualEngine";
import { runWorldSimulation } from "./stateEngine";
import type { WorldStatePoint } from "../types";

const scenario = loadScenarioDataset(scenarioData);

describe("state engine", () => {
  it("produces the expected adjudicated transitions for the seeded scenario", () => {
    const result = runWorldSimulation(scenario.world, scenario.events);

    expect(result.transitions.map((transition) => transition.month)).toEqual([3, 11, 17]);
    expect(result.transitions.map((transition) => transition.toPhase)).toEqual([
      "Escalation Edge",
      "Structural Reclassification",
      "Fragmented Regime",
    ]);
    expect(result.proofObjects).toHaveLength(result.transitions.length);
  });

  it("changes the phase path under the default counterfactual", () => {
    const baseResult = runWorldSimulation(scenario.world, scenario.events);
    const scenarioResult = runCounterfactualSimulation(scenario.world, scenario.events, [
      {
        eventId: "A10",
        mode: "remove",
        delayMonths: 2,
        strengthMultiplier: 0.55,
      },
    ]);

    expect(baseResult.transitions.map((transition) => transition.toPhase)).toEqual([
      "Escalation Edge",
      "Structural Reclassification",
      "Fragmented Regime",
    ]);
    expect(scenarioResult.transitions.map((transition) => transition.toPhase)).toEqual([
      "Escalation Edge",
      "Structural Reclassification",
    ]);
  });

  it("does not trigger phase advancement on a single-month spike", () => {
    const rawTimeline: WorldStatePoint[] = [
      {
        month: 0,
        phase: "Escalating",
        metrics: { velocity: 35, density: 34, coherence: 58, reversibility: 78 },
        halo: {
          dominantOrientationColor: "#d5b349",
          momentum: 24,
          emergenceRatio: 15,
          evidentiaryMass: 18,
          instability: 22,
        },
        visibleEvents: [],
      },
      {
        month: 1,
        phase: "Escalating",
        metrics: { velocity: 72, density: 67, coherence: 31, reversibility: 24 },
        halo: {
          dominantOrientationColor: "#d5b349",
          momentum: 69,
          emergenceRatio: 42,
          evidentiaryMass: 38,
          instability: 74,
        },
        visibleEvents: [],
      },
      {
        month: 2,
        phase: "Escalating",
        metrics: { velocity: 38, density: 35, coherence: 54, reversibility: 76 },
        halo: {
          dominantOrientationColor: "#d5b349",
          momentum: 26,
          emergenceRatio: 16,
          evidentiaryMass: 20,
          instability: 24,
        },
        visibleEvents: [],
      },
    ];

    const result = adjudicatePhases(rawTimeline);
    expect(result.transitions).toHaveLength(0);
    expect(result.timeline[result.timeline.length - 1]?.phase).toBe("Escalating");
  });
});
