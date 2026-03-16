import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { buildNarrativeTopology } from "./topologyEngine";

const scenario = loadScenarioDataset(scenarioData);

describe("topology engine", () => {
  it("produces stable layout coordinates for the same input", () => {
    const first = buildNarrativeTopology(scenario.events.slice(0, 8));
    const second = buildNarrativeTopology(scenario.events.slice(0, 8));

    expect(first.links).toEqual(second.links);
    expect(first.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y }))).toEqual(
      second.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    );
  });
});
