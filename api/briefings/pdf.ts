import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";
import type { ExportMode } from "../../src/features/export/types/export";
import {
  countPdfPages,
  measureRenderedLayout,
  validateRenderedBoardLayout,
  validateRenderedExecutiveLayout,
  validateRenderedPresentationLayout,
} from "../../src/features/export/utils/physicalLayoutValidation";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string | Buffer) => void;
};

interface PdfRequestBody {
  mode: ExportMode;
  html: string;
  filename: string;
  orientation?: "portrait" | "landscape";
}

const parseBody = (body: unknown): PdfRequestBody | null => {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as PdfRequestBody;
    } catch {
      return null;
    }
  }

  if (typeof body === "object" && body !== null) {
    return body as PdfRequestBody;
  }

  return null;
};

const buildPdfDocument = (html: string, mode: ExportMode, orientation: "portrait" | "landscape") => {
  const injection = `
      <style id="export-pdf-orientation">
        @page {
          size: ${orientation === "landscape" ? "letter landscape" : "letter portrait"};
          margin: 0;
        }
        :root {
          --page-width: ${orientation === "landscape" ? "11in" : "8.5in"};
          --page-height: ${orientation === "landscape" ? "8.5in" : "11in"};
        }
        html, body {
          margin: 0;
          min-height: 100%;
          background: #0c1117;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      </style>`;

  if (html.trim().startsWith("<!DOCTYPE html>")) {
    return html
      .replace("<head>", `<head>${injection}`)
      .replace("<body", `<body data-export-mode="${mode}" data-export-orientation="${orientation}"`);
  }

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      ${injection}
    </head>
    <body data-export-mode="${mode}" data-export-orientation="${orientation}">${html}</body>
  </html>`;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Content-Type", "application/json");
    response.status(405).send(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const payload = parseBody(request.body);
  if (!payload?.mode || !payload?.html || !payload.filename) {
    response.setHeader("Content-Type", "application/json");
    response.status(400).send(JSON.stringify({ error: "Missing mode, html, or filename." }));
    return;
  }

  const orientation = payload.orientation === "landscape" ? "landscape" : "portrait";

  let browser;
  try {
    browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage({
      viewport: {
        width: orientation === "landscape" ? 1440 : 1180,
        height: 1800,
      },
    });

    await page.emulateMedia({ media: "print" });
    await page.setContent(buildPdfDocument(payload.html, payload.mode, orientation), {
      waitUntil: "networkidle",
    });

    const renderDiagnostics = await measureRenderedLayout(page, payload.mode, orientation);
    const renderValidation =
      payload.mode === "board-onepager"
        ? validateRenderedBoardLayout(renderDiagnostics)
        : payload.mode === "presentation-brief"
          ? validateRenderedPresentationLayout(renderDiagnostics)
          : validateRenderedExecutiveLayout(renderDiagnostics);
    if (!renderValidation.ok) {
      response.setHeader("Content-Type", "application/json");
      response.status(422).send(
        JSON.stringify({
          error: "Rendered export layout failed physical validation.",
          issues: renderValidation.issues,
          diagnostics: renderValidation.diagnostics,
        }),
      );
      return;
    }

    const pageRanges =
      payload.mode === "board-onepager"
        ? "1"
        : `1-${renderValidation.diagnostics.wrapperCount}`;

    const pdf = await page.pdf({
      format: "Letter",
      landscape: orientation === "landscape",
      printBackground: true,
      tagged: false,
      outline: false,
      pageRanges,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      preferCSSPageSize: true,
    });

    const renderedPageCount = countPdfPages(pdf);
    if (payload.mode === "board-onepager" && renderedPageCount !== 1) {
      response.setHeader("Content-Type", "application/json");
      response.status(422).send(
        JSON.stringify({
          error: "Board export violated the one-page physical limit.",
          diagnostics: renderValidation.diagnostics,
          renderedPageCount,
        }),
      );
      return;
    }
    if (payload.mode === "presentation-brief" && renderedPageCount !== renderValidation.diagnostics.wrapperCount) {
      response.setHeader("Content-Type", "application/json");
      response.status(422).send(
        JSON.stringify({
          error: "Presentation slide page count does not match the rendered slide wrappers.",
          diagnostics: renderValidation.diagnostics,
          renderedPageCount,
        }),
      );
      return;
    }
    if (payload.mode === "executive-brief" && renderedPageCount > 6) {
      response.setHeader("Content-Type", "application/json");
      response.status(422).send(
        JSON.stringify({
          error: "Executive brief exceeded the six-page limit.",
          diagnostics: renderValidation.diagnostics,
          renderedPageCount,
        }),
      );
      return;
    }

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="${payload.filename}"`);
    response.status(200).send(Buffer.from(pdf));
  } catch (error) {
    response.setHeader("Content-Type", "application/json");
    response.status(500).send(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected PDF render failure.",
      }),
    );
  } finally {
    await browser?.close();
  }
}
