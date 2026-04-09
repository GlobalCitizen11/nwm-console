import type {
  BoardOnePagerContent,
  CanonicalExportSummary,
  ExecutiveBriefContent,
  ExportQaIssue,
  ExportQaResult,
  PresentationBriefContent,
} from "../types/export";
import { validateExecutiveBriefSpec as validateExecutiveBriefArtifactSpec } from "../../../lib/validateArtifactSpecs";
import { SYSTEM_LABELS } from "../../../lib/systemLabels";

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const words = (text: string) => clean(text).split(/\s+/).filter(Boolean);
const wordCount = (text: string) => words(text).length;

const danglingEndings = /\b(and|which|because|with|the|one|one of|of|to|for|in|on|a|an)$/i;
const predictionPattern = /\b(will likely|would likely|is likely to|are likely to|likely to|expected to|projected to|predicted to|forecast to)\b/i;
const recommendationPattern = /\b(should|recommend|recommended|needs to|need to|ought to|prioritize|take action|act now|intervene|optimi[sz]e|plan to)\b/i;

const completeSentence = (text: string) => /[.!?]$/.test(clean(text)) && !danglingEndings.test(clean(text).replace(/[.!?]+$/, ""));

const issue = (
  code: ExportQaIssue["code"],
  message: string,
  level: ExportQaIssue["level"] = "error",
): ExportQaIssue => ({ level, code, message });

const requireText = (
  issues: ExportQaIssue[],
  label: string,
  value: string,
) => {
  if (!clean(value)) {
    issues.push(issue("underfill", `${label} is required.`));
  }
};

const requireList = (
  issues: ExportQaIssue[],
  label: string,
  items: string[],
  min = 1,
) => {
  if (items.filter((item) => clean(item)).length < min) {
    issues.push(issue("underfill", `${label} must contain at least ${min} item${min === 1 ? "" : "s"}.`));
  }
};

const languageIssues = (texts: string[], code: ExportQaIssue["code"]): ExportQaIssue[] =>
  texts.flatMap((text) => {
    const issues: ExportQaIssue[] = [];
    const normalized = clean(text);
    if (!normalized) {
      issues.push(issue("underfill", "Empty content block detected."));
      return issues;
    }
    if (!completeSentence(normalized)) {
      issues.push(issue(code, `Incomplete sentence detected: "${normalized}"`));
    }
    if (/(\b\w+\b)(?:\s+\1\b)+/i.test(normalized)) {
      issues.push(issue(code, `Repeated phrase detected: "${normalized}"`));
    }
    if (predictionPattern.test(normalized) || recommendationPattern.test(normalized)) {
      issues.push(issue(code, `Artifact must remain orientation-only and avoid prediction or recommendation language: "${normalized}"`));
    }
    return issues;
  });

const requireStateVector = (
  issues: ExportQaIssue[],
  label: string,
  stateVector: CanonicalExportSummary["stateVector"] | BoardOnePagerContent["v2"]["stateVector"] | ExecutiveBriefContent["v2"]["stateVector"],
) => {
  if (!Number.isFinite(stateVector.velocity) || !Number.isFinite(stateVector.density) || !Number.isFinite(stateVector.coherence) || !Number.isFinite(stateVector.reversibility)) {
    issues.push(issue("underfill", `${label} must include a complete state vector.`));
  }
  requireText(issues, `${label} basis`, stateVector.basis);
};

const requirePhaseResolution = (
  issues: ExportQaIssue[],
  label: string,
  phaseResolution: CanonicalExportSummary["phaseResolution"] | BoardOnePagerContent["v2"]["phaseResolution"] | ExecutiveBriefContent["v2"]["phaseResolution"],
) => {
  requireText(issues, `${label} phase`, phaseResolution.phase);
  requireText(issues, `${label} adjudication status`, phaseResolution.adjudicationStatus);
  requireText(issues, `${label} rationale`, phaseResolution.rationale);
  requireList(issues, `${label} threshold conditions`, phaseResolution.thresholdConditions, 1);
  if (phaseResolution.adjudicationStatus !== "pal-like-threshold") {
    issues.push(issue("density", `${label} must preserve the threshold-based ${SYSTEM_LABELS.PAL} contract.`));
  }
};

const requireProofScaffoldRules = (
  issues: ExportQaIssue[],
  summary: CanonicalExportSummary,
) => {
  requireText(issues, "Proof summary", summary.proofSummary);
  if (summary.proofScaffolds.some((proof) => proof.proofStatus !== "pre-governance-grade")) {
    issues.push(issue("density", "Proof scaffolds must be labeled pre-governance-grade."));
  }
};

const requirePreGcsRules = (
  issues: ExportQaIssue[],
  preGcs: CanonicalExportSummary["preGcsSensitivity"] | ExecutiveBriefContent["v2"]["preGcsSensitivity"],
) => {
  if (!preGcs.enabled) {
    issues.push(issue("underfill", "Pre-GCS sensitivity layer must be enabled."));
  }
  requireText(issues, "Pre-GCS reason", preGcs.reason);
  requireList(issues, "Primary sensitivities", preGcs.primarySensitivities, 1);
  requireList(issues, "Counterweight conditions", preGcs.counterweightConditions, 1);
  requireList(issues, "Non-effect zones", preGcs.nonEffectZones, 1);
  requireList(issues, "Reversibility constraints", preGcs.reversibilityConstraints, 1);
  if (!/threshold-based/i.test(preGcs.reason)) {
    issues.push(
      issue(
        "density",
        `Pre-GCS reason must explicitly mark the layer as threshold-based rather than a full institutional ${SYSTEM_LABELS.PAL}.`,
      ),
    );
  }
};

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
    summary.artifactSetSummary,
    summary.traceabilitySummary,
    summary.proofSummary,
  ];

  const issues = languageIssues(fields, "density");
  requireStateVector(issues, "Canonical summary", summary.stateVector);
  requirePhaseResolution(issues, "Canonical summary", summary.phaseResolution);
  requireProofScaffoldRules(issues, summary);
  requirePreGcsRules(issues, summary.preGcsSensitivity);
  if (summary.artifactStateMapping.length === 0) {
    issues.push(issue("underfill", "Canonical summary must include artifact-to-state traceability."));
  }
  if (summary.temporalSpine.length === 0) {
    issues.push(issue("underfill", "Canonical summary must include a temporal spine."));
  }

  return { ok: issues.length === 0, issues };
};

export const validateBoardOnePager = (content: BoardOnePagerContent): ExportQaResult => {
  const issues: ExportQaIssue[] = languageIssues(
    [
      content.v2.currentState,
      content.v2.structuralReality,
      ...content.v2.keyDrivers,
      ...content.v2.immediateImplications,
      ...content.v2.whatToWatch,
      content.v2.adjudicationStatus,
      content.v2.traceabilitySummary,
      content.v2.proofSummary,
    ],
    "density",
  );

  requireText(issues, "Board current state", content.v2.currentState);
  requireText(issues, "Board structural reality", content.v2.structuralReality);
  requireList(issues, "Board key drivers", content.v2.keyDrivers, 2);
  requireList(issues, "Board immediate implications", content.v2.immediateImplications, 2);
  requireList(issues, "Board what to watch", content.v2.whatToWatch, 2);
  requireText(issues, "Board adjudication status", content.v2.adjudicationStatus);
  requireText(issues, "Board traceability summary", content.v2.traceabilitySummary);
  requireText(issues, "Board proof summary", content.v2.proofSummary);
  requireStateVector(issues, "Board one-pager", content.v2.stateVector);
  requirePhaseResolution(issues, "Board one-pager", content.v2.phaseResolution);

  if (content.evidenceAnchors.length < 3) {
    issues.push(issue("underfill", "Board one-pager must include three evidence anchors."));
  }

  return { ok: issues.length === 0, issues };
};

export const validateExecutiveBrief = (content: ExecutiveBriefContent): ExportQaResult => {
  const paragraphs = [
    content.v2.boundedWorldDefinition,
    content.v2.artifactSetSummary,
    content.spec.systemStateOverview.currentConditionParagraph.value,
    content.spec.systemStateOverview.meaningParagraph.value,
    content.spec.narrativeDevelopment.earlySignalsParagraph.value,
    content.spec.narrativeDevelopment.systemicUptakeParagraph.value,
    content.spec.narrativeDevelopment.currentConditionParagraph.value,
    content.spec.forwardOrientation.primaryPathParagraph.value,
    content.spec.forwardOrientation.alternatePathParagraph.value,
    content.v2.traceabilitySummary,
    content.v2.proofSummary,
  ].filter(Boolean);

  const issues: ExportQaIssue[] = languageIssues(paragraphs, "density");
  requireText(issues, "Executive bounded world definition", content.v2.boundedWorldDefinition);
  requireText(issues, "Executive artifact set summary", content.v2.artifactSetSummary);
  requireText(issues, "Executive traceability summary", content.v2.traceabilitySummary);
  requireText(issues, "Executive proof summary", content.v2.proofSummary);
  requireStateVector(issues, "Executive brief", content.v2.stateVector);
  requirePhaseResolution(issues, "Executive brief", content.v2.phaseResolution);
  requirePreGcsRules(issues, content.v2.preGcsSensitivity);
  if (content.v2.artifactStateMapping.length === 0) {
    issues.push(issue("underfill", "Executive brief must include artifact-to-state mapping."));
  }
  if (content.v2.temporalSpine.length === 0) {
    issues.push(issue("underfill", "Executive brief must include a temporal spine."));
  }
  if (content.spec.evidenceBase.items.value.length < 3 || content.spec.evidenceBase.items.value.length > 6) {
    issues.push(issue("overflow", "Executive evidence base must contain three to six signals."));
  }
  if (clean(content.spec.header.validityLabel.value).replace(/[.!?]+$/g, "").trim() !== "Structurally Valid") {
    issues.push(issue("density", "Executive brief is withheld because the structural validity gate is incomplete."));
  }
  const specValidation = validateExecutiveBriefArtifactSpec(content.spec);
  for (const specIssue of specValidation.issues) {
    issues.push(
      issue(
        specIssue.code === "item-count" ? "overflow" : "density",
        `${specIssue.path}: ${specIssue.message}`,
        specIssue.level,
      ),
    );
  }

  return { ok: issues.length === 0, issues };
};

export const validatePresentationBrief = (content: PresentationBriefContent): ExportQaResult => {
  const issues: ExportQaIssue[] = [];

  if (content.slides.length < 7 || content.slides.length > 9) {
    issues.push(issue("overflow", "Presentation slide count is outside the 7-9 range."));
  }

  const slideTitles = new Set(content.slides.map((slide) => clean(slide.title).toLowerCase()));
  const requiredTitles = [
    "current state read",
    "state vector",
    "adjudication status",
    "artifact traceability",
    "temporal spine",
    "proof scaffold",
    "pre-gcs sensitivity",
    "what to watch",
  ];
  for (const title of requiredTitles) {
    if (!slideTitles.has(title)) {
      issues.push(issue("underfill", `Presentation brief is missing the "${title}" slide.`));
    }
  }

  for (const slide of content.slides) {
    if (slide.bullets.length < 2 || slide.bullets.length > 4) {
      issues.push(issue("overflow", `${slide.title} has an invalid bullet count.`));
    }
    if (wordCount(slide.headline) + slide.bullets.reduce((sum, bullet) => sum + wordCount(bullet), 0) > 70) {
      issues.push(issue("overflow", `${slide.title} exceeds the 70-word budget.`));
    }
    if (!clean(slide.headline)) {
      issues.push(issue("underfill", `${slide.title} must include a headline.`));
    }
    if (predictionPattern.test(slide.headline) || recommendationPattern.test(slide.headline)) {
      issues.push(issue("density", `${slide.title} headline must remain orientation-only.`));
    }
    issues.push(...languageIssues(slide.bullets, "density"));
  }

  const slideText = content.slides.flatMap((slide) => [slide.title, slide.headline, ...slide.bullets]);
  const hasStateVector = slideText.some((text) => /state vector|velocity|density|coherence|reversibility/i.test(text));
  const hasAdjudication = slideText.some((text) => /adjudication|threshold-based/i.test(text));
  const hasTraceability = slideText.some((text) => /traceability|artifact/i.test(text));
  const hasProof = slideText.some((text) => /proof scaffold|proof/i.test(text));
  if (!hasStateVector) {
    issues.push(issue("underfill", "Presentation brief must include state vector content."));
  }
  if (!hasAdjudication) {
    issues.push(issue("underfill", "Presentation brief must include phase and adjudication status."));
  }
  if (!hasTraceability) {
    issues.push(issue("underfill", "Presentation brief must include artifact traceability."));
  }
  if (!hasProof) {
    issues.push(issue("underfill", "Presentation brief must include proof reference."));
  }

  return { ok: issues.length === 0, issues };
};
