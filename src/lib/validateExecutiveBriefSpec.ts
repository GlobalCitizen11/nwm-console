import type {
  ExecutiveBriefSpec,
  ExecutiveBodyRailSimilarity,
  ArtifactFieldValidationStatus,
  ArtifactSpecValidationIssue,
  ArtifactSpecValidationResult,
} from "../types/artifactSpecs";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const wordCount = (text: string) => clean(text).split(/\s+/).filter(Boolean).length;

const bannedPhrases = [
  /\bthis means\b/i,
  /\bthis shows\b/i,
  /\bthere are risks\b/i,
  /\bwhat matters most is\b/i,
  /\bvisibility is needed\b/i,
  /\bthe system is now in a place where\b/i,
];

const genericConsultingPhrases = [
  /\bleverage\b/i,
  /\boptimize\b/i,
  /\bsynerg/i,
  /\bvalue proposition\b/i,
  /\bholistic\b/i,
  /\bgoing forward\b/i,
  /\bbest practice\b/i,
  /\bconsider\b/i,
];

const timeDependentPhrases = [
  /\bover the next \d+/i,
  /\bin the coming months\b/i,
  /\bby year end\b/i,
  /\bby q[1-4]\b/i,
  /\bnext quarter\b/i,
  /\bthis quarter\b/i,
  /\bnear term\b/i,
];

const alternatePathDiscriminator =
  /\balternate|instead|reversal|interruption|if|unless|should .* ease|could reopen|would reopen|returns|restores|recedes\b/i;

const evidenceTaxonomyPattern =
  /\bclassification|category|taxonomy|bucket|type|domain|label\b/i;

const implicationPattern =
  /\bchanges|reorders|reprices|narrows|widens|hardens|forces|shifts|tightens|reduces|raises|constrains|locks|reopens|restores|transmits|invalidates|revises|moves|reverses|builds?|carr(?:y|ies)|rewards?|persists?|eases|revisit|protects\b/i;

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

  for (const pattern of bannedPhrases) {
    if (pattern.test(normalized)) {
      issues.push(issue(path, `${path} uses banned executive filler language.`, "artifact-fail"));
    }
  }
  for (const pattern of timeDependentPhrases) {
    if (pattern.test(normalized)) {
      issues.push(issue(path, `${path} sounds time-dependent rather than state-dependent.`, "artifact-fail"));
    }
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
  items.forEach((item, index) => {
    validateTextRule(issues, `${path}[${index}]`, item, false, undefined, maxWords);
  });
}

function overlapScore(a: string, b: string) {
  const tokensA = new Set(
    clean(a)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 4),
  );
  const tokensB = new Set(
    clean(b)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 4),
  );

  if (!tokensA.size || !tokensB.size) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return overlap / Math.min(tokensA.size, tokensB.size);
}

export function inspectExecutiveBodyRailSimilarity(spec: ExecutiveBriefSpec): ExecutiveBodyRailSimilarity[] {
  const comparisons = [
    {
      sectionId: "systemStateOverview",
      title: spec.systemStateOverview.sectionTitle.value,
      body: `${spec.systemStateOverview.currentConditionParagraph.value} ${spec.systemStateOverview.meaningParagraph.value}`,
      rail: spec.systemStateOverview.sidebarInsight?.value ?? "",
    },
    {
      sectionId: "narrativeDevelopment",
      title: spec.narrativeDevelopment.sectionTitle.value,
      body: [
        spec.narrativeDevelopment.earlySignalsParagraph.value,
        spec.narrativeDevelopment.systemicUptakeParagraph.value,
        spec.narrativeDevelopment.currentConditionParagraph.value,
      ].join(" "),
      rail: spec.narrativeDevelopment.sidebarInsight?.value ?? "",
    },
    {
      sectionId: "structuralInterpretation",
      title: spec.structuralInterpretation.sectionTitle.value,
      body: [
        spec.structuralInterpretation.interpretationParagraph1.value,
        spec.structuralInterpretation.interpretationParagraph2?.value ?? "",
      ].join(" "),
      rail: spec.structuralInterpretation.sidebarInsight?.value ?? "",
    },
    {
      sectionId: "forwardOrientation",
      title: spec.forwardOrientation.sectionTitle.value,
      body: `${spec.forwardOrientation.primaryPathParagraph.value} ${spec.forwardOrientation.alternatePathParagraph.value}`,
      rail: spec.forwardOrientation.sidebarInsight?.value ?? "",
    },
    {
      sectionId: "strategicPositioning",
      title: spec.strategicPositioning.sectionTitle.value,
      body: [
        spec.strategicPositioning.positioningParagraph1.value,
        spec.strategicPositioning.positioningParagraph2?.value ?? "",
      ].join(" "),
      rail: spec.strategicPositioning.sidebarInsight?.value ?? "",
    },
  ];

  return comparisons.map((comparison) => {
    const score = overlapScore(comparison.body, comparison.rail);
    const ok =
      !comparison.rail ||
      (score < 0.72 &&
        !clean(comparison.body).toLowerCase().includes(clean(comparison.rail).toLowerCase()));
    return {
      sectionId: comparison.sectionId,
      title: comparison.title,
      ok,
      overlapScore: Number(score.toFixed(2)),
      message: ok ? "sidebar adds distinct value" : "sidebar insight is too similar to section body",
    };
  });
}

export function validateExecutiveBriefSpec(spec: ExecutiveBriefSpec): ArtifactSpecValidationResult {
  const issues: ArtifactSpecValidationIssue[] = [];

  validateTextRule(issues, "header.scenarioName", spec.header.scenarioName.value, spec.header.scenarioName.required, spec.header.scenarioName.minWords, spec.header.scenarioName.maxWords);
  validateTextRule(issues, "header.boundedWorld", spec.header.boundedWorld.value, spec.header.boundedWorld.required, spec.header.boundedWorld.minWords, spec.header.boundedWorld.maxWords);
  validateTextRule(issues, "header.asOfLabel", spec.header.asOfLabel.value, spec.header.asOfLabel.required, spec.header.asOfLabel.minWords, spec.header.asOfLabel.maxWords);
  validateTextRule(issues, "header.currentPhase", spec.header.currentPhase.value, spec.header.currentPhase.required, spec.header.currentPhase.minWords, spec.header.currentPhase.maxWords);
  validateTextRule(issues, "header.executiveHeadline", spec.header.executiveHeadline.value, spec.header.executiveHeadline.required, spec.header.executiveHeadline.minWords, spec.header.executiveHeadline.maxWords);
  validateTextRule(issues, "header.executiveSubline", spec.header.executiveSubline.value, spec.header.executiveSubline.required, spec.header.executiveSubline.minWords, spec.header.executiveSubline.maxWords);

  validateTextRule(issues, "systemStateOverview.currentConditionParagraph", spec.systemStateOverview.currentConditionParagraph.value, spec.systemStateOverview.currentConditionParagraph.required, spec.systemStateOverview.currentConditionParagraph.minWords, spec.systemStateOverview.currentConditionParagraph.maxWords);
  validateTextRule(issues, "systemStateOverview.meaningParagraph", spec.systemStateOverview.meaningParagraph.value, spec.systemStateOverview.meaningParagraph.required, spec.systemStateOverview.meaningParagraph.minWords, spec.systemStateOverview.meaningParagraph.maxWords);
  validateTextRule(issues, "narrativeDevelopment.earlySignalsParagraph", spec.narrativeDevelopment.earlySignalsParagraph.value, spec.narrativeDevelopment.earlySignalsParagraph.required, spec.narrativeDevelopment.earlySignalsParagraph.minWords, spec.narrativeDevelopment.earlySignalsParagraph.maxWords);
  validateTextRule(issues, "narrativeDevelopment.systemicUptakeParagraph", spec.narrativeDevelopment.systemicUptakeParagraph.value, spec.narrativeDevelopment.systemicUptakeParagraph.required, spec.narrativeDevelopment.systemicUptakeParagraph.minWords, spec.narrativeDevelopment.systemicUptakeParagraph.maxWords);
  validateTextRule(issues, "narrativeDevelopment.currentConditionParagraph", spec.narrativeDevelopment.currentConditionParagraph.value, spec.narrativeDevelopment.currentConditionParagraph.required, spec.narrativeDevelopment.currentConditionParagraph.minWords, spec.narrativeDevelopment.currentConditionParagraph.maxWords);
  validateTextRule(issues, "structuralInterpretation.interpretationParagraph1", spec.structuralInterpretation.interpretationParagraph1.value, spec.structuralInterpretation.interpretationParagraph1.required, spec.structuralInterpretation.interpretationParagraph1.minWords, spec.structuralInterpretation.interpretationParagraph1.maxWords);
  validateTextRule(issues, "structuralInterpretation.interpretationParagraph2", spec.structuralInterpretation.interpretationParagraph2?.value ?? "", false, spec.structuralInterpretation.interpretationParagraph2?.minWords, spec.structuralInterpretation.interpretationParagraph2?.maxWords);
  validateTextRule(issues, "forwardOrientation.primaryPathParagraph", spec.forwardOrientation.primaryPathParagraph.value, spec.forwardOrientation.primaryPathParagraph.required, spec.forwardOrientation.primaryPathParagraph.minWords, spec.forwardOrientation.primaryPathParagraph.maxWords);
  validateTextRule(issues, "forwardOrientation.alternatePathParagraph", spec.forwardOrientation.alternatePathParagraph.value, spec.forwardOrientation.alternatePathParagraph.required, spec.forwardOrientation.alternatePathParagraph.minWords, spec.forwardOrientation.alternatePathParagraph.maxWords);
  validateTextRule(issues, "strategicPositioning.positioningParagraph1", spec.strategicPositioning.positioningParagraph1.value, spec.strategicPositioning.positioningParagraph1.required, spec.strategicPositioning.positioningParagraph1.minWords, spec.strategicPositioning.positioningParagraph1.maxWords);
  validateTextRule(issues, "strategicPositioning.positioningParagraph2", spec.strategicPositioning.positioningParagraph2?.value ?? "", false, spec.strategicPositioning.positioningParagraph2?.minWords, spec.strategicPositioning.positioningParagraph2?.maxWords);
  validateTextRule(issues, "evidenceBase.intro", spec.evidenceBase.intro.value, spec.evidenceBase.intro.required, spec.evidenceBase.intro.minWords, spec.evidenceBase.intro.maxWords);

  validateListRule(issues, "strategicPositioning.priorityAreas", spec.strategicPositioning.priorityAreas?.value ?? [], false, spec.strategicPositioning.priorityAreas?.minItems, spec.strategicPositioning.priorityAreas?.maxItems, spec.strategicPositioning.priorityAreas?.maxWords);
  validateListRule(issues, "strategicPositioning.sensitivityPoints", spec.strategicPositioning.sensitivityPoints?.value ?? [], false, spec.strategicPositioning.sensitivityPoints?.minItems, spec.strategicPositioning.sensitivityPoints?.maxItems, spec.strategicPositioning.sensitivityPoints?.maxWords);
  validateListRule(issues, "strategicPositioning.visibilityNeeds", spec.strategicPositioning.visibilityNeeds?.value ?? [], false, spec.strategicPositioning.visibilityNeeds?.minItems, spec.strategicPositioning.visibilityNeeds?.maxItems, spec.strategicPositioning.visibilityNeeds?.maxWords);

  const evidenceItems = spec.evidenceBase.items.value;
  if (evidenceItems.length < 3 || evidenceItems.length > 6) {
    issues.push(issue("evidenceBase.items", "Evidence base must contain three to six items.", "item-count"));
  }
  evidenceItems.forEach((item, index) => {
    validateTextRule(issues, `evidenceBase.items[${index}].code`, item.code, true, undefined, 2);
    validateTextRule(issues, `evidenceBase.items[${index}].signal`, item.signal, true, undefined, 14);
    validateTextRule(issues, `evidenceBase.items[${index}].significance`, item.significance, true, undefined, 12);
    if (evidenceTaxonomyPattern.test(item.signal) && !implicationPattern.test(item.significance)) {
      issues.push(issue(`evidenceBase.items[${index}]`, "Evidence reads like taxonomy rather than consequence.", "artifact-fail"));
    }
  });

  if (!alternatePathDiscriminator.test(spec.forwardOrientation.alternatePathParagraph.value)) {
    issues.push(issue("forwardOrientation.alternatePathParagraph", "Forward orientation must include a true alternate path.", "artifact-fail"));
  }

  const positioningBlob = [
    spec.strategicPositioning.positioningParagraph1.value,
    spec.strategicPositioning.positioningParagraph2?.value ?? "",
    ...(spec.strategicPositioning.priorityAreas?.value ?? []),
  ].join(" ");
  if (genericConsultingPhrases.some((pattern) => pattern.test(positioningBlob))) {
    issues.push(issue("strategicPositioning", "Strategic positioning sounds like generic consulting advice.", "artifact-fail"));
  }

  const sectionTitles = [
    spec.systemStateOverview.sectionTitle.value,
    spec.narrativeDevelopment.sectionTitle.value,
    spec.structuralInterpretation.sectionTitle.value,
    spec.forwardOrientation.sectionTitle.value,
    spec.strategicPositioning.sectionTitle.value,
  ].map((value) => clean(value).toLowerCase());
  if (new Set(sectionTitles).size !== 5) {
    issues.push(issue("sectionTitles", "Executive sections must map cleanly to the five-section architecture.", "artifact-fail"));
  }

  for (const field of [
    spec.systemStateOverview.meaningParagraph.value,
    spec.structuralInterpretation.interpretationParagraph1.value,
    spec.forwardOrientation.primaryPathParagraph.value,
    spec.forwardOrientation.alternatePathParagraph.value,
    spec.strategicPositioning.positioningParagraph1.value,
  ]) {
    if (!implicationPattern.test(field)) {
      issues.push(issue("executiveTone", "Executive brief paragraphs must carry direct implication and causal clarity.", "artifact-fail"));
      break;
    }
  }

  for (const similarity of inspectExecutiveBodyRailSimilarity(spec)) {
    if (!similarity.ok) {
      issues.push(issue(`${similarity.sectionId}.sidebarInsight`, similarity.message, "artifact-fail"));
    }
  }

  return { ok: issues.length === 0, issues };
}

export function inspectExecutiveBriefSpecFields(spec: ExecutiveBriefSpec): ArtifactFieldValidationStatus[] {
  const validation = validateExecutiveBriefSpec(spec);
  const issueMap = new Map<string, string[]>();

  for (const current of validation.issues) {
    const messages = issueMap.get(current.path) ?? [];
    messages.push(current.message);
    issueMap.set(current.path, messages);
  }

  const trackedPaths = [
    "header.scenarioName",
    "header.boundedWorld",
    "header.asOfLabel",
    "header.currentPhase",
    "header.executiveHeadline",
    "header.executiveSubline",
    "systemStateOverview.currentConditionParagraph",
    "systemStateOverview.meaningParagraph",
    "systemStateOverview.sidebarInsight",
    "narrativeDevelopment.earlySignalsParagraph",
    "narrativeDevelopment.systemicUptakeParagraph",
    "narrativeDevelopment.currentConditionParagraph",
    "narrativeDevelopment.sidebarInsight",
    "structuralInterpretation.interpretationParagraph1",
    "structuralInterpretation.interpretationParagraph2",
    "structuralInterpretation.sidebarInsight",
    "forwardOrientation.primaryPathParagraph",
    "forwardOrientation.alternatePathParagraph",
    "forwardOrientation.sidebarInsight",
    "strategicPositioning.positioningParagraph1",
    "strategicPositioning.positioningParagraph2",
    "strategicPositioning.priorityAreas",
    "strategicPositioning.sensitivityPoints",
    "strategicPositioning.visibilityNeeds",
    "strategicPositioning.sidebarInsight",
    "evidenceBase.intro",
    "evidenceBase.items",
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
