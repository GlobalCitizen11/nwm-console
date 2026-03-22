import type {
  BoardOnePagerContent,
  CanonicalExportSummary,
  ExecutiveBriefContent,
  ExportQaIssue,
  ExportQaResult,
  PresentationBriefContent,
} from "../types/export";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const danglingEndings = /\b(which|because|and|or|the|a|an|of|to|for|in|on|with|remains one of)\.?$/i;

const wordCount = (text: string) => clean(text).split(/\s+/).filter(Boolean).length;

const isCompleteSentence = (text: string) => /[.!?]$/.test(clean(text)) && !danglingEndings.test(clean(text).replace(/[.!?]+$/, ""));

const detectLanguageIssues = (texts: string[], code: ExportQaIssue["code"]): ExportQaIssue[] =>
  texts.flatMap((text) => {
    const issues: ExportQaIssue[] = [];
    const normalized = clean(text);
    if (!normalized) {
      issues.push({ level: "error", code, message: "Empty content block detected." });
      return issues;
    }
    if (!isCompleteSentence(normalized)) {
      issues.push({ level: "error", code, message: `Incomplete sentence detected: "${normalized}"` });
    }
    if (/(\b\w+\b)(?:\s+\1\b)+/i.test(normalized)) {
      issues.push({ level: "error", code, message: `Repeated phrase detected: "${normalized}"` });
    }
    if (/M\d+\s+[—-]\s+M\d+/i.test(normalized)) {
      issues.push({ level: "error", code, message: `Duplicated anchor label detected: "${normalized}"` });
    }
    return issues;
  });

export const validateCanonicalSummary = (summary: CanonicalExportSummary): ExportQaResult => {
  const issues = detectLanguageIssues(
    [
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
    ],
    "density",
  );

  return {
    ok: issues.length === 0,
    issues,
  };
};

export const validateBoardOnePager = (content: BoardOnePagerContent): ExportQaResult => {
  const issues: ExportQaIssue[] = [
    ...detectLanguageIssues([content.currentStateSummary, content.implicationsSummary, content.monitoringSummary], "density"),
  ];

  if (wordCount(content.currentStateSummary) > 55) {
    issues.push({ level: "error", code: "overflow", message: "Board current state summary exceeds budget." });
  }
  if (wordCount(content.implicationsSummary) > 30) {
    issues.push({ level: "error", code: "overflow", message: "Board implications summary exceeds budget." });
  }
  if (wordCount(content.monitoringSummary) > 24) {
    issues.push({ level: "error", code: "overflow", message: "Board monitoring summary exceeds budget." });
  }
  if (content.evidenceAnchors.length > 3) {
    issues.push({ level: "error", code: "overflow", message: "Board evidence strip exceeds three anchors." });
  }
  const estimatedUnits =
    wordCount(content.currentStateSummary) / 9 +
    wordCount(content.implicationsSummary) / 10 +
    wordCount(content.monitoringSummary) / 8 +
    content.signalStack.length * 1.3 +
    content.evidenceAnchors.length * 1.2;
  if (estimatedUnits > 24) {
    issues.push({ level: "error", code: "overflow", message: "Board composition exceeds the single-page budget." });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};

export const validateExecutiveBrief = (content: ExecutiveBriefContent): ExportQaResult => {
  const issues: ExportQaIssue[] = [];

  if (content.sections.length > 6) {
    issues.push({ level: "error", code: "overflow", message: "Executive brief exceeds six pages." });
  }

  for (const section of content.sections) {
    issues.push(...detectLanguageIssues(section.paragraphs, "density"));
    if (section.bullets) {
      issues.push(...detectLanguageIssues(section.bullets, "density"));
    }
    const paragraphWords = section.paragraphs.reduce((sum, paragraph) => sum + wordCount(paragraph), 0);
    if (paragraphWords < 42) {
      issues.push({ level: "warning", code: "underfill", message: `${section.title} is structurally thin.` });
    }
    const insightValue = clean(section.insightCard.value).toLowerCase();
    const paragraphBlob = section.paragraphs.join(" ").toLowerCase();
    if (paragraphBlob.includes(insightValue)) {
      issues.push({ level: "error", code: "density", message: `${section.title} rail card duplicates body copy.` });
    }
  }

  return {
    ok: !issues.some((issue) => issue.level === "error"),
    issues,
  };
};

export const validatePresentationBrief = (content: PresentationBriefContent): ExportQaResult => {
  const issues: ExportQaIssue[] = [];

  if (content.slides.length < 7 || content.slides.length > 9) {
    issues.push({ level: "error", code: "overflow", message: "Presentation slide count is outside the 7–9 slide range." });
  }

  const titles = new Set<string>();
  for (const slide of content.slides) {
    if (titles.has(slide.title.toLowerCase())) {
      issues.push({ level: "error", code: "density", message: `Duplicated slide title detected: ${slide.title}` });
    }
    titles.add(slide.title.toLowerCase());
    if (slide.bullets.length < 2 || slide.bullets.length > 4) {
      issues.push({ level: "error", code: "overflow", message: `${slide.title} has an invalid bullet count.` });
    }
    const totalWords = wordCount(slide.headline) + slide.bullets.reduce((sum, bullet) => sum + wordCount(bullet), 0);
    if (totalWords > 60) {
      issues.push({ level: "error", code: "overflow", message: `${slide.title} exceeds the slide word budget.` });
    }
    issues.push(...detectLanguageIssues(slide.bullets, "density"));
  }

  return {
    ok: !issues.some((issue) => issue.level === "error"),
    issues,
  };
};
