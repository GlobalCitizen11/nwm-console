import { describe, expect, it } from "vitest";
import scenarioAISovereigntyData from "../../data/scenarioAISovereigntyComputeAccess.json";
import scenarioCapitalFragmentationData from "../../data/scenarioCapitalFragmentation.json";
import scenarioDigitalAssetsData from "../../data/scenarioDigitalAssets.json";
import scenarioEpsteinDisclosureData from "../../data/scenarioEpsteinDisclosure.json";
import scenarioSupplyChainRealignmentData from "../../data/scenarioSupplyChainRealignment.json";
import { loadScenarioDataset } from "../../data/schema";
import { runWorldSimulation } from "../../engine/stateEngine";
import { buildExecutiveBriefReadinessTimeline } from "./utils/executiveBriefReadiness";

const scenarioFixtures = [
  { label: "AI Sovereignty Compute Access", raw: scenarioAISovereigntyData, scenarioId: "ai-sovereignty" },
  { label: "Capital Fragmentation", raw: scenarioCapitalFragmentationData, scenarioId: "capital-fragmentation" },
  { label: "Digital Assets", raw: scenarioDigitalAssetsData, scenarioId: "digital-assets" },
  { label: "Epstein Disclosure", raw: scenarioEpsteinDisclosureData, scenarioId: "epstein-disclosure" },
  { label: "Supply Chain Realignment", raw: scenarioSupplyChainRealignmentData, scenarioId: "supply-chain-realignment" },
].map((fixture) => {
  const scenario = loadScenarioDataset(fixture.raw);
  const result = runWorldSimulation(scenario.world, scenario.events);
  return {
    ...fixture,
    scenario,
    result,
    lastMonth: result.timeline.length - 1,
  };
});

const expectedFirstValidMonths: Record<(typeof scenarioFixtures)[number]["label"], string> = {
  "AI Sovereignty Compute Access": "M5",
  "Capital Fragmentation": "M10",
  "Digital Assets": "M3",
  "Epstein Disclosure": "M5",
  "Supply Chain Realignment": "M3",
};

const buildReadiness = (
  fixture: (typeof scenarioFixtures)[number],
  viewOverrides: {
    role?: string;
    name?: string;
  } = {},
) =>
  buildExecutiveBriefReadinessTimeline({
    scenarioName: fixture.label,
    scenarioId: fixture.scenarioId,
    result: fixture.result,
    viewOverrides,
  });

describe("executive brief calibration matrix", () => {
  it.each(scenarioFixtures)("withholds the earliest state for $label", (fixture) => {
    const readiness = buildReadiness(fixture);
    const firstPoint = readiness.points[1] ?? readiness.points[0]!;

    expect(firstPoint.validity).toBe("Structurally Incomplete");
    expect(firstPoint.exportable).toBe(false);
  });

  it.each(scenarioFixtures)("withholds non-executive late views for $label", (fixture) => {
    const readiness = buildReadiness(fixture, {
      role: "Operations",
      name: "Operations",
    });
    const latePoint = readiness.points[fixture.lastMonth]!;

    expect(latePoint.validity).toBe("Structurally Incomplete");
    expect(latePoint.exportable).toBe(false);
    expect(latePoint.withheldReason).toContain("Executive Briefs can only be generated from Executive view.");
  });

  it.each(scenarioFixtures)("exports a valid late executive brief for $label", (fixture) => {
    const readiness = buildReadiness(fixture);
    const latePoint = readiness.points[fixture.lastMonth]!;

    expect(fixture.result.transitions.length).toBeGreaterThan(0);
    expect(latePoint.validity).toBe("Structurally Valid");
    expect(latePoint.exportable).toBe(true);
    expect(latePoint.qaOk).toBe(true);
  });

  it.each(scenarioFixtures)("captures readiness windows for $label", (fixture) => {
    const readiness = buildReadiness(fixture);
    const lastWindow = readiness.readinessWindows[readiness.readinessWindows.length - 1];

    expect(readiness.firstValidLabel).toBe(expectedFirstValidMonths[fixture.label]);
    expect(readiness.validMonths.length).toBeGreaterThan(0);
    expect(readiness.readinessWindows[0]?.startLabel).toBe(expectedFirstValidMonths[fixture.label]);
    expect(lastWindow?.endMonth).toBe(fixture.lastMonth);
  });

  it("flags the first valid month for each bundled scenario", () => {
    const firstValidMonths = Object.fromEntries(
      scenarioFixtures.map((fixture) => {
        const readiness = buildReadiness(fixture);
        return [fixture.label, readiness.firstValidLabel];
      }),
    );

    expect(firstValidMonths).toEqual(expectedFirstValidMonths);
  });
});
