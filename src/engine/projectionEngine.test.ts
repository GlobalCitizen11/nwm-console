import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { buildConditionalProjection } from "./projectionEngine";
import { runWorldSimulation } from "./stateEngine";

const scenario = loadScenarioDataset(scenarioData);

describe("projection engine", () => {
  it("produces a bounded forward timeline with explicit assumptions", () => {
    const result = runWorldSimulation(scenario.world, scenario.events);
    const projection = buildConditionalProjection(result, 11);

    expect(projection.assumptions.horizonMonths).toBe(6);
    expect(projection.projectedTimeline).toHaveLength(6);
    expect(projection.currentPhase).toBe("Structural Reclassification");
    expect(projection.nextPhaseTarget).toBe("Fragmented Regime");
  });

  it("reports threshold proximity for the next phase", () => {
    const result = runWorldSimulation(scenario.world, scenario.events);
    const projection = buildConditionalProjection(result, 11);

    expect(projection.thresholdProximity.length).toBeGreaterThan(0);
    expect(projection.thresholdProximity.some((condition) => condition.label.includes("Density"))).toBe(true);
  });
});
