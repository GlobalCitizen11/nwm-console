import type {
  BoardOnePagerContent,
  CanonicalExportSummary,
  ExecutiveBriefContent,
  ExportQaIssue,
  ExportQaResult,
  PresentationBriefContent,
} from "../types/export";
import {
  validateBoardOnePagerSpec as validateBoardOnePagerArtifactSpec,
  validateExecutiveBriefSpec as validateExecutiveBriefArtifactSpec,
  validatePresentationBriefSpec as validatePresentationBriefArtifactSpec,
} from "../../../lib/validateArtifactSpecs";

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
    [
      content.topInterpretation,
      ...content.boardRead,
      ...content.signalGrid.map((item) => `${item.value}. ${item.implication}`),
      ...content.decisionBullets,
      content.dominantPath,
      content.primaryPressure,
      ...content.riskConcentrations,
      ...content.nextChangeSignals,
      ...content.monitoringTriggers,
      ...content.readShiftSignals,
      ...content.containedSpreadSplit.map((item) => item.value),
    ],
    "density",
  );

  if (content.systemStrip.length !== 4) {
    issues.push({ level: "error", code: "overflow", message: "Board system strip must contain exactly four metrics." });
  }
  if (content.boardRead.length !== 2) {
    issues.push({ level: "error", code: "overflow", message: "Board read must contain exactly 2 lines." });
  }
  if (content.signalGrid.length !== 4) {
    issues.push({ level: "error", code: "overflow", message: "Signal grid must contain exactly 4 columns." });
  }
  if (content.decisionBullets.length < 3 || content.decisionBullets.length > 4) {
    issues.push({ level: "error", code: "overflow", message: "Decision box must contain 3 to 4 bullets." });
  }
  if (content.riskConcentrations.length !== 3) {
    issues.push({ level: "error", code: "overflow", message: "Risk concentration box must contain 3 bullets." });
  }
  if (content.nextChangeSignals.length !== 3) {
    issues.push({ level: "error", code: "overflow", message: "What changes next must contain 3 bullets." });
  }
  if (content.monitoringTriggers.length < 2 || content.monitoringTriggers.length > 3) {
    issues.push({ level: "error", code: "overflow", message: "Monitoring triggers must contain 2 to 3 items." });
  }
  if (content.readShiftSignals.length < 2 || content.readShiftSignals.length > 3) {
    issues.push({ level: "error", code: "overflow", message: "Read-shift signals must contain 2 to 3 items." });
  }
  if (content.containedSpreadSplit.length !== 2) {
    issues.push({ level: "error", code: "overflow", message: "Contained/spreading split must contain exactly 2 items." });
  }
  for (const bullet of [...content.decisionBullets, ...content.riskConcentrations, ...content.nextChangeSignals, ...content.monitoringTriggers, ...content.readShiftSignals]) {
    if (wordCount(bullet) > 15) {
      issues.push({ level: "error", code: "overflow", message: `Board bullet exceeds the word budget: "${bullet}"` });
    }
  }
  if (wordCount(content.dominantPath) > 15 || wordCount(content.primaryPressure) > 15) {
    issues.push({ level: "error", code: "overflow", message: "Board dominant path or primary pressure exceeds budget." });
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
  const specValidation = validateBoardOnePagerArtifactSpec(content.spec);
  for (const specIssue of specValidation.issues) {
    issues.push({
      level: specIssue.level,
      code: specIssue.code === "artifact-fail" ? "density" : specIssue.code === "item-count" ? "overflow" : "density",
      message: `${specIssue.path}: ${specIssue.message}`,
    });
  }

  return { ok: issues.length === 0, issues };
};

export const validateExecutiveBrief = (content: ExecutiveBriefContent): ExportQaResult => {
  const issues: ExportQaIssue[] = [];
  const paragraphs = [
    content.spec.systemStateOverview.currentConditionParagraph.value,
    content.spec.systemStateOverview.meaningParagraph.value,
    content.spec.narrativeDevelopment.earlySignalsParagraph.value,
    content.spec.narrativeDevelopment.systemicUptakeParagraph.value,
    content.spec.narrativeDevelopment.currentConditionParagraph.value,
    content.spec.structuralInterpretation.interpretationParagraph1.value,
    content.spec.structuralInterpretation.interpretationParagraph2?.value ?? "",
    content.spec.forwardOrientation.primaryPathParagraph.value,
    content.spec.forwardOrientation.alternatePathParagraph.value,
    content.spec.strategicPositioning.positioningParagraph1.value,
    content.spec.strategicPositioning.positioningParagraph2?.value ?? "",
    content.spec.evidenceBase.intro.value,
  ].filter(Boolean);

  issues.push(...languageIssues(paragraphs, "density"));

  const supportLists = [
    ...(content.spec.strategicPositioning.priorityAreas?.value ?? []),
    ...(content.spec.strategicPositioning.sensitivityPoints?.value ?? []),
    ...(content.spec.strategicPositioning.visibilityNeeds?.value ?? []),
  ];
  issues.push(...languageIssues(supportLists, "density"));

  if (content.spec.evidenceBase.items.value.length < 3 || content.spec.evidenceBase.items.value.length > 6) {
    issues.push({ level: "error", code: "overflow", message: "Executive evidence base must contain three to six signals." });
  }

  const specValidation = validateExecutiveBriefArtifactSpec(content.spec);
  for (const specIssue of specValidation.issues) {
    issues.push({
      level: specIssue.level,
      code: specIssue.code === "item-count" ? "overflow" : specIssue.code === "artifact-fail" ? "density" : "density",
      message: `${specIssue.path}: ${specIssue.message}`,
    });
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

  const specValidation = validatePresentationBriefArtifactSpec(content.spec);
  for (const specIssue of specValidation.issues) {
    issues.push({
      level: specIssue.level,
      code: specIssue.code === "item-count" ? "overflow" : specIssue.code === "artifact-fail" ? "density" : "density",
      message: `${specIssue.path}: ${specIssue.message}`,
    });
  }

  return { ok: issues.length === 0, issues };
};
