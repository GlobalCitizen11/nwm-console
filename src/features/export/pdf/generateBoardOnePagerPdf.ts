import { browserPrintFallback } from "./browserPrintFallback";
import { playwrightPdf } from "./playwrightPdf";

export async function generateBoardOnePagerPdf(html: string, filename: string) {
  try {
    await playwrightPdf({ mode: "board-onepager", html, filename, orientation: "portrait" });
  } catch {
    browserPrintFallback();
  }
}
