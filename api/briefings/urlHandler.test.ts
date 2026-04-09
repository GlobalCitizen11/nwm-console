import { afterEach, describe, expect, it, vi } from "vitest";
import { execFile } from "node:child_process";
import { lookup } from "node:dns/promises";
import { handleBriefingUrlRequest } from "./urlHandler";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

const execFileMock = vi.mocked(execFile);
const lookupMock = vi.mocked(lookup);

describe("briefings url handler", () => {
  afterEach(() => {
    execFileMock.mockReset();
    lookupMock.mockReset();
    vi.restoreAllMocks();
  });

  it("fetches a supported public URL and returns a base64 document payload", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Executive brief body", {
        status: 200,
        headers: {
          "content-type": "text/plain",
        },
      }),
    );

    const result = await handleBriefingUrlRequest({ url: "https://example.com/brief" });

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({
      finalUrl: "https://example.com/brief",
      contentType: "text/plain",
      fileName: "remote-brief.txt",
    });
    expect(typeof result.payload.dataBase64).toBe("string");
  });

  it("extracts normalized webpage text for HTML URLs", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        `<!doctype html>
<html lang="en">
  <head>
    <title>AI Compute Access Brief</title>
    <meta name="description" content="January 14, 2025 - Export controls tighten for advanced accelerators." />
  </head>
  <body>
    <main>
      <h1>AI Compute Access Brief</h1>
      <p>January 14, 2025 - Export controls tighten for advanced accelerators across multiple jurisdictions and supplier tiers.</p>
      <p>Major buyers are restructuring procurement around domestic capacity guarantees to reduce licensing shock exposure.</p>
      <p>Cloud and semiconductor partners are shifting premium allocation toward stronger compliance posture and strategic alignment requirements.</p>
      <p>Institutions are revisiting contingency plans, vendor concentration, and sovereign compute infrastructure assumptions.</p>
    </main>
  </body>
</html>`,
        {
          status: 200,
          headers: {
            "content-type": "text/html",
          },
        },
      ),
    );

    const result = await handleBriefingUrlRequest({ url: "https://example.com/brief" });

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({
      finalUrl: "https://example.com/brief",
      contentType: "text/html",
      extractedFormat: "text",
      extractionStrategy: "html-static",
    });
    expect(result.payload.extractedText).toContain("January 14, 2025");
  });

  it("rejects local network targets", async () => {
    const result = await handleBriefingUrlRequest({ url: "http://127.0.0.1/private" });

    expect(result.statusCode).toBe(403);
    expect(result.payload.error).toBe("Private or local network URLs are not allowed.");
  });

  it("falls back to curl when Node fetch fails certificate validation", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);

    const fetchError = new TypeError("fetch failed") as TypeError & {
      cause?: { code?: string; message?: string };
    };
    fetchError.cause = {
      code: "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
      message: "unable to get local issuer certificate",
    };

    vi.spyOn(globalThis, "fetch").mockRejectedValue(fetchError);
    execFileMock.mockImplementation((...args) => {
      const callback = args[args.length - 1] as (error: Error | null, stdout: Buffer, stderr: Buffer) => void;
      callback(
        null,
        Buffer.from("HTTP/1.1 200 OK\r\ncontent-type: text/plain\r\n\r\nCurl brief body"),
        Buffer.alloc(0),
      );
      return {} as never;
    });

    const result = await handleBriefingUrlRequest({ url: "https://example.com/brief" });

    expect(result.statusCode).toBe(200);
    expect(execFileMock).toHaveBeenCalled();
    expect(result.payload).toMatchObject({
      finalUrl: "https://example.com/brief",
      contentType: "text/plain",
      fileName: "remote-brief.txt",
    });
    expect(typeof result.payload.dataBase64).toBe("string");
  });
});
