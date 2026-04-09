import { describe, expect, it } from "vitest";
import scenarioData from "../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../data/schema";
import { runWorldSimulation } from "../engine/stateEngine";
import { buildLocalNwmConsolePdfFilename, buildLocalNwmConsolePdfHtml } from "./localNwmConsolePdf";

const scenario = loadScenarioDataset(scenarioData);
const result = runWorldSimulation(scenario.world, scenario.events);

const baseRequest = {
  scenarioLabel: "Capital Fragmentation",
  result,
  point: result.timeline[18]!,
  currentView: {
    id: "view-18",
    name: "Current View",
    scenarioId: "capital-fragmentation",
    role: "Executive",
    month: 18,
    eventId: null,
    transitionId: null,
    compareScenarioId: null,
  },
} as const;

describe("localNwmConsolePdf", () => {
  it("builds a stable filename for the selected local console tab", () => {
    expect(
      buildLocalNwmConsolePdfFilename({
        scenarioId: "capital-fragmentation",
        month: 18,
        tabId: "one-pager",
      }),
    ).toBe("capital-fragmentation-local-console-one-pager-m18.pdf");
  });

  it("renders a stylized executive brief pdf document", () => {
    const html = buildLocalNwmConsolePdfHtml({
      ...baseRequest,
      tabId: "executive",
    });

    expect(html).toContain("Local Executive Brief");
    expect(html).toContain("State At A Glance");
    expect(html).toContain("Traceability, Audit, And Constraint Encoding");
    expect(html).toContain("export-page-frame");
  });

  it("renders a stylized one pager pdf document", () => {
    const html = buildLocalNwmConsolePdfHtml({
      ...baseRequest,
      tabId: "one-pager",
    });

    expect(html).toContain("Local One Pager");
    expect(html).toContain("Board-ready orientation sheet");
    expect(html).toContain("Evidence Anchors");
    expect(html).toContain("Page 1 of 1");
  });
});
