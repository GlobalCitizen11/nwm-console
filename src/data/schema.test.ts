import { describe, expect, it } from "vitest";
import scenarioData from "./scenarioCapitalFragmentation.json";
import aiSovereigntyScenario from "./aiSovereigntyScenario";
import { loadScenarioDataset } from "./schema";

describe("scenario schema", () => {
  it("loads the seeded dataset", () => {
    const scenario = loadScenarioDataset(scenarioData);
    expect(scenario.events[0]?.id).toBe("T0");
    expect(scenario.events[scenario.events.length - 1]?.id).toBe("A14");
  });

  it("loads the AI sovereignty scenario built from source world and event inputs", () => {
    const scenario = loadScenarioDataset(aiSovereigntyScenario);
    expect(scenario.world.name).toBe("AI Sovereignty and Compute Access");
    expect(scenario.events[1]?.title).toMatch(/Export Controls/);
    expect(scenario.events[4]?.title).toMatch(/Strategic Infrastructure/);
  });

  it("rejects malformed scenario data", () => {
    expect(() =>
      loadScenarioDataset({
        world: {
          name: "Broken",
          domain: "Test",
          geography: "Test",
          timeHorizonMonths: 18,
          governanceMode: "Institutional",
          boundedDescription: "Broken",
          summary: "Broken",
        },
        events: [
          {
            id: "X1",
            month: "bad",
          },
        ],
      }),
    ).toThrow(/Scenario dataset validation failed/);
  });
});
