import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "docs", "assets", "inception-gate");
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl =
  process.env.BASE_URL ||
  "http://127.0.0.1:4173/?scenario=ai-sovereignty-compute-access&role=Executive&presentation=1&month=12&guideExpanded=0";

const shots = [
  {
    name: "console-landing.png",
    mode: "viewport",
  },
  {
    name: "console-time-replay.png",
    selector: "#demo-timeline-replay",
    mode: "selector",
  },
];

async function main() {
  await mkdir(outputDir, { recursive: true });
  console.log("capture:start");

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });
  console.log("capture:browser-ready");

  const page = await browser.newPage({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 2,
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#demo-world-overview", { timeout: 30000 });
  console.log("capture:page-ready");
  await page.addStyleTag({
    content: `
      .voiceover-panel,
      .command-bar,
      .access-gate {
        display: none !important;
      }
      body {
        background: #ece6db !important;
      }
    `,
  });

  for (const shot of shots) {
    console.log(`capture:shot:${shot.name}`);
    if (shot.mode === "viewport") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(outputDir, shot.name),
        clip: {
          x: 0,
          y: 0,
          width: 1600,
          height: 980,
        },
        animations: "disabled",
      });
      continue;
    }

    const locator = page.locator(shot.selector);
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) {
      throw new Error(`Could not resolve bounds for ${shot.selector}`);
    }
    await page.screenshot({
      path: path.join(outputDir, shot.name),
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: box.width,
        height: box.height,
      },
      animations: "disabled",
    });
  }

  await browser.close();
  console.log("capture:done");
  console.log(`Captured console screenshots in ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
