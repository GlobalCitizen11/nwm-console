import { describe, expect, it } from "vitest";
import scenarioData from "../../data/scenarioCapitalFragmentation.json";
import { loadScenarioDataset } from "../../data/schema";
import { runWorldSimulation } from "../../engine/stateEngine";
import { extractBriefingState } from "../../utils/briefingArtifacts";
import { buildExportBundle } from "./ExportEngine";
import { normalizeExportData } from "./utils/normalizeExportData";
import { buildCanonicalSummary } from "./utils/canonicalSummary";
import { renderBoardOnePager, renderExecutiveBrief, renderPresentationBrief } from "./utils/renderArtifactContent";
import { validateBoardOnePager, validateCanonicalSummary, validateExecutiveBrief, validatePresentationBrief } from "./utils/validateArtifacts";

const scenario = loadScenarioDataset(scenarioData);
const result = runWorldSimulation(scenario.world, scenario.events);

const makeExportData = (
  month: number,
  viewOverrides: Partial<Parameters<typeof extractBriefingState>[0]["currentView"]> = {},
) =>
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
        ...viewOverrides,
      },
    }),
    viewOverrides.name ?? "Executive",
  );

describe("export pipeline", () => {
  it("exposes the additive V2 briefing layer without replacing core replay outputs", () => {
    const data = makeExportData(18);

    expect(data.v2.artifactRecords.length).toBeGreaterThan(0);
    expect(data.v2.stateVector.basis).toBe("deterministic-replay");
    expect(data.v2.phaseResolution.adjudicationStatus).toBe("pal-like-threshold");
    expect(data.v2.artifactStateMapping.length).toBeGreaterThan(0);
    expect(data.v2.temporalSpine.length).toBeGreaterThan(0);
    expect(data.v2.preGcsSensitivity.enabled).toBe(true);
  });

  it("builds a canonical summary that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const qa = validateCanonicalSummary(summary);

    expect(qa.ok).toBe(true);
    expect(summary.stateVector.basis).toBe("deterministic-replay");
    expect(summary.phaseResolution.adjudicationStatus).toBe("pal-like-threshold");
    expect(summary.artifactStateMapping.length).toBeGreaterThan(0);
    expect(summary.temporalSpine.length).toBeGreaterThan(0);
    expect(summary.preGcsSensitivity.reason).toContain("threshold-based");
  });

  it("builds a board one-pager that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const board = renderBoardOnePager(summary);
    const qa = validateBoardOnePager(board);

    expect(qa.ok).toBe(true);
    expect(board.evidenceAnchors).toHaveLength(3);
    expect(board.v2.stateVector.basis).toBe("deterministic-replay");
    expect(board.v2.phaseResolution.adjudicationStatus).toBe("pal-like-threshold");
    expect(board.v2.proofSummary).toContain("Proof");
  });

  it("builds an executive brief that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const executive = renderExecutiveBrief(summary);
    const qa = validateExecutiveBrief(executive);

    expect(qa.ok).toBe(true);
    expect(executive.v2.stateVector.basis).toBe("deterministic-replay");
    expect(executive.v2.phaseResolution.adjudicationStatus).toBe("pal-like-threshold");
    expect(executive.v2.artifactStateMapping.length).toBeGreaterThan(0);
    expect(executive.v2.temporalSpine.length).toBeGreaterThan(0);
    expect(executive.v2.preGcsSensitivity.enabled).toBe(true);
  });

  it("builds a presentation brief that passes validation", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const presentation = renderPresentationBrief(summary);
    const qa = validatePresentationBrief(presentation);

    expect(qa.ok).toBe(true);
    expect(presentation.slides.length).toBeGreaterThanOrEqual(7);
    expect(presentation.slides.length).toBeLessThanOrEqual(9);
    expect(presentation.slides.map((slide) => slide.title)).toEqual(
      expect.arrayContaining([
        "State Vector",
        "Adjudication Status",
        "Artifact Traceability",
        "Temporal Spine",
        "Proof Scaffold",
        "Pre-GCS Sensitivity",
      ]),
    );
  });

  it("withholds the executive brief when category separation fails", () => {
    const bundle = buildExportBundle({
      data: makeExportData(18, {
        role: "Operations",
        name: "Operations",
      }),
      scenarioId: "capital-fragmentation",
      month: 18,
    });

    expect(bundle.availabilityByMode["executive-brief"].exportable).toBe(false);
    expect(bundle.availabilityByMode["executive-brief"].reason).toContain("Category separation maintained");
    expect(bundle.contentByMode["executive-brief"].spec.header.validityLabel.value).toContain("Structurally Incomplete");
  });

  it("withholds the executive brief when the state is too thin for PAL orientation", () => {
    const bundle = buildExportBundle({
      data: makeExportData(1),
      scenarioId: "capital-fragmentation",
      month: 1,
    });

    expect(bundle.availabilityByMode["executive-brief"].exportable).toBe(false);
    expect(bundle.availabilityByMode["executive-brief"].reason).toContain("Phase adjudicated");
    expect(bundle.availabilityByMode["executive-brief"].reason).toContain("Proof objects sufficient");
  });

  it("rejects predictive language if executive copy drifts out of interpretation-layer mode", () => {
    const summary = buildCanonicalSummary(makeExportData(18));
    const executive = renderExecutiveBrief(summary);
    executive.spec.forwardOrientation.primaryPathParagraph.value = "This will likely accelerate next month across the boundary.";
    const qa = validateExecutiveBrief(executive);

    expect(qa.ok).toBe(false);
    expect(qa.issues.some((issue) => issue.message.includes("orientation-only"))).toBe(true);
  });
});
