import type {
  BoardOnePagerContent,
  CanonicalExportSummary,
  ExecutiveBriefContent,
  ExportQaIssue,
  ExportQaResult,
  PresentationBriefContent,
} from "../types/export";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const words = (text: string) => clean(text).split(/\s+/).filter(Boolean);
const wordCount = (text: string) => words(text).length;

const danglingEndings = /\b(and|which|because|with|the|one|one of|of|to|for|in|on|a|an)$/i;

const completeSentence = (text: string) => /[.!?]$/.test(clean(text)) && !danglingEndings.test(clean(text).replace(/[.!?]+$/, ""));

const languageIssues = (texts: string[], code: ExportQaIssue["code"]): ExportQaIssue[] =>
  texts.flatMap((text) => {
    const issues: ExportQaIssue[] = [];
    const normalized = clean(text);
    if (!normalized) {
      issues.push({ level: "error", code, message: "Empty content block detected." });
      return issues;
    }
    if (!completeSentence(normalized)) {
      issues.push({ level: "error", code, message: `Incomplete sentence detected: "${normalized}"` });
    }
    if (/(\b\w+\b)(?:\s+\1\b)+/i.test(normalized)) {
      issues.push({ level: "error", code, message: `Repeated phrase detected: "${normalized}"` });
    }
    return issues;
  });

export const validateCanonicalSummary = (summary: CanonicalExportSummary): ExportQaResult => {
  const fields = [
    summary.currentStateSummary,
    summary.dominantPathSummary,
    summary.primaryPressureSummary,
    summary.implicationsSummary,
    summary.monitoringSummary,
    summary.narrativeDevelopment.earlySignalsSummary,
    summary.narrativeDevelopment.systemicUptakeSummary,
    summary.narrativeDevelopment.currentStateFormationSummary,
    summary.structuralInterpretationSummary,
    summary.forwardOrientationSummary,
    summary.alternatePathSummary,
    summary.strategicPositioningSummary,
    summary.watchpointSummary,
  ];

  const issues = languageIssues(fields, "density");
  for (const field of fields) {
    const clauses = clean(field).split(/[,:;]/).filter(Boolean).length;
    if (clauses > 2) {
      issues.push({ level: "error", code: "density", message: `Canonical field exceeds the two-clause limit: "${field}"` });
    }
  }

  return { ok: issues.length === 0, issues };
};

export const validateBoardOnePager = (content: BoardOnePagerContent): ExportQaResult => {
  const issues: ExportQaIssue[] = languageIssues(
    [content.currentStateSummary, content.implicationsSummary, content.monitoringSummary],
    "density",
  );

  if (wordCount(content.currentStateSummary) > 50) {
    issues.push({ level: "error", code: "overflow", message: "Board current state summary exceeds 50 words." });
  }
  if ((content.signalStack[4]?.value && wordCount(content.signalStack[4].value) > 15) || (content.signalStack[5]?.value && wordCount(content.signalStack[5].value) > 15)) {
    issues.push({ level: "error", code: "overflow", message: "Board dominant path or pressure summary exceeds budget." });
  }
  if (wordCount(content.implicationsSummary) > 25) {
    issues.push({ level: "error", code: "overflow", message: "Board implications summary exceeds 25 words." });
  }
  if (wordCount(content.monitoringSummary) > 20) {
    issues.push({ level: "error", code: "overflow", message: "Board monitoring summary exceeds 20 words." });
  }
  if (content.evidenceAnchors.length !== 3) {
    issues.push({ level: "error", code: "overflow", message: "Board evidence strip must contain exactly 3 anchors." });
  }
  for (const anchor of content.evidenceAnchors) {
    if (/M\d+\s+[—-]\s+M\d+/i.test(anchor.shortTitle)) {
      issues.push({ level: "error", code: "density", message: `Duplicated evidence label detected: "${anchor.shortTitle}"` });
    }
    if (wordCount(anchor.shortTitle) > 6 || wordCount(anchor.shortSubtitle) > 8) {
      issues.push({ level: "error", code: "overflow", message: `Evidence anchor exceeds compact budget: "${anchor.shortTitle}"` });
    }
  }
  const estimatedPageUse =
    wordCount(content.currentStateSummary) / 8 +
    wordCount(content.implicationsSummary) / 7 +
    wordCount(content.monitoringSummary) / 6 +
    content.signalStack.length * 1.15 +
    content.evidenceAnchors.length * 0.9;
  if (estimatedPageUse > 23) {
    issues.push({ level: "error", code: "overflow", message: "Board content exceeds the one-page layout budget." });
  }

  return { ok: issues.length === 0, issues };
};

export const validateExecutiveBrief = (content: ExecutiveBriefContent): ExportQaResult => {
  const issues: ExportQaIssue[] = [];

  if (content.sections.length > 6) {
    issues.push({ level: "error", code: "overflow", message: "Executive brief exceeds six sections." });
  }

  for (const section of content.sections) {
    issues.push(...languageIssues(section.paragraphs, "density"));
    if (section.bullets) {
      issues.push(...languageIssues(section.bullets, "density"));
    }
    const totalWords =
      section.paragraphs.reduce((sum, paragraph) => sum + wordCount(paragraph), 0) +
      (section.bullets?.reduce((sum, bullet) => sum + wordCount(bullet), 0) ?? 0);
    if (totalWords < 80 || totalWords > 120) {
      issues.push({ level: "error", code: "underfill", message: `${section.title} is outside the 80–120 word range.` });
    }
    const bodyBlob = section.paragraphs.join(" ").toLowerCase();
    const insightValue = clean(section.insightCard.value).toLowerCase();
    if (bodyBlob.includes(insightValue)) {
      issues.push({ level: "error", code: "density", message: `${section.title} insight card duplicates body copy.` });
    }
  }

  return { ok: issues.length === 0, issues };
};

export const validatePresentationBrief = (content: PresentationBriefContent): ExportQaResult => {
  const issues: ExportQaIssue[] = [];

  if (content.slides.length < 7 || content.slides.length > 9) {
    issues.push({ level: "error", code: "overflow", message: "Presentation slide count is outside the 7–9 range." });
  }

  const titles = new Set<string>();
  for (const slide of content.slides) {
    const key = slide.title.toLowerCase();
    if (titles.has(key)) {
      issues.push({ level: "error", code: "density", message: `Duplicated slide title detected: ${slide.title}` });
    }
    titles.add(key);
    if (slide.bullets.length < 2 || slide.bullets.length > 4) {
      issues.push({ level: "error", code: "overflow", message: `${slide.title} has an invalid bullet count.` });
    }
    if (wordCount(slide.headline) + slide.bullets.reduce((sum, bullet) => sum + wordCount(bullet), 0) > 60) {
      issues.push({ level: "error", code: "overflow", message: `${slide.title} exceeds the 60-word budget.` });
    }
    for (const bullet of slide.bullets) {
      if (wordCount(bullet) > 15) {
        issues.push({ level: "error", code: "overflow", message: `${slide.title} contains a bullet over 15 words.` });
      }
    }
    issues.push(...languageIssues(slide.bullets, "density"));
  }

  return { ok: issues.length === 0, issues };
};
