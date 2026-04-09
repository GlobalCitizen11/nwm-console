import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  buildBriefImportDraft,
  buildImportedScenarioFromBriefDraft,
  buildScenarioDatasetFromBriefImportDraft,
  extractBriefTextFromFile,
} from "./briefImport";

describe("brief import", () => {
  it("extracts a reviewable draft from a dated brief", () => {
    const text = `
AI Compute Access Brief
As of March 2026
Domain: Policy, Infrastructure, Sovereign
Geography: United States / European Union / China

Summary: Cross-border compute access is tightening as export controls, sovereign buildouts, and cloud allocation decisions begin to reinforce one another.

January 14, 2025 - United States expands export licensing to advanced accelerator shipments. Source: Commerce Department Confidence: high Severity: high

March 2, 2025 - European Commission launches a sovereign compute facility program for high-priority workloads. Source: European Commission Confidence: high Severity: medium

June 2025 - Major hyperscaler restricts premium regional capacity allocation for sensitive accounts. Source: Company filing Severity: medium

Q4 2025 - China issues national guidance tying frontier model deployment to domestic infrastructure assurance. Source: State Council Confidence: medium Severity: high
`;

    const draft = buildBriefImportDraft({
      fileName: "compute-brief.txt",
      text,
      format: "text",
    });

    expect(draft.world.name).toBe("AI Compute Access Brief");
    expect(draft.world.geography).toContain("United States");
    expect(draft.world.sourceClasses).toContain("infrastructure");
    expect(draft.events).toHaveLength(4);
    expect(draft.events[0]?.date).toBe("2025-01-14");
    expect(draft.events[1]?.eventType).toBe("infrastructure");
    expect(draft.events[3]?.date).toBe("2025-10-01");
  });

  it("assigns synthetic dates when the brief has chronology but no explicit dates", () => {
    const text = `
Semiconductor Resilience Brief

Overview: The brief tracks supply access stress, sovereign intervention, and infrastructure repricing across the same operating boundary.

- Washington signals tighter review of fab equipment licenses for strategic destinations.

- A regional cloud provider opens reserved domestic capacity for public-sector AI programs.

- Major customers begin shifting procurement windows to reduce single-vendor dependency.

- National lawmakers open a fast-track package for domestic packaging and testing incentives.
`;

    const draft = buildBriefImportDraft({
      fileName: "resilience-brief.md",
      text,
      format: "markdown",
    });

    expect(draft.events).toHaveLength(4);
    expect(draft.events.every((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.date))).toBe(true);
    expect(draft.warnings.some((warning) => warning.includes("Synthetic month-order dates"))).toBe(true);

    const dataset = buildScenarioDatasetFromBriefImportDraft(draft);
    expect(dataset.world.name).toBe("Semiconductor Resilience Brief");
    expect(dataset.events.length).toBe(5);
    expect(dataset.events[0]?.id).toBe("T0");
  });

  it("builds an importable scenario directly from a brief draft", () => {
    const draft = buildBriefImportDraft({
      fileName: "compute-brief.txt",
      text: `
AI Compute Access Brief

Summary: Cross-border compute access is tightening as export controls, sovereign buildouts, and cloud allocation decisions reinforce one another.

January 14, 2025 - United States expands export licensing to advanced accelerator shipments.

March 2, 2025 - European Commission launches a sovereign compute facility program for high-priority workloads.
`,
      format: "text",
    });

    const result = buildImportedScenarioFromBriefDraft({
      draft,
      id: "imported-test",
    });

    expect(result.scenario.id).toBe("imported-test");
    expect(result.scenario.dataset.world.name).toBe("AI Compute Access Brief");
    expect(result.scenario.dataset.events.length).toBeGreaterThan(0);
    expect(result.normalizedDraft.events.length).toBeGreaterThan(0);
  });

  it("extracts prose blocks as fallback event candidates when the brief is narrative but undated", () => {
    const text = `
Strategic Compute Access Review

Overview: Export controls, sovereign infrastructure programs, and vendor concentration are converging into a tighter operating environment for frontier model deployment.

Major buyers are restructuring procurement around domestic capacity guarantees and pre-cleared supply paths to reduce exposure to licensing shocks.

Cloud and semiconductor partners are shifting premium allocation toward customers with stronger compliance posture and national alignment requirements.
`;

    const draft = buildBriefImportDraft({
      fileName: "compute-review.txt",
      text,
      format: "text",
    });

    expect(draft.events.length).toBeGreaterThan(0);
    expect(draft.events[0]?.title.length).toBeGreaterThan(0);
    expect(draft.warnings.some((warning) => warning.includes("Synthetic month-order dates"))).toBe(true);
  });

  it("returns a review draft with warnings when no event candidates can be inferred", () => {
    const text = `
Title: Investor Brief Portal
Domain: Access
Geography: Global
Summary: Report access only.
`;

    const draft = buildBriefImportDraft({
      fileName: "portal.txt",
      text,
      format: "text",
    });

    expect(draft.events).toHaveLength(0);
    expect(draft.warnings.some((warning) => warning.includes("No event candidates were detected automatically"))).toBe(true);
  });

  it("extracts text from machine-generated PDFs", async () => {
    const content = `BT
/F1 12 Tf
72 720 Td
(AI Compute Access Brief) Tj
0 -20 Td
(January 14, 2025 - United States expands export licensing.) Tj
0 -20 Td
(Source: Commerce Department) Tj
ET`;
    const compressed = deflateSync(Buffer.from(content, "latin1"));
    const pdf = Buffer.concat([
      Buffer.from("%PDF-1.4\n1 0 obj\n<< /Length ", "latin1"),
      Buffer.from(String(compressed.length), "latin1"),
      Buffer.from(" /Filter /FlateDecode >>\nstream\n", "latin1"),
      compressed,
      Buffer.from("\nendstream\nendobj\n%%EOF", "latin1"),
    ]);

    const file = new File([pdf], "brief.pdf", { type: "application/pdf" });
    const extracted = await extractBriefTextFromFile(file);

    expect(extracted.format).toBe("pdf");
    expect(extracted.text).toContain("AI Compute Access Brief");
    expect(extracted.text).toContain("January 14, 2025");

    const draft = buildBriefImportDraft({
      fileName: "brief.pdf",
      text: extracted.text,
      format: extracted.format,
    });
    expect(draft.events.length).toBeGreaterThan(0);
  });

  it("detects PDFs even when the remote file name and content type are generic", async () => {
    const content = `BT
/F1 12 Tf
72 720 Td
(Capital Access Brief) Tj
0 -20 Td
(January 14, 2025 - Export restrictions tighten.) Tj
ET`;
    const compressed = deflateSync(Buffer.from(content, "latin1"));
    const pdf = Buffer.concat([
      Buffer.from("%PDF-1.4\n1 0 obj\n<< /Length ", "latin1"),
      Buffer.from(String(compressed.length), "latin1"),
      Buffer.from(" /Filter /FlateDecode >>\nstream\n", "latin1"),
      compressed,
      Buffer.from("\nendstream\nendobj\n%%EOF", "latin1"),
    ]);

    const file = new File([pdf], "download", { type: "application/octet-stream" });
    const extracted = await extractBriefTextFromFile(file);

    expect(extracted.format).toBe("pdf");
    expect(extracted.text).toContain("Capital Access Brief");
    expect(extracted.text).toContain("January 14, 2025");
  });

  it("falls back to HTML metadata when the page body is sparse", async () => {
    const file = new File(
      [
        `<!doctype html>
<html lang="en">
  <head>
    <title>AI Compute Access Brief</title>
    <meta name="description" content="January 14, 2025 - The United States expands export licensing for advanced accelerators." />
  </head>
  <body></body>
</html>`,
      ],
      "download",
      { type: "application/octet-stream" },
    );

    const extracted = await extractBriefTextFromFile(file);

    expect(extracted.format).toBe("html");
    expect(extracted.text).toContain("AI Compute Access Brief");
    expect(extracted.text).toContain("January 14, 2025");
  });
});
