import type {
  ArtifactRecord,
  ArtifactStateMappingRow,
  SimulationResult,
  SourceType,
  ViewSnapshot,
  WorldStatePoint,
} from "../types";
import { buildCanonicalSummary } from "../features/export/utils/canonicalSummary";
import { normalizeExportData } from "../features/export/utils/normalizeExportData";
import {
  getAdjudicationStatusDisplay,
  getGateAdjudicationStatusDisplay,
  getPhaseResolutionReasonDisplay,
  SYSTEM_DISPLAY_LABELS,
  SYSTEM_LABELS,
} from "./systemLabels";
import { extractBriefingState } from "../utils/briefingArtifacts";
import type { LocalNwmConsoleTabId } from "./buildLocalNwmConsole";

interface LocalNwmConsolePdfRequest {
  scenarioLabel: string;
  scenarioId: string;
  result: SimulationResult;
  point: WorldStatePoint;
  currentView: ViewSnapshot;
  tabId: LocalNwmConsoleTabId;
}

type AuditScale = "manual" | "semi-structured" | "formal";

const sourceTypeTitle: Record<SourceType, string> = {
  policy: "Policy",
  media: "Media",
  market: "Market",
  legal: "Legal",
  infrastructure: "Infrastructure",
  sovereign: "Sovereign",
};

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const sentence = (text: string) => {
  const normalized = clean(text).replace(/[.!?]+$/g, "").trim();
  return normalized ? `${normalized}.` : "";
};

const take = <T,>(items: T[], count: number) => items.slice(0, count);

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const trimWords = (text: string, count: number) => {
  const words = clean(text).split(/\s+/).filter(Boolean);
  if (words.length <= count) {
    return sentence(text);
  }
  return sentence(words.slice(0, count).join(" "));
};

const slugify = (text: string) =>
  clean(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const joinList = (items: string[]) => {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const classifyVariable = (value: number) => {
  if (value >= 75) {
    return "High";
  }
  if (value >= 55) {
    return "Medium-High";
  }
  if (value >= 30) {
    return "Medium";
  }
  return "Low";
};

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const printHtmlFallback = (html: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("local-nwm-console-print-frame");
    existing?.remove();

    const frame = document.createElement("iframe");
    frame.id = "local-nwm-console-print-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.opacity = "0";
    frame.style.pointerEvents = "none";
    frame.style.border = "0";

    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        window.setTimeout(() => {
          frame.remove();
          resolve();
        }, 400);
      } catch (error) {
        frame.remove();
        reject(error);
      }
    };

    document.body.appendChild(frame);
    frame.srcdoc = html;
  });

const buildArtifactTypeMappings = (artifacts: ArtifactRecord[], mappings: ArtifactStateMappingRow[]) => {
  const mappingById = new Map(mappings.map((mapping) => [mapping.artifactId, mapping]));
  const grouped = new Map<
    SourceType,
    {
      primaryFunctions: string[];
      stateEffects: string[];
      interpretiveRoles: string[];
    }
  >();

  for (const artifact of artifacts) {
    const current = grouped.get(artifact.sourceType) ?? {
      primaryFunctions: [],
      stateEffects: [],
      interpretiveRoles: [],
    };
    const mapping = mappingById.get(artifact.id);
    current.primaryFunctions.push(artifact.primaryFunction);
    if (mapping?.stateEffect) {
      current.stateEffects.push(mapping.stateEffect);
    }
    if (mapping?.interpretiveRole) {
      current.interpretiveRoles.push(mapping.interpretiveRole);
    }
    grouped.set(artifact.sourceType, current);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([sourceType, group]) => ({
      label: sourceTypeTitle[sourceType],
      primaryFunction: trimWords(joinList(take(unique(group.primaryFunctions), 2)), 14),
      stateEffect: trimWords(joinList(take(unique(group.stateEffects), 2)), 18),
      interpretiveRole: trimWords(joinList(take(unique(group.interpretiveRoles), 2)), 18),
    }));
};

const getAuditStatuses = ({
  proofCheckPassed,
  phaseCheckPassed,
  artifactMappingCount,
  proofTraceVisibleCount,
  proofScaffoldsAllPreGov,
  stateVectorBasis,
  artifactSetSummary,
}: {
  proofCheckPassed: boolean;
  phaseCheckPassed: boolean;
  artifactMappingCount: number;
  proofTraceVisibleCount: number;
  proofScaffoldsAllPreGov: boolean;
  stateVectorBasis: string;
  artifactSetSummary: string;
}) => {
  const traceability: AuditScale = proofCheckPassed
    ? "formal"
    : artifactMappingCount > 0 || proofTraceVisibleCount > 0
      ? "semi-structured"
      : "manual";
  const stateDerivation: AuditScale =
    stateVectorBasis === "deterministic-replay" && artifactMappingCount > 0
      ? "formal"
      : artifactSetSummary
        ? "semi-structured"
        : "manual";

  return {
    traceability,
    stateDerivation,
    phaseAdjudication: phaseCheckPassed ? SYSTEM_LABELS.PAL : "Interpretive only",
    proofObjectStatus: proofScaffoldsAllPreGov ? "pre-governance-grade" : "governance-grade",
  };
};

const renderList = (items: string[], className = "bullet-list") =>
  `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

const renderMetricGrid = (
  items: Array<{ label: string; value: string; support?: string }>,
  variant: "two" | "four" = "two",
) =>
  `<div class="metric-grid metric-grid--${variant}">
    ${items
      .map(
        (item) => `<article class="metric-card">
          <p class="mini-label">${escapeHtml(item.label)}</p>
          <p class="metric-value">${escapeHtml(item.value)}</p>
          ${item.support ? `<p class="metric-support">${escapeHtml(item.support)}</p>` : ""}
        </article>`,
      )
      .join("")}
  </div>`;

const renderSection = ({
  label,
  title,
  intro,
  body,
  panelClassName = "",
}: {
  label: string;
  title: string;
  intro?: string;
  body: string;
  panelClassName?: string;
}) => `<section class="panel ${panelClassName}">
  <p class="section-label">${escapeHtml(label)}</p>
  <h3 class="section-title">${escapeHtml(title)}</h3>
  ${intro ? `<p class="section-intro">${escapeHtml(intro)}</p>` : ""}
  ${body}
</section>`;

const renderTimeline = (items: Array<{ label: string; month: number; phase: string; summary: string }>) =>
  `<div class="timeline-stack">
    ${items
      .map(
        (item) => `<article class="timeline-item">
          <div class="timeline-head">
            <p class="timeline-label">${escapeHtml(item.label)}</p>
            <p class="timeline-month">M${item.month}</p>
          </div>
          <p class="timeline-phase">${escapeHtml(item.phase)}</p>
          <p class="timeline-summary">${escapeHtml(item.summary)}</p>
        </article>`,
      )
      .join("")}
  </div>`;

const renderAuditGrid = (
  items: Array<{ label: string; value: string }>,
) =>
  `<div class="audit-grid">
    ${items
      .map(
        (item) => `<article class="audit-card">
          <p class="mini-label">${escapeHtml(item.label)}</p>
          <p class="audit-value">${escapeHtml(item.value)}</p>
        </article>`,
      )
      .join("")}
  </div>`;

const renderArtifactMatrix = (
  items: Array<{ label: string; primaryFunction: string; stateEffect: string; interpretiveRole: string }>,
) =>
  `<div class="artifact-matrix">
    ${items
      .map(
        (item) => `<article class="artifact-card">
          <p class="artifact-label">${escapeHtml(item.label)}</p>
          <dl class="artifact-meta">
            <div>
              <dt>Primary Function</dt>
              <dd>${escapeHtml(item.primaryFunction)}</dd>
            </div>
            <div>
              <dt>State Effect</dt>
              <dd>${escapeHtml(item.stateEffect)}</dd>
            </div>
            <div>
              <dt>Interpretive Role</dt>
              <dd>${escapeHtml(item.interpretiveRole)}</dd>
            </div>
          </dl>
        </article>`,
      )
      .join("")}
  </div>`;

const baseStyles = `
  @page {
    size: letter portrait;
    margin: 0;
  }

  :root {
    color-scheme: dark;
    --page-bg: #0c1117;
    --screen-bg: #070b10;
    --ink: #d7e0ea;
    --ink-bright: #eef3f7;
    --ink-muted: #9fb0c1;
    --ink-soft: #7f90a4;
    --accent: #d5b349;
    --accent-soft: rgba(213, 179, 73, 0.2);
    --rule: #223041;
    --rule-strong: rgba(213, 179, 73, 0.34);
    --panel: rgba(18, 25, 34, 0.94);
    --panel-strong: rgba(24, 33, 44, 0.98);
    --panel-soft: rgba(15, 22, 30, 0.9);
    --shadow: 0 14px 36px rgba(0, 0, 0, 0.32);
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    min-height: 100%;
    background: var(--screen-bg);
    color: var(--ink);
    font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.34;
    text-rendering: optimizeLegibility;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0, "clig" 0, "calt" 0;
  }

  body {
    display: grid;
    justify-content: center;
    gap: 18px;
    padding: 16px;
  }

  .export-page-frame {
    width: 8.5in;
    height: 11in;
    overflow: hidden;
    background:
      radial-gradient(circle at top right, rgba(124, 166, 200, 0.08), transparent 22%),
      radial-gradient(circle at top left, rgba(213, 179, 73, 0.06), transparent 20%),
      linear-gradient(180deg, #0d141b 0%, #0a1117 100%);
    page-break-after: always;
    break-after: page;
    box-shadow: var(--shadow);
  }

  .export-page-frame:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .page-shell {
    width: 100%;
    height: 100%;
    padding: 30pt 34pt 22pt;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 9pt;
    background: rgba(8, 13, 19, 0.56);
    border: 1px solid rgba(34, 48, 65, 0.9);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .page-header {
    display: grid;
    gap: 4pt;
    padding-bottom: 7pt;
    border-bottom: 1px solid var(--rule);
    background-image: linear-gradient(to right, var(--accent) 0 36pt, transparent 36pt);
    background-repeat: no-repeat;
    background-position: left bottom;
    background-size: 100% 2px;
  }

  .kicker {
    font-size: 8.6pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent);
  }

  .page-title {
    margin: 0;
    font-size: 19.5pt;
    line-height: 1.02;
    font-weight: 700;
    color: var(--ink-bright);
  }

  .page-subtitle {
    margin: 0;
    font-size: 9.1pt;
    line-height: 1.24;
    color: var(--ink-muted);
  }

  .page-body {
    display: grid;
    gap: 8pt;
    align-content: start;
    min-height: 0;
    overflow: hidden;
  }

  .hero-panel,
  .panel {
    border: 1px solid rgba(34, 48, 65, 0.95);
    background:
      linear-gradient(180deg, rgba(20, 28, 37, 0.98) 0%, rgba(14, 20, 28, 0.96) 100%);
    box-shadow:
      0 0 0 1px rgba(34, 48, 65, 0.36),
      inset 2px 0 0 0 rgba(213, 179, 73, 0.78);
  }

  .hero-panel {
    display: grid;
    gap: 6pt;
    padding: 10pt;
    align-content: start;
  }

  .hero-panel h2,
  .section-title {
    margin: 0;
    font-size: 12.4pt;
    line-height: 1.08;
    font-weight: 700;
    color: var(--ink-bright);
  }

  .hero-copy,
  .section-intro,
  .body-copy,
  .timeline-summary,
  .artifact-meta dd,
  .audit-value,
  .metric-support,
  .footer-note {
    margin: 0;
    font-size: 9pt;
    line-height: 1.22;
    color: var(--ink);
  }

  .hero-copy {
    font-size: 9.3pt;
  }

  .panel {
    display: grid;
    gap: 5pt;
    padding: 8pt;
    align-content: start;
    height: 100%;
  }

  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 6pt;
    width: fit-content;
    margin: 0;
    font-size: 8.3pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent);
  }

  .section-label::before {
    content: "";
    width: 10pt;
    border-top: 1px solid var(--accent);
  }

  .metric-grid {
    display: grid;
    gap: 6pt;
    align-items: stretch;
  }

  .metric-grid--two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-grid--four {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .metric-card,
  .audit-card {
    display: grid;
    gap: 3pt;
    align-content: start;
    padding: 7pt 8pt;
    border: 1px solid rgba(34, 48, 65, 0.95);
    background:
      linear-gradient(180deg, rgba(24, 33, 44, 0.98) 0%, rgba(17, 24, 33, 0.96) 100%);
    height: 100%;
  }

  .mini-label,
  .timeline-label,
  .artifact-label,
  .artifact-meta dt {
    margin: 0;
    font-size: 8.2pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink-muted);
  }

  .metric-value {
    margin: 0;
    font-size: 12.4pt;
    line-height: 1;
    font-weight: 700;
    color: var(--ink-bright);
  }

  .metric-support {
    font-size: 8pt;
    color: var(--ink-soft);
  }

  .split-grid {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 8pt;
    align-items: stretch;
  }

  .stack {
    display: grid;
    gap: 8pt;
    align-content: start;
    align-items: stretch;
  }

  .timeline-stack {
    display: grid;
    gap: 6pt;
    align-items: stretch;
  }

  .timeline-item {
    display: grid;
    gap: 3pt;
    align-content: start;
    padding: 7pt 8pt;
    border: 1px solid rgba(34, 48, 65, 0.92);
    background:
      linear-gradient(180deg, rgba(19, 27, 36, 0.97) 0%, rgba(14, 20, 28, 0.96) 100%);
    height: 100%;
  }

  .timeline-head {
    display: flex;
    justify-content: space-between;
    gap: 8pt;
    align-items: center;
  }

  .timeline-month,
  .timeline-phase {
    margin: 0;
    color: var(--ink-bright);
    font-size: 8.2pt;
    font-weight: 600;
  }

  .audit-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6pt;
    align-items: stretch;
  }

  .artifact-matrix {
    display: grid;
    gap: 6pt;
    align-items: stretch;
  }

  .artifact-card {
    display: grid;
    gap: 4pt;
    align-content: start;
    padding: 8pt;
    border: 1px solid rgba(34, 48, 65, 0.92);
    background:
      linear-gradient(180deg, rgba(19, 27, 36, 0.97) 0%, rgba(14, 20, 28, 0.96) 100%);
    height: 100%;
  }

  .artifact-meta {
    margin: 0;
    display: grid;
    gap: 4pt;
  }

  .artifact-meta div {
    display: grid;
    gap: 2pt;
  }

  .bullet-list,
  .signal-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6pt;
  }

  .bullet-list li,
  .signal-list li {
    position: relative;
    padding-left: 12pt;
    font-size: 8.9pt;
    line-height: 1.2;
    color: var(--ink);
  }

  .bullet-list li::before,
  .signal-list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.46em;
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: var(--accent);
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    gap: 10pt;
    padding-top: 6pt;
    border-top: 1px solid rgba(34, 48, 65, 0.8);
  }

  .footer-note {
    font-size: 8pt;
    color: var(--ink-soft);
  }

  .onepager-hero {
    display: grid;
    gap: 6pt;
    padding: 10pt;
    align-content: start;
    border: 1px solid rgba(34, 48, 65, 0.95);
    background:
      linear-gradient(135deg, rgba(20, 32, 45, 0.34), rgba(8, 15, 23, 0) 42%),
      linear-gradient(180deg, rgba(24, 33, 44, 0.98) 0%, rgba(16, 23, 32, 0.96) 100%);
    box-shadow:
      inset 2px 0 0 rgba(213, 179, 73, 0.78),
      0 0 0 1px rgba(34, 48, 65, 0.36);
  }

  .authority-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6pt;
    align-items: stretch;
  }

  .pill {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6pt;
    min-height: 100%;
    padding: 4pt 6pt;
    border: 1px solid rgba(34, 48, 65, 0.95);
    background: rgba(17, 24, 33, 0.94);
    color: var(--ink-muted);
    font-size: 7.8pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: center;
  }

  .grid-2x3 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 1fr;
    gap: 8pt;
    align-items: stretch;
  }

  .evidence-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 1fr;
    gap: 6pt;
    align-items: stretch;
  }

  .evidence-card {
    display: grid;
    gap: 3pt;
    align-content: start;
    padding: 7pt 8pt;
    border: 1px solid rgba(34, 48, 65, 0.95);
    background:
      linear-gradient(180deg, rgba(20, 28, 37, 0.98) 0%, rgba(14, 20, 28, 0.96) 100%);
    height: 100%;
  }

  .evidence-card h4 {
    margin: 0;
    font-size: 8.8pt;
    line-height: 1.14;
    color: var(--ink-bright);
  }

  .evidence-card p {
    margin: 0;
    font-size: 7.9pt;
    line-height: 1.18;
    color: var(--ink-muted);
  }

  @media print {
    body {
      gap: 0;
      padding: 0;
    }

    .export-page-frame {
      box-shadow: none;
    }
  }
`;

const buildExecutivePdfPages = ({
  scenarioLabel,
  result,
  validity,
  briefStatus,
  adjudicationStatus,
  phaseCheckPassed,
  withheldReason,
  summary,
  artifactMappings,
  auditStatuses,
}: {
  scenarioLabel: string;
  result: SimulationResult;
  validity: string;
  briefStatus: string;
  adjudicationStatus: string;
  phaseCheckPassed: boolean;
  withheldReason?: string;
  summary: ReturnType<typeof buildCanonicalSummary>;
  artifactMappings: ReturnType<typeof buildArtifactTypeMappings>;
  auditStatuses: ReturnType<typeof getAuditStatuses>;
}) => {
  const gate = summary.executiveBriefGate;
  const continuity = take(summary.temporalSpine, 3).map((entry, index) => ({
    label: `T${index + 1}`,
    month: entry.month,
    phase: entry.phase,
    summary: trimWords(entry.summary, 18),
  }));
  const keyDrivers = take(
    [summary.primaryPressureSummary, summary.artifactSetSummary, summary.traceabilitySummary].map((item) => trimWords(item, 18)),
    2,
  );
  const watchItems = take(
    [summary.monitoringSummary, summary.watchpointSummary, ...summary.preGcsSensitivity.primarySensitivities].map((item) => trimWords(item, 16)),
    2,
  );
  const pageOne = `<section class="export-page-frame">
    <div class="page-shell">
      <header class="page-header">
        <p class="kicker">Local Executive Brief</p>
        <h1 class="page-title">${escapeHtml(scenarioLabel)}</h1>
        <p class="page-subtitle">${escapeHtml(result.world.name)} | ${escapeHtml(summary.replayMonth)} | <span>${escapeHtml(summary.phase)}</span></p>
      </header>
      <main class="page-body">
        <section class="hero-panel">
          <h2>State At A Glance</h2>
          <p class="hero-copy">${escapeHtml(trimWords(summary.currentStateSummary, 22))}</p>
          <p class="hero-copy">${escapeHtml(trimWords(summary.dominantPathSummary, 20))}</p>
          ${renderMetricGrid(
            [
              { label: "Mode", value: "Orientation", support: `${SYSTEM_DISPLAY_LABELS.framework} local render` },
              { label: "Brief Status", value: briefStatus, support: validity },
              { label: "Adjudication", value: adjudicationStatus, support: summary.phaseResolution.phase },
              { label: "Current Gate", value: withheldReason ? "Blocked" : "Clear", support: trimWords(withheldReason ?? "Structural gate resolved", 8) },
            ],
            "four",
          )}
        </section>
        <div class="split-grid">
          <div class="stack">
            ${renderSection({
              label: "2. Bounded World",
              title: "Domain, scope, timeframe, and artifact set",
              intro: trimWords(result.world.summary, 18),
              body: renderList([
                `Domain: ${result.world.domain}.`,
                `Scope: Included ${joinList(take(gate.boundaryDefinition.includedEntities, 3)) || result.world.name}; excluded ${joinList(take(gate.boundaryDefinition.excludedEntities, 1)) || "non-material signals"}.`,
                `Timeframe: ${gate.boundaryDefinition.temporalWindow.start} to ${gate.boundaryDefinition.temporalWindow.end} at ${gate.boundaryDefinition.temporalWindow.resolution.toLowerCase()} resolution; current read ${gate.boundaryDefinition.temporalWindow.current}.`,
                trimWords(`Artifact set: ${summary.artifactSetSummary}`, 16),
              ]),
            })}
            ${renderSection({
              label: "3. System State",
              title: "Current structural condition",
              body: renderList([
                trimWords(summary.primaryPressureSummary, 18),
                trimWords(summary.implicationsSummary, 18),
              ]),
            })}
          </div>
          <div class="stack">
            ${renderSection({
              label: "5. State Variables",
              title: "Resolved from the live state vector",
              body: renderMetricGrid(
                [
                  { label: "Velocity", value: classifyVariable(summary.stateVector.velocity), support: summary.stateVector.velocity.toFixed(1) },
                  { label: "Density", value: classifyVariable(summary.stateVector.density), support: summary.stateVector.density.toFixed(1) },
                  { label: "Coherence", value: classifyVariable(summary.stateVector.coherence), support: summary.stateVector.coherence.toFixed(1) },
                  { label: "Reversibility", value: classifyVariable(summary.stateVector.reversibility), support: summary.stateVector.reversibility.toFixed(1) },
                ],
                "two",
              ),
            })}
            ${renderSection({
              label: "6. Phase Resolution",
              title: summary.phaseResolution.phase,
              intro: adjudicationStatus,
              body: `<p class="body-copy">${escapeHtml(trimWords(getPhaseResolutionReasonDisplay(summary.phaseResolution.rationale), 40))}</p>${renderList(
                take(summary.phaseResolution.thresholdConditions.map((item) => trimWords(item, 12)), 2),
              )}`,
            })}
          </div>
        </div>
      </main>
      <footer class="page-footer">
        <p class="footer-note">Artifacts -> state -> phase -> output.</p>
        <p class="footer-note">Page 1 of 3</p>
      </footer>
    </div>
  </section>`;

  const pageTwo = `<section class="export-page-frame">
    <div class="page-shell">
      <header class="page-header">
        <p class="kicker">Executive Brief Development</p>
        <h1 class="page-title">Narrative Formation And Continuity</h1>
        <p class="page-subtitle">How the current operating condition formed inside the bounded world.</p>
      </header>
      <main class="page-body">
        <div class="split-grid">
          <div class="stack">
            ${renderSection({
              label: "4. Narrative Development",
              title: "Artifact-grounded system formation",
              body: `<p class="body-copy">${escapeHtml(trimWords(summary.narrativeDevelopment.earlySignalsSummary, 24))}</p>
                <p class="body-copy">${escapeHtml(trimWords(summary.narrativeDevelopment.systemicUptakeSummary, 24))}</p>
                <p class="body-copy">${escapeHtml(trimWords(summary.narrativeDevelopment.currentStateFormationSummary, 18))}</p>`,
            })}
            ${renderSection({
              label: "Key Drivers",
              title: "Drivers carrying the present read",
              body: renderList(keyDrivers),
            })}
            ${renderSection({
              label: "8. Forward Orientation",
              title: "Conditional only",
              body: `<p class="body-copy">${escapeHtml(trimWords(summary.forwardOrientationSummary, 20))}</p>
                <p class="body-copy">${escapeHtml(trimWords(summary.alternatePathSummary, 18))}</p>`,
            })}
          </div>
          <div class="stack">
            ${renderSection({
              label: "7. Temporal Continuity",
              title: "T1 -> T4 progression",
              body: renderTimeline(continuity),
            })}
            ${renderSection({
              label: "What To Watch",
              title: "Diagnostic watchpoints",
              body: renderList(watchItems, "signal-list"),
            })}
          </div>
        </div>
      </main>
      <footer class="page-footer">
        <p class="footer-note">Orientation only. No prediction or recommendation.</p>
        <p class="footer-note">Page 2 of 3</p>
      </footer>
    </div>
  </section>`;

  const sensitivitySection =
    !phaseCheckPassed
      ? renderSection({
          label: "11. Pre-GCS Sensitivity",
          title: "System response logic",
          body: renderList(
            take(
              [
                ...summary.preGcsSensitivity.primarySensitivities,
                ...summary.preGcsSensitivity.counterweightConditions,
                ...summary.preGcsSensitivity.nonEffectZones,
                ...summary.preGcsSensitivity.reversibilityConstraints,
              ].map((item) => trimWords(item, 12)),
              4,
            ),
          ),
        })
      : "";

  const pageThree = `<section class="export-page-frame">
    <div class="page-shell">
      <header class="page-header">
        <p class="kicker">Executive Brief Audit Layer</p>
        <h1 class="page-title">Traceability, Audit, And Constraint Encoding</h1>
        <p class="page-subtitle">Visible linkage from artifact set into state resolution and phase adjudication.</p>
      </header>
      <main class="page-body">
        <div class="split-grid">
          <div class="stack">
            ${renderSection({
              label: "10. Traceability",
              title: "Audit status",
              body: `${renderAuditGrid([
                { label: "Traceability", value: auditStatuses.traceability },
                { label: "State Derivation", value: auditStatuses.stateDerivation },
                { label: SYSTEM_LABELS.PAL, value: auditStatuses.phaseAdjudication },
                { label: "Proof Status", value: auditStatuses.proofObjectStatus },
              ])}
              <p class="body-copy">${escapeHtml(trimWords(summary.traceabilitySummary, 18))}</p>
              <p class="body-copy">${escapeHtml(trimWords(summary.proofSummary, 16))}</p>`,
            })}
            ${sensitivitySection}
          </div>
          <div class="stack">
            ${renderSection({
              label: "Artifact -> State Mapping",
              title: "Interpretive role by artifact type",
              body: renderArtifactMatrix(take(artifactMappings, 3)),
            })}
          </div>
        </div>
      </main>
      <footer class="page-footer">
        <p class="footer-note">Traceability markers: ${escapeHtml(joinList(take(summary.executiveBriefGate.traceabilityMarkers, 3)) || "none")}</p>
        <p class="footer-note">Page 3 of 3</p>
      </footer>
    </div>
  </section>`;

  return [pageOne, pageTwo, pageThree].join("");
};

const buildOnePagerPdfPages = ({
  scenarioLabel,
  summary,
  briefStatus,
  adjudicationStatus,
}: {
  scenarioLabel: string;
  summary: ReturnType<typeof buildCanonicalSummary>;
  briefStatus: string;
  adjudicationStatus: string;
}) => {
  const evidence = take(summary.evidenceAnchorsCompact, 3);
  const drivers = take(
    [summary.primaryPressureSummary, summary.artifactSetSummary, summary.traceabilitySummary].map((item) => trimWords(item, 12)),
    2,
  );
  const implications = take(
    [summary.implicationsSummary, summary.proofSummary, summary.structuralInterpretationSummary].map((item) => trimWords(item, 12)),
    2,
  );
  const watchItems = take(
    [summary.monitoringSummary, summary.watchpointSummary, ...summary.preGcsSensitivity.primarySensitivities].map((item) => trimWords(item, 12)),
    2,
  );

  return `<section class="export-page-frame">
    <div class="page-shell">
      <header class="page-header">
        <p class="kicker">Local One Pager</p>
        <h1 class="page-title">${escapeHtml(scenarioLabel)}</h1>
        <p class="page-subtitle">${escapeHtml(summary.replayMonth)} | ${escapeHtml(summary.phase)} | Board-ready orientation sheet</p>
      </header>
      <main class="page-body">
        <section class="onepager-hero">
          <div class="authority-strip">
            <span class="pill">Status: ${escapeHtml(briefStatus)}</span>
            <span class="pill">Density: ${escapeHtml(classifyVariable(summary.stateVector.density))}</span>
            <span class="pill">Momentum: ${escapeHtml(summary.momentum)}</span>
            <span class="pill">Adjudication: ${escapeHtml(adjudicationStatus)}</span>
          </div>
          <h2>${escapeHtml(trimWords(summary.currentStateSummary, 14))}</h2>
          <p class="hero-copy">${escapeHtml(trimWords(summary.dominantPathSummary, 14))}</p>
        </section>
        <div class="grid-2x3">
          ${renderSection({
            label: "Current State",
            title: "What condition exists now",
            body: `<p class="body-copy">${escapeHtml(trimWords(summary.currentStateSummary, 16))}</p>`,
          })}
          ${renderSection({
            label: "Structural Reality",
            title: "What is holding",
            body: `<p class="body-copy">${escapeHtml(trimWords(summary.dominantPathSummary, 16))}</p>`,
          })}
          ${renderSection({
            label: "Key Drivers",
            title: "Artifact-derived drivers",
            body: renderList(drivers),
          })}
          ${renderSection({
            label: "Immediate Implications",
            title: "Diagnostic implications",
            body: renderList(implications),
          })}
          ${renderSection({
            label: "What To Watch",
            title: "Watchpoints",
            body: renderList(watchItems),
          })}
          ${renderSection({
            label: "Adjudication",
            title: summary.phaseResolution.phase,
            body: `<p class="body-copy">${escapeHtml(adjudicationStatus)}</p>
              <p class="body-copy">${escapeHtml(trimWords(getPhaseResolutionReasonDisplay(summary.phaseResolution.rationale), 14))}</p>`,
          })}
        </div>
        <section class="panel">
          <p class="section-label">Evidence Anchors</p>
          <h3 class="section-title">Observed proof objects and signal markers</h3>
          <div class="evidence-strip">
            ${take(evidence, 2)
              .map(
                (item) => `<article class="evidence-card">
                  <h4>${escapeHtml(item.shortTitle)}</h4>
                  <p>${escapeHtml(item.shortSubtitle)}</p>
                </article>`,
              )
              .join("")}
          </div>
        </section>
      </main>
      <footer class="page-footer">
        <p class="footer-note">Immediate use: leadership read, board prep, and operating cadence.</p>
        <p class="footer-note">Page 1 of 1</p>
      </footer>
    </div>
  </section>`;
};

export const buildLocalNwmConsolePdfFilename = ({
  scenarioId,
  month,
  tabId,
}: {
  scenarioId: string;
  month: number;
  tabId: LocalNwmConsoleTabId;
}) => `${slugify(scenarioId)}-local-console-${slugify(tabId)}-m${month}.pdf`;

export function buildLocalNwmConsolePdfHtml({
  scenarioLabel,
  result,
  point,
  currentView,
  tabId,
}: Omit<LocalNwmConsolePdfRequest, "scenarioId">) {
  const state = extractBriefingState({
    scenarioName: scenarioLabel,
    result,
    point,
    currentView,
  });
  const summary = buildCanonicalSummary(normalizeExportData(state, currentView.name));
  const gate = summary.executiveBriefGate;
  const phaseCheck = gate.checks.find((check) => check.id === "phase-adjudication");
  const proofCheck = gate.checks.find((check) => check.id === "proof-object-sufficiency");
  const phaseCheckPassed = Boolean(phaseCheck?.passed);
  const adjudicationStatus = getGateAdjudicationStatusDisplay(phaseCheckPassed);
  const briefStatus = gate.validity === "Structurally Valid" ? "Exportable" : "Withheld";
  const withheldReason = gate.unmetRequirements.length > 0 ? gate.unmetRequirements.join(", ") : undefined;
  const artifactMappings = buildArtifactTypeMappings(state.v2.artifactRecords, summary.artifactStateMapping);
  const auditStatuses = getAuditStatuses({
    proofCheckPassed: Boolean(proofCheck?.passed),
    phaseCheckPassed,
    artifactMappingCount: summary.artifactStateMapping.length,
    proofTraceVisibleCount: gate.proofTrace.visibleArtifactIds.length,
    proofScaffoldsAllPreGov: summary.proofScaffolds.every((scaffold) => scaffold.proofStatus === "pre-governance-grade"),
    stateVectorBasis: summary.stateVector.basis,
    artifactSetSummary: summary.artifactSetSummary,
  });

  const pages =
    tabId === "one-pager"
      ? buildOnePagerPdfPages({
          scenarioLabel,
          summary,
          briefStatus,
          adjudicationStatus,
        })
      : buildExecutivePdfPages({
          scenarioLabel,
          result,
          validity: gate.validity,
          briefStatus,
          adjudicationStatus,
          phaseCheckPassed,
          withheldReason,
          summary,
          artifactMappings,
          auditStatuses,
        });

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(scenarioLabel)} ${tabId === "one-pager" ? "One Pager" : "Executive Brief"}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      ${pages}
    </body>
  </html>`;
}

export async function downloadLocalNwmConsolePdf(request: LocalNwmConsolePdfRequest) {
  const filename = buildLocalNwmConsolePdfFilename({
    scenarioId: request.scenarioId,
    month: request.point.month,
    tabId: request.tabId,
  });
  const html = buildLocalNwmConsolePdfHtml(request);

  try {
    const response = await fetch("/api/briefings/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "local-console",
        html,
        filename,
        orientation: "portrait",
        documentKind: request.tabId === "one-pager" ? "one-pager" : "executive",
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const blob = await response.blob();
    triggerBlobDownload(blob, filename);
  } catch {
    await printHtmlFallback(html);
  }
}
