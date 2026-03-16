import { describe, expect, it } from "vitest";
import { buildNarrationPrompt } from "./openaiNarration";

describe("buildNarrationPrompt", () => {
  it("includes governance-safe narration constraints and section state", () => {
    const prompt = buildNarrationPrompt({
      sectionTitle: "HALO Orientation",
      role: "Executive",
      mode: "detailed",
      worldBoundaryContext: "World name: Capital Fragmentation Simulation | Domain: Sovereign capital alignment",
      summary: "Summarizes orientation signals.",
      currentState: "Momentum is 72 and instability is 64.",
      businessUse: "Supports timing of review.",
      decisionGuidance: "May warrant escalation review.",
    });

    expect(prompt).toContain("HALO Orientation");
    expect(prompt).toContain("Momentum is 72 and instability is 64.");
    expect(prompt).toContain("may warrant");
    expect(prompt).toContain("do not claim certainty");
    expect(prompt).toContain("Do not say the system predicts behavior");
    expect(prompt).toContain("Do not sound scripted, templated, or repetitive across sections or repeated clicks.");
    expect(prompt).toContain("Visible state and signals:");
    expect(prompt).toContain("Section lens:");
    expect(prompt).toContain("Interpretive angle for this brief:");
    expect(prompt).toContain("how it can help the company make a better governed decision");
    expect(prompt).toContain("what structural inference is reasonable");
  });
});
