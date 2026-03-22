import { browserPrintFallback } from "./browserPrintFallback";
import { playwrightPdf } from "./playwrightPdf";

export async function generateExecutiveBriefPdf(html: string, filename: string) {
  try {
    await playwrightPdf({ mode: "executive-brief", html, filename, orientation: "portrait" });
  } catch {
    browserPrintFallback();
  }
}
