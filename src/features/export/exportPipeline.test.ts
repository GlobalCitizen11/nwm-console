import { describe, expect, it } from "vitest";
import scenarioData from "../../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../../data/schema";
import { runWorldSimulation } from "../../engine/stateEngine";
import { extractBriefingState } from "../../utils/briefingArtifacts";
import { normalizeExportData } from "./utils/normalizeExportData";
import { buildCanonicalSummary } from "./utils/canonicalSummary";
import { renderBoardOnePager, renderExecutiveBrief, renderPresentationBrief } from "./utils/renderArtifactContent";
import { validateBoardOnePager, validateCanonicalSummary, validateExecutiveBrief, validatePresentationBrief } from "./utils/validateArtifacts";

const scenario = loadScenarioDataset(scenarioData);
const result = runWorldSimulation(scenario.world, scenario.events);

const makeExportData = (month: number) =>
  normalizeExportData(
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
    }),
    "Executive",
  );

describe("export pipeline", () => {
  it("builds a canonical summary that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const qa = validateCanonicalSummary(summary);

    expect(qa.ok).toBe(true);
  });

  it("builds a board one-pager that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const board = renderBoardOnePager(summary);
    const qa = validateBoardOnePager(board);

    expect(qa.ok).toBe(true);
    expect(board.evidenceAnchors).toHaveLength(3);
  });

  it("builds an executive brief that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const executive = renderExecutiveBrief(summary);
    const qa = validateExecutiveBrief(executive);

    expect(qa.ok).toBe(true);
    expect(executive.fieldPack.pageModel.page1).toEqual(["header", "systemStateOverview"]);
    expect(executive.fieldPack.pageModel.page2).toEqual(["narrativeDevelopment", "structuralInterpretation"]);
    expect(executive.fieldPack.pageModel.page3).toEqual(["forwardOrientation", "strategicPositioning", "evidenceBase"]);
  });

  it("builds a presentation brief that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const presentation = renderPresentationBrief(summary);
    const qa = validatePresentationBrief(presentation);

    expect(qa.ok).toBe(true);
    expect(presentation.slides.length).toBeGreaterThanOrEqual(7);
    expect(presentation.slides.length).toBeLessThanOrEqual(9);
  });
});
