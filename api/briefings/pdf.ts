import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

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

const buildPdfDocument = (html: string, orientation: "portrait" | "landscape") => {
  if (html.trim().startsWith("<!DOCTYPE html>")) {
    return html;
  }

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @page {
          size: ${orientation === "landscape" ? "letter landscape" : "letter portrait"};
          margin: 0;
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
      </style>
    </head>
    <body>${html}</body>
  </html>`;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Content-Type", "application/json");
    response.status(405).send(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const payload = parseBody(request.body);
  if (!payload?.html || !payload.filename) {
    response.setHeader("Content-Type", "application/json");
    response.status(400).send(JSON.stringify({ error: "Missing html or filename." }));
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

    await page.setContent(buildPdfDocument(payload.html, orientation), {
      waitUntil: "networkidle",
    });

    const pdf = await page.pdf({
      format: "Letter",
      landscape: orientation === "landscape",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      preferCSSPageSize: true,
    });

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
