import type {
  ArtifactFieldValidationStatus,
  ExecutiveBodyRailSimilarity,
  ArtifactSpecValidationIssue,
  ArtifactSpecValidationResult,
  BoardOnePagerSpec,
  ExecutiveBriefSpec,
  PresentationBriefSpec,
} from "../types/artifactSpecs";
import {
  inspectExecutiveBodyRailSimilarity as inspectExecutiveBodyRailSimilarityV2,
  inspectExecutiveBriefSpecFields as inspectExecutiveBriefSpecFieldsV2,
  validateExecutiveBriefSpec as validateExecutiveBriefSpecV2,
} from "./validateExecutiveBriefSpec";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const wordCount = (text: string) => clean(text).split(/\s+/).filter(Boolean).length;
const implicationPattern =
  /\b(must|should|therefore|so|unless|risk|cost|costs|exposure|pressure|repric|fail|fails|faster|slower|hardens|harder|returns|return|reverse|reversal|starts|narrows|widens|accelerat|reduces|reopens|opening|forces|force|protect|prioritize|assume|assumptions|treat|watch|monitor|ignore|reprice|lock|move|plan|delay|timing|retain|optionalit|downside|upside|consequence|impact|breaks|compound|compounds|changes|matters|baseline|continuation|slips|slows|leaves|crowded|absorb|loss|losses|misalign|misprice|shock)\b/i;
const actionPattern =
  /\b(must|should|prioritize|protect|reduce|remove|reprice|lock|move|watch|monitor|ignore|plan|assume|treat|stress-test|hold|preserve|cut|avoid|strip|increase|hedge|shift|reallocate)\b/i;

function issue(
  path: string,
  message: string,
  code: ArtifactSpecValidationIssue["code"],
): ArtifactSpecValidationIssue {
  return { path, message, code, level: "error" };
}

function validateTextRule(
  issues: ArtifactSpecValidationIssue[],
  path: string,
  value: string,
  required?: boolean,
  minWords?: number,
  maxWords?: number,
) {
  const normalized = clean(value);
  if (required && !normalized) {
    issues.push(issue(path, `${path} is required.`, "missing"));
    return;
  }
  if (!normalized) return;
  const count = wordCount(normalized);
  if (typeof minWords === "number" && count < minWords) {
    issues.push(issue(path, `${path} is below the minimum word budget.`, "word-budget"));
  }
  if (typeof maxWords === "number" && count > maxWords) {
    issues.push(issue(path, `${path} exceeds the maximum word budget.`, "word-budget"));
  }
}

function validateListRule(
  issues: ArtifactSpecValidationIssue[],
  path: string,
  items: string[],
  required?: boolean,
  minItems?: number,
  maxItems?: number,
  maxWords?: number,
) {
  if (required && items.length === 0) {
    issues.push(issue(path, `${path} is required.`, "missing"));
    return;
  }
  if (typeof minItems === "number" && items.length < minItems) {
    issues.push(issue(path, `${path} is below the minimum item count.`, "item-count"));
  }
  if (typeof maxItems === "number" && items.length > maxItems) {
    issues.push(issue(path, `${path} exceeds the maximum item count.`, "item-count"));
  }
  if (typeof maxWords === "number") {
    items.forEach((item, index) => {
      if (wordCount(item) > maxWords) {
        issues.push(issue(`${path}[${index}]`, `${path}[${index}] exceeds the maximum word budget.`, "word-budget"));
      }
    });
  }
}

function hasImplicationOrConsequence(text: string) {
  return implicationPattern.test(clean(text));
}

function isActionable(text: string) {
  return actionPattern.test(clean(text));
}

export function validateBoardOnePagerSpec(spec: BoardOnePagerSpec): ArtifactSpecValidationResult {
  const issues: ArtifactSpecValidationIssue[] = [];

  validateTextRule(issues, "header.scenarioTitle", spec.header.scenarioTitle.value, spec.header.scenarioTitle.required, spec.header.scenarioTitle.minWords, spec.header.scenarioTitle.maxWords);
  validateTextRule(issues, "stateBand.stateInterpretation", spec.stateBand.stateInterpretation.value, spec.stateBand.stateInterpretation.required, spec.stateBand.stateInterpretation.minWords, spec.stateBand.stateInterpretation.maxWords);
  validateTextRule(issues, "boardRead.headline", spec.boardRead.headline.value, spec.boardRead.headline.required, spec.boardRead.headline.minWords, spec.boardRead.headline.maxWords);
  validateTextRule(issues, "boardRead.summary", spec.boardRead.summary.value, spec.boardRead.summary.required, spec.boardRead.summary.minWords, spec.boardRead.summary.maxWords);
  validateTextRule(issues, "decisionBox.title", spec.decisionBox.title.value, spec.decisionBox.title.required, spec.decisionBox.title.minWords, spec.decisionBox.title.maxWords);
  validateTextRule(issues, "dominantPath.statement", spec.dominantPath.statement.value, spec.dominantPath.statement.required, spec.dominantPath.statement.minWords, spec.dominantPath.statement.maxWords);
  validateTextRule(issues, "primaryPressure.statement", spec.primaryPressure.statement.value, spec.primaryPressure.statement.required, spec.primaryPressure.statement.minWords, spec.primaryPressure.statement.maxWords);

  validateListRule(issues, "decisionBox.actions", spec.decisionBox.actions.value, spec.decisionBox.actions.required, spec.decisionBox.actions.minItems, spec.decisionBox.actions.maxItems, spec.decisionBox.actions.maxWords);
  validateListRule(issues, "riskConcentration.items", spec.riskConcentration.items.value, spec.riskConcentration.items.required, spec.riskConcentration.items.minItems, spec.riskConcentration.items.maxItems, spec.riskConcentration.items.maxWords);
  validateListRule(issues, "triggers.items", spec.triggers.items.value, spec.triggers.items.required, spec.triggers.items.minItems, spec.triggers.items.maxItems, spec.triggers.items.maxWords);
  validateListRule(issues, "readShiftSignals.items", spec.readShiftSignals?.items.value ?? [], false, spec.readShiftSignals?.items.minItems, spec.readShiftSignals?.items.maxItems, spec.readShiftSignals?.items.maxWords);

  if (spec.signalGrid.items.value.length !== 4) {
    issues.push(issue("signalGrid.items", "Board signal grid must contain exactly four cells.", "item-count"));
  }
  if (spec.evidenceSignals.items.value.length !== 3) {
    issues.push(issue("evidenceSignals.items", "Board evidence signals must contain exactly three items.", "item-count"));
  }
  if (!spec.primaryPressure.statement.value.toLowerCase().includes("risk")) {
    issues.push(issue("primaryPressure.statement", "Primary pressure must describe a system impact.", "artifact-fail"));
  }
  if (!hasImplicationOrConsequence(spec.dominantPath.statement.value)) {
    issues.push(issue("dominantPath.statement", "Dominant path must include consequence or directional implication.", "artifact-fail"));
  }
  if (!hasImplicationOrConsequence(spec.primaryPressure.statement.value)) {
    issues.push(issue("primaryPressure.statement", "Primary pressure must include consequence or directional implication.", "artifact-fail"));
  }
  if (!spec.decisionBox.actions.value.every(hasImplicationOrConsequence)) {
    issues.push(issue("decisionBox.actions", "Decision actions must include directional implication or consequence.", "artifact-fail"));
  }
  if (!hasImplicationOrConsequence(spec.decisionBox.title.value)) {
    issues.push(issue("decisionBox.title", "Decision headline must include consequence or directional implication.", "artifact-fail"));
  }
  if (!isActionable(spec.decisionBox.title.value)) {
    issues.push(issue("decisionBox.title", "Decision headline must be explicit and actionable.", "artifact-fail"));
  }
  if (!spec.decisionBox.actions.value.every(isActionable)) {
    issues.push(issue("decisionBox.actions", "Decision actions must be explicit and actionable.", "artifact-fail"));
  }
  if (!spec.riskConcentration.items.value.every(hasImplicationOrConsequence)) {
    issues.push(issue("riskConcentration.items", "Risk concentration items must explain why the concentration matters.", "artifact-fail"));
  }
  if (!spec.triggers.items.value.every((item) => /^if\b/i.test(clean(item)))) {
    issues.push(issue("triggers.items", "Triggers must begin with a binary condition.", "artifact-fail"));
  }
  if (!spec.triggers.items.value.every((item) => /expand|accelerat|resume|restor|ease|execut|relax|tighten|fall|rises?|widens?|narrows?/i.test(item))) {
    issues.push(issue("triggers.items", "Triggers must name an observable state shift.", "artifact-fail"));
  }
  if (!spec.triggers.items.value.every(hasImplicationOrConsequence)) {
    issues.push(issue("triggers.items", "Triggers must include consequence or directional implication.", "artifact-fail"));
  }
  if (!spec.evidenceSignals.items.value.every((item) => item.signal.split(/\s+/).length >= 4)) {
    issues.push(issue("evidenceSignals.items", "Evidence signals must read as consequential signals, not labels.", "artifact-fail"));
  }

  return { ok: issues.length === 0, issues };
}

export function inspectBoardOnePagerSpecFields(spec: BoardOnePagerSpec): ArtifactFieldValidationStatus[] {
  const validation = validateBoardOnePagerSpec(spec);
  const issueMap = new Map<string, string[]>();

  for (const current of validation.issues) {
    const messages = issueMap.get(current.path) ?? [];
    messages.push(current.message);
    issueMap.set(current.path, messages);
  }

  const trackedPaths = [
    "header.scenarioTitle",
    "header.replayMonthLabel",
    "header.confidentialityLabel",
    "stateBand.phase",
    "stateBand.density",
    "stateBand.momentum",
    "stateBand.reversibility",
    "stateBand.stateInterpretation",
    "boardRead.headline",
    "boardRead.summary",
    "decisionBox.title",
    "decisionBox.actions",
    "dominantPath.statement",
    "primaryPressure.statement",
    "riskConcentration.items",
    "inflectionPaths.continuation",
    "inflectionPaths.reversal",
    "inflectionPaths.acceleration",
    "triggers.items",
    "signalGrid.items",
    "readShiftSignals.items",
    "containedVsSpreading.items",
    "evidenceSignals.items",
  ];

  return trackedPaths.map((path) => {
    const failures = issueMap.get(path) ?? [];
    return {
      path,
      ok: failures.length === 0,
      message: failures.length === 0 ? "pass" : failures.join(" | "),
    };
  });
}

export function validateExecutiveBriefSpec(spec: ExecutiveBriefSpec): ArtifactSpecValidationResult {
  return validateExecutiveBriefSpecV2(spec);
}

export function inspectExecutiveBriefSpecFields(spec: ExecutiveBriefSpec): ArtifactFieldValidationStatus[] {
  return inspectExecutiveBriefSpecFieldsV2(spec);
}

export function inspectExecutiveBodyRailSimilarity(spec: ExecutiveBriefSpec): ExecutiveBodyRailSimilarity[] {
  return inspectExecutiveBodyRailSimilarityV2(spec);
}

export function validatePresentationBriefSpec(spec: PresentationBriefSpec): ArtifactSpecValidationResult {
  const issues: ArtifactSpecValidationIssue[] = [];
  const seenTitles = new Set<string>();
  const genericTitles = new Set([
    "situation",
    "system state",
    "key judgments",
    "how we got here",
    "inflection points",
    "decision impact",
    "pathways",
    "what to watch",
  ]);

  if (spec.slides.length < 7 || spec.slides.length > 9) {
    issues.push(issue("slides", "Presentation spec must contain seven to nine slides.", "item-count"));
  }

  spec.slides.forEach((slide, index) => {
    const path = `slides[${index}]`;
    validateTextRule(issues, `${path}.title`, slide.title.value, slide.title.required, slide.title.minWords, slide.title.maxWords);
    validateListRule(issues, `${path}.bullets`, slide.bullets.value, slide.bullets.required, slide.bullets.minItems, slide.bullets.maxItems, slide.bullets.maxWords);

    const normalizedTitle = clean(slide.title.value).toLowerCase();
    if (normalizedTitle) {
      if (seenTitles.has(normalizedTitle)) {
        issues.push(issue(`${path}.title`, "Slide titles must be unique.", "artifact-fail"));
      }
      if (genericTitles.has(normalizedTitle)) {
        issues.push(issue(`${path}.title`, "Slide titles must be specific, not generic labels.", "artifact-fail"));
      }
      seenTitles.add(normalizedTitle);
    }

    if (slide.bullets.value.some((item) => wordCount(item) > 15)) {
      issues.push(issue(`${path}.bullets`, "Presentation bullets must remain speakable and under fifteen words.", "artifact-fail"));
    }
    if (slide.bullets.value.some((item) => !/[.!?]$/.test(clean(item)))) {
      issues.push(issue(`${path}.bullets`, "Presentation bullets must resolve as complete sentences.", "artifact-fail"));
    }
    const totalWords =
      wordCount(slide.title.value) +
      slide.bullets.value.reduce((sum, item) => sum + wordCount(item), 0);
    if (totalWords > 60) {
      issues.push(issue(`${path}`, "Presentation slides must stay under the 60-word budget.", "artifact-fail"));
    }
    if (slide.bullets.value.some((item) => !hasImplicationOrConsequence(item))) {
      issues.push(issue(`${path}.bullets`, "Presentation bullets must remain decision-relevant, not merely descriptive.", "artifact-fail"));
    }
    if ((index === spec.slides.length - 1 || slide.slideType.value === "triggers") && slide.bullets.value.some((item) => !isActionable(item))) {
      issues.push(issue(`${path}.bullets`, "Decision slides must contain explicit action or trigger direction.", "artifact-fail"));
    }
  });

  return { ok: issues.length === 0, issues };
}

export function inspectPresentationBriefSpecFields(spec: PresentationBriefSpec): ArtifactFieldValidationStatus[] {
  const validation = validatePresentationBriefSpec(spec);
  const issueMap = new Map<string, string[]>();

  for (const current of validation.issues) {
    const messages = issueMap.get(current.path) ?? [];
    messages.push(current.message);
    issueMap.set(current.path, messages);
  }

  const trackedPaths = [
    "slides",
    ...spec.slides.flatMap((_, index) => [
      `slides[${index}].slideType`,
      `slides[${index}].title`,
      `slides[${index}].bullets`,
    ]),
  ];

  return trackedPaths.map((path) => {
    const failures = issueMap.get(path) ?? [];
    return {
      path,
      ok: failures.length === 0,
      message: failures.length === 0 ? "pass" : failures.join(" | "),
    };
  });
}
