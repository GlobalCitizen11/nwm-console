import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { runWorldSimulation } from "../engine/stateEngine";
import { buildLocalNwmConsolePayload } from "./buildLocalNwmConsole";
import { SYSTEM_LABELS } from "./systemLabels";

const scenario = loadScenarioDataset(scenarioData);
const result = runWorldSimulation(scenario.world, scenario.events);

const makePayload = (
  month: number,
  viewOverrides: Partial<Parameters<typeof buildLocalNwmConsolePayload>[0]["currentView"]> = {},
) =>
  buildLocalNwmConsolePayload({
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
      ...viewOverrides,
    },
  });

describe("buildLocalNwmConsolePayload", () => {
  it("builds a full local console output for a structurally valid executive state", () => {
    const payload = makePayload(18);
    const executive = payload.tabs.find((tab) => tab.id === "executive")?.text ?? "";
    const onePager = payload.tabs.find((tab) => tab.id === "one-pager")?.text ?? "";

    expect(payload.briefStatus).toBe("Exportable");
    expect(payload.adjudicationStatus).toBe(`${SYSTEM_LABELS.PAL} active`);
    expect(payload.tabs.map((tab) => tab.id)).toEqual(["executive", "one-pager"]);
    expect(executive).toContain("1. STATE AT A GLANCE");
    expect(executive).toContain("10. TRACEABILITY + AUDIT LAYER");
    expect(executive).not.toContain("11. PRE-GCS SENSITIVITY LAYER");
    expect(onePager).toContain("9. ONE-PAGER");
  });

  it("surfaces provisional sensitivity output when the phase is not yet adjudication-layer resolved", () => {
    const payload = makePayload(1);
    const executive = payload.tabs.find((tab) => tab.id === "executive")?.text ?? "";

    expect(payload.briefStatus).toBe("Withheld");
    expect(payload.adjudicationStatus).toBe(`Provisional (pre-${SYSTEM_LABELS.PAL})`);
    expect(payload.withheldReason).toContain("Phase adjudicated");
    expect(executive).toContain("Executive Brief Status: Withheld");
    expect(executive).toContain(`Adjudication Status: Provisional (pre-${SYSTEM_LABELS.PAL})`);
    expect(executive).toContain("11. PRE-GCS SENSITIVITY LAYER");
  });
});
