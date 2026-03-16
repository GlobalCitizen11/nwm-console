import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { applyCounterfactual, runCounterfactualSimulation } from "./counterfactualEngine";
import { runWorldSimulation } from "./stateEngine";

const scenario = loadScenarioDataset(scenarioData);

describe("counterfactual engine", () => {
  it("removes the selected artifact from the mutated event set", () => {
    const mutated = applyCounterfactual(scenario.events, [
      {
        eventId: "A10",
        mode: "remove",
        delayMonths: 2,
        strengthMultiplier: 0.55,
      },
    ]);

    expect(mutated.some((event) => event.id === "A10")).toBe(false);
    expect(mutated).toHaveLength(scenario.events.length - 1);
  });

  it("delays the selected artifact and keeps ordering stable", () => {
    const mutated = applyCounterfactual(scenario.events, [
      {
        eventId: "A10",
        mode: "delay",
        delayMonths: 3,
        strengthMultiplier: 0.55,
      },
    ]);
    const delayed = mutated.find((event) => event.id === "A10");

    expect(delayed?.month).toBe(15);
    expect(mutated.every((event, index, array) => index === 0 || array[index - 1].month <= event.month)).toBe(true);
  });

  it("reducing impact preserves the artifact but weakens its effect", () => {
    const mutated = applyCounterfactual(scenario.events, [
      {
        eventId: "A10",
        mode: "reduce",
        delayMonths: 2,
        strengthMultiplier: 0.35,
      },
    ]);
    const reduced = mutated.find((event) => event.id === "A10");
    const original = scenario.events.find((event) => event.id === "A10");

    expect(reduced?.metrics.velocity).toBeLessThan(original?.metrics.velocity ?? Infinity);
    expect(reduced?.metrics.density).toBeLessThan(original?.metrics.density ?? Infinity);
    expect(reduced?.metrics.reversibility).toBeGreaterThan(original?.metrics.reversibility ?? -Infinity);
  });

  it("recomputes a different phase path when the selected artifact is removed", () => {
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

  it("applies multiple artifact changes in a single bounded scenario", () => {
    const mutated = applyCounterfactual(scenario.events, [
      {
        eventId: "A10",
        mode: "remove",
        delayMonths: 2,
        strengthMultiplier: 0.55,
      },
      {
        eventId: "A12",
        mode: "delay",
        delayMonths: 2,
        strengthMultiplier: 0.55,
      },
    ]);

    expect(mutated.some((event) => event.id === "A10")).toBe(false);
    expect(mutated.find((event) => event.id === "A12")?.month).toBe(17);
  });
});
