import { access } from "node:fs/promises";
import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

const LOCAL_BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROME_BIN,
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((value): value is string => Boolean(value));

const canExecute = async (path: string) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const resolveExecutablePath = async () => {
  for (const candidate of LOCAL_BROWSER_CANDIDATES) {
    if (await canExecute(candidate)) {
      return { executablePath: candidate, args: [] as string[] };
    }
  }

  return {
    executablePath: await chromium.executablePath(),
    args: chromium.args,
  };
};

export const launchHeadlessBrowser = async () => {
  const resolved = await resolveExecutablePath();
  return playwright.launch({
    executablePath: resolved.executablePath,
    args: resolved.args,
    headless: true,
  });
};
