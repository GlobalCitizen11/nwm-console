import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const sourceHtml = path.join(rootDir, "docs", "inception-gate-deck.html");
const outputDir = path.join(rootDir, "docs");
const outputPdf = path.join(outputDir, "inception-gate-deck-print.pdf");

const candidateChromePaths = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);

async function findChromePath() {
  for (const candidate of candidateChromePaths) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next path
    }
  }

  throw new Error(
    "Chrome executable not found. Set CHROME_PATH or install Google Chrome in /Applications.",
  );
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const chromePath = await findChromePath();
  const fileUrl = `file://${sourceHtml}`;

  await new Promise((resolve, reject) => {
    const child = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        `--print-to-pdf=${outputPdf}`,
        fileUrl,
      ],
      { stdio: "inherit" },
    );

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`Chrome PDF export exited with code ${code ?? "unknown"}`));
    });
    child.on("error", reject);
  });

  console.log(`Exported normalized print PDF to ${outputPdf}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
