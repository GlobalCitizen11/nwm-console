import { browserPrintFallback } from "./browserPrintFallback";
import { playwrightPdf } from "./playwrightPdf";

export async function generatePresentationBriefPdf(html: string, filename: string) {
  try {
    await playwrightPdf({ mode: "presentation-brief", html, filename, orientation: "landscape" });
  } catch {
    browserPrintFallback();
  }
}
