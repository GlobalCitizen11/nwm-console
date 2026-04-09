import { describe, expect, it, vi } from "vitest";
import { launchHeadlessBrowser } from "./browser";
import { extractStaticWebPageText, extractWebPageText, shouldRenderHtmlPage } from "./webPageText";

vi.mock("./browser", () => ({
  launchHeadlessBrowser: vi.fn(),
}));

const launchHeadlessBrowserMock = vi.mocked(launchHeadlessBrowser);

describe("web page text extraction", () => {
  it("extracts readable text from static HTML", () => {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <title>AI Compute Access Brief</title>
    <meta name="description" content="January 14, 2025 - Export controls tighten for advanced accelerators." />
  </head>
  <body>
    <main>
      <h1>AI Compute Access Brief</h1>
      <p>January 14, 2025 - Export controls tighten for advanced accelerators.</p>
      <p>Major buyers are restructuring procurement around domestic capacity guarantees.</p>
    </main>
  </body>
</html>`;

    const extracted = extractStaticWebPageText(html);

    expect(extracted).toContain("AI Compute Access Brief");
    expect(extracted).toContain("January 14, 2025");
    expect(extracted).toContain("domestic capacity guarantees");
  });

  it("flags app-shell pages for rendered extraction", () => {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <title>Cropper AI Development Agency</title>
    <meta name="description" content="AI Impact Briefing" />
    <script type="module" src="/assets/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    expect(shouldRenderHtmlPage(html, extractStaticWebPageText(html))).toBe(true);
  });

  it("uses rendered-page text when a JS-heavy page has richer content after rendering", async () => {
    const page = {
      goto: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(`
AI Compute Access Brief

January 14, 2025 - Export controls tighten for advanced accelerators.

Major buyers are restructuring procurement around domestic capacity guarantees to reduce licensing shock exposure.

Cloud and semiconductor partners are shifting premium allocation toward stronger compliance posture.
`),
    };
    const context = {
      route: vi.fn().mockResolvedValue(undefined),
      newPage: vi.fn().mockResolvedValue(page),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const browser = {
      newContext: vi.fn().mockResolvedValue(context),
      close: vi.fn().mockResolvedValue(undefined),
    };
    launchHeadlessBrowserMock.mockResolvedValue(browser as never);

    const result = await extractWebPageText({
      html: `<!doctype html><html><head><title>Cropper AI Development Agency</title><script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>`,
      url: new URL("https://www.aiimpact.dev/"),
      validateUrl: async (candidate) => (candidate instanceof URL ? candidate : new URL(candidate)),
      timeoutMs: 5000,
    });

    expect(result).toMatchObject({
      extractionStrategy: "html-rendered",
    });
    expect(result?.extractedText).toContain("January 14, 2025");
    expect(page.goto).toHaveBeenCalledWith("https://www.aiimpact.dev/", expect.objectContaining({ waitUntil: "domcontentloaded" }));
  });
});
