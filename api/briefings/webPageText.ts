import { launchHeadlessBrowser } from "./browser";

const APP_SHELL_PATTERNS = [
  /<div[^>]+id=["'](?:root|app|__next)["'][^>]*>\s*<\/div>/i,
  /<script[^>]+type=["']module["']/i,
  /__NEXT_DATA__/i,
  /data-reactroot/i,
  /<noscript>.*enable javascript/i,
];

const BLOCK_TAG_PATTERN = /<\/(?:p|div|section|article|main|aside|header|footer|nav|li|ul|ol|h1|h2|h3|h4|h5|h6|blockquote|pre|table|tr|td|th|br)>/gi;

const xmlEntityMap: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export type WebPageExtractionStrategy = "html-static" | "html-rendered";

export interface WebPageTextResult {
  extractedText: string;
  extractionStrategy: WebPageExtractionStrategy;
}

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const wordCount = (text: string) => clean(text).split(/\s+/).filter(Boolean).length;
const unique = <T,>(items: T[]) => Array.from(new Set(items));

const decodeXmlEntities = (text: string) =>
  text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => xmlEntityMap[match] ?? match);

const clipExtractedText = (text: string) => {
  const normalized = normalizeText(text);
  if (normalized.length <= 32000) {
    return normalized;
  }
  return `${normalized.slice(0, 32000).trim()}\n\n[truncated webpage extract]`;
};

const extractHtmlMetadata = (html: string) => {
  const parts: string[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    parts.push(titleMatch[1]);
  }

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/\bcontent\s*=\s*["']([\s\S]*?)["']/i)?.[1];
    if (!name || !content) {
      continue;
    }

    if (["description", "og:title", "og:description", "twitter:title", "twitter:description"].includes(name)) {
      parts.push(content);
    }
  }

  return unique(parts.map((part) => clean(decodeXmlEntities(part))).filter(Boolean));
};

export const extractStaticWebPageText = (html: string) => {
  const metadata = extractHtmlMetadata(html);
  const bodyText = decodeXmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<template[\s\S]*?<\/template>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<canvas[\s\S]*?<\/canvas>/gi, " ")
      .replace(BLOCK_TAG_PATTERN, "\n")
      .replace(/<[^>]+>/g, " "),
  );

  return clipExtractedText([...metadata, normalizeText(bodyText)].filter(Boolean).join("\n\n"));
};

export const shouldRenderHtmlPage = (html: string, extractedText: string) => {
  if (APP_SHELL_PATTERNS.some((pattern) => pattern.test(html))) {
    return true;
  }

  const textWords = wordCount(extractedText);
  const scriptCount = (html.match(/<script\b/gi) ?? []).length;
  const bodyShellPatterns = /<div[^>]+id=["'](?:root|app|__next)["']/i;

  if (textWords < 80) {
    return true;
  }

  if (bodyShellPatterns.test(html) && scriptCount >= 1 && textWords < 180) {
    return true;
  }

  if (scriptCount >= 4 && textWords < 140) {
    return true;
  }

  return false;
};

export const extractRenderedPageText = async (
  url: URL,
  validateUrl: (candidate: string | URL) => Promise<URL>,
  timeoutMs: number,
) => {
  const browser = await launchHeadlessBrowser();
  const requestPermissions = new Map<string, Promise<boolean>>();

  const isAllowedRequest = (candidate: string) => {
    const cacheKey = (() => {
      try {
        const parsed = new URL(candidate);
        return `${parsed.protocol}//${parsed.host}`;
      } catch {
        return candidate;
      }
    })();

    const cached = requestPermissions.get(cacheKey);
    if (cached) {
      return cached;
    }

    const pending = validateUrl(candidate)
      .then(() => true)
      .catch(() => false);
    requestPermissions.set(cacheKey, pending);
    return pending;
  };

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 2000 },
      userAgent: "NWM-Console-Brief-Ingest/1.0",
      serviceWorkers: "block",
    });

    await context.route("**/*", async (route) => {
      const requestUrl = route.request().url();

      try {
        const parsed = new URL(requestUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          await route.abort();
          return;
        }
      } catch {
        await route.abort();
        return;
      }

      if (!(await isAllowedRequest(requestUrl))) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    const page = await context.newPage();
    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 4000) }).catch(() => {});
    await page.waitForFunction(
      () => (document.body?.innerText ?? "").trim().length > 120,
      undefined,
      { timeout: Math.min(timeoutMs, 4000) },
    ).catch(() => {});

    const extractedText = await page.evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      const seen = new Set<string>();
      const blocks: string[] = [];
      const selectors = "h1, h2, h3, p, li, blockquote, figcaption, summary, td, th";

      const push = (value: string) => {
        const cleaned = normalize(value);
        if (!cleaned || cleaned.split(/\s+/).length < 3 || seen.has(cleaned)) {
          return;
        }
        seen.add(cleaned);
        blocks.push(cleaned);
      };

      push(document.title ?? "");
      push(document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "");
      push(document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "");
      push(document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? "");

      const roots = Array.from(
        document.querySelectorAll(
          "main, article, [role='main'], .article, .article-content, .post, .post-content, .content, .page-content, section",
        ),
      );
      const candidateRoots = roots.length > 0 ? roots : [document.body];

      for (const root of candidateRoots) {
        for (const node of Array.from(root.querySelectorAll(selectors))) {
          const element = node as HTMLElement;
          const style = globalThis.getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || element.getAttribute("aria-hidden") === "true") {
            continue;
          }
          push(element.innerText || element.textContent || "");
        }
      }

      const joined = blocks.join("\n\n");
      if (joined.split(/\s+/).filter(Boolean).length >= 100) {
        return joined;
      }

      const bodyText = normalize(document.body?.innerText ?? "");
      const segments = bodyText
        .split(/\n{2,}/)
        .map((segment) => normalize(segment))
        .filter(Boolean);

      for (const segment of segments) {
        push(segment);
      }

      return blocks.join("\n\n");
    });

    await context.close();
    return clipExtractedText(extractedText);
  } finally {
    await browser.close();
  }
};

export const extractWebPageText = async ({
  html,
  url,
  validateUrl,
  timeoutMs,
}: {
  html: string;
  url: URL;
  validateUrl: (candidate: string | URL) => Promise<URL>;
  timeoutMs: number;
}): Promise<WebPageTextResult | null> => {
  const staticText = extractStaticWebPageText(html);
  let extractedText = staticText;
  let extractionStrategy: WebPageExtractionStrategy = "html-static";

  if (shouldRenderHtmlPage(html, staticText)) {
    try {
      const renderedText = await extractRenderedPageText(url, validateUrl, timeoutMs);
      const staticWordCount = wordCount(staticText);
      const renderedWordCount = wordCount(renderedText);
      if (
        renderedWordCount >= staticWordCount + 20
        || (renderedWordCount >= 30 && renderedWordCount > Math.max(8, staticWordCount * 2))
      ) {
        extractedText = renderedText;
        extractionStrategy = "html-rendered";
      } else if (!extractedText && renderedText) {
        extractedText = renderedText;
        extractionStrategy = "html-rendered";
      }
    } catch {
      // Fall back to the static extraction when rendered-page extraction is unavailable.
    }
  }

  if (!extractedText) {
    return null;
  }

  return {
    extractedText,
    extractionStrategy,
  };
};
