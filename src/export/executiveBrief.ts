import type { BriefingState, ExportDocumentPlan } from "../types";
import { getFrameworkDisplayLabel, SYSTEM_DISPLAY_LABELS, SYSTEM_LABELS } from "../lib/systemLabels";
import { buildDocumentHtml, escapeText, renderFooter } from "./designSystem";
import { createModule, createPage, normalizeDocumentPlan, qaDocumentPlan } from "./layoutEngine";

const formatGeneratedAt = () =>
  new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const buildExecutiveBriefPlan = (state: BriefingState, currentViewName: string): ExportDocumentPlan => {
  const gate = state.executiveBriefGate;
  const haloCheck = gate.checks.find((check) => check.id === "halo-orientation-integrity");
  const categoryCheck = gate.checks.find((check) => check.id === "category-separation");
  const passedChecks = gate.checks.filter((check) => check.passed).map((check) => check.label);
  const failedChecks = gate.unmetRequirements;
  const boundaryPage = createPage("executive-boundary", "Narrative World Boundary", 2, 18, [
    createModule({
      id: "exec-boundary-included",
      kind: "takeaways",
      title: "Included entities",
      label: "Boundary scope",
      items: gate.boundaryDefinition.includedEntities,
    }),
    createModule({
      id: "exec-boundary-excluded",
      kind: "takeaways",
      title: "Excluded entities",
      label: "Boundary scope",
      items: gate.boundaryDefinition.excludedEntities,
    }),
    createModule({
      id: "exec-boundary-criteria",
      kind: "interpretation",
      title: "Temporal and artifact criteria",
      label: "Boundary integrity",
      narrative: [
        `Temporal window runs from ${gate.boundaryDefinition.temporalWindow.start} to ${gate.boundaryDefinition.temporalWindow.end} at ${gate.boundaryDefinition.temporalWindow.resolution.toLowerCase()} resolution, with the current read at ${gate.boundaryDefinition.temporalWindow.current}.`,
        `Artifact inclusion criteria are ${gate.boundaryDefinition.artifactInclusionCriteria.join("; ")}.`,
      ],
    }),
  ]);
  const memoryPage = createPage("executive-memory", "Structural Memory", 3, 18, [
    createModule({
      id: "exec-memory-early",
      kind: "timeline",
      title: "Early signals",
      label: "Longitudinal memory",
      items: state.earlySignals,
    }),
    createModule({
      id: "exec-memory-systemic",
      kind: "timeline",
      title: "Systemic uptake",
      label: "Longitudinal memory",
      items: state.systemicUptake,
    }),
    createModule({
      id: "exec-memory-current",
      kind: "development",
      title: "Current accumulation",
      label: "Longitudinal memory",
      items: state.latestDevelopments,
      narrative: [gate.synchronizationSummary],
    }),
  ]);
  const phasePage = createPage("executive-phase", SYSTEM_LABELS.PAL, 4, 18, [
    createModule({
      id: "exec-phase-read",
      kind: "strategic",
      title: "Phase read",
      label: SYSTEM_LABELS.PAL,
      narrative: [
        `${state.currentCondition} ${state.structuralShift}`,
        `Current state is ${state.phase} with ${state.narrativeDensity} density, ${state.structuralMomentum} momentum, and ${state.reversibility} reversibility.`,
      ],
    }),
    createModule({
      id: "exec-phase-trace",
      kind: "evidence",
      title: "Transition and proof chain",
      label: `${SYSTEM_LABELS.PAL} trace`,
      items: [
        `Transitions: ${gate.proofTrace.transitionIds.join(", ") || "none"}`,
        `Proof objects: ${gate.proofTrace.proofIds.join(", ") || "none"}`,
        `Rule versions: ${gate.proofTrace.ruleVersions.join(", ") || "none"}`,
      ],
    }),
  ]);
  const haloPage = createPage("executive-halo", SYSTEM_DISPLAY_LABELS.interpretationLayerIntegrity, 5, 18, [
    createModule({
      id: "exec-halo-allowed",
      kind: "interpretation",
      title: "Orientation-only scope",
      label: SYSTEM_LABELS.HALO,
      narrative: [
        haloCheck?.detail ?? "The artifact remains orientation-only.",
        categoryCheck?.detail ?? "Category separation is maintained.",
      ],
    }),
    createModule({
      id: "exec-halo-validity",
      kind: "takeaways",
      title: "Validity conditions",
      label: SYSTEM_LABELS.HALO,
      items: passedChecks,
    }),
    createModule({
      id: "exec-halo-failures",
      kind: "takeaways",
      title: "Failure modes",
      label: SYSTEM_LABELS.HALO,
      items: failedChecks.length > 0 ? failedChecks : ["No active failure modes"],
    }),
  ]);
  const tracePage = createPage("executive-trace", "Proof Object Traceability", 6, 18, [
    createModule({
      id: "exec-trace-summary",
      kind: "strategic",
      title: "Traceability summary",
      label: "Audit chain",
      narrative: [
        gate.proofTraceSummary,
        `Review states are ${gate.proofTrace.reviewStates.join(", ") || "unknown"}; challenge states are ${gate.proofTrace.challengeStates.join(", ") || "unknown"}.`,
      ],
    }),
    createModule({
      id: "exec-trace-markers",
      kind: "evidence",
      title: "Traceability markers",
      label: "Audit chain",
      items: gate.traceabilityMarkers,
    }),
    createModule({
      id: "exec-trace-evidence",
      kind: "evidence",
      title: "Evidence base",
      label: "Evidence",
      items: state.signalAnchors,
    }),
  ]);
  const coverPage = createPage("executive-cover", "Cover", 1, 20, [
    createModule({
      id: "exec-cover",
      kind: "cover",
      title: state.scenarioName,
      label: "Executive brief",
      narrative: [
        state.boundedWorld,
        state.boundaryDefinition,
        gate.validity === "Structurally Valid"
          ? "Phase-adjudicated orientation remains exportable."
          : "Executive brief withheld pending structural state integrity.",
      ],
    }),
    createModule({
      id: "exec-summary-cards",
      kind: "summary-cards",
      title: "Orientation gate",
      label: "Gate status",
      items: [
        `Mode: ${gate.mode}`,
        `Framework: ${getFrameworkDisplayLabel(gate.framework)}`,
        `Validity: ${gate.validity}`,
        `Phase: ${state.phase}`,
      ],
    }),
    createModule({
      id: "exec-kpis",
      kind: "kpi-strip",
      title: "System state snapshot",
      label: "KPI strip",
      items: [
        `Phase: ${state.phase}`,
        `Narrative density: ${state.narrativeDensity}`,
        `Structural momentum: ${state.structuralMomentum}`,
        `Reversibility: ${state.reversibility}`,
        `Cycle position: ${state.cyclePosition}`,
      ],
    }),
    createModule({
      id: "exec-cover-interpretation",
      kind: "interpretation",
      title: "Phase-adjudicated orientation",
      label: "Top line",
      narrative: [
        `${state.currentCondition} ${state.structuralShift}`,
        gate.proofTraceSummary,
      ],
    }),
  ]);

  if (gate.validity !== "Structurally Valid") {
    return normalizeDocumentPlan({
      mode: "executive-brief",
      title: `${state.scenarioName} Executive Brief`,
      subtitle: `${state.boundedWorld} | ${state.asOf} | ${state.phase}`,
      pages: [
        coverPage,
        createPage("executive-withheld", "Withheld Conditions", 2, 18, [
          createModule({
            id: "exec-withheld-conditions",
            kind: "takeaways",
            title: "Unmet structural conditions",
            label: "Withheld",
            items: failedChecks,
          }),
          createModule({
            id: "exec-withheld-trace",
            kind: "interpretation",
            title: "Traceability retained",
            label: "Withheld",
            narrative: [
              gate.proofTraceSummary,
              `Export remains blocked until the unmet conditions are resolved.`,
            ],
          }),
        ]),
      ],
      metadata: {
        scenarioName: state.scenarioName,
        asOf: state.asOf,
        phase: state.phase,
        generatedAt: formatGeneratedAt(),
        confidentialityLabel: "Confidential | Internal strategic orientation",
        currentViewName,
      },
    });
  }

  const pages = [
    coverPage,
    boundaryPage,
    memoryPage,
    phasePage,
    haloPage,
    tracePage,
  ];

  return normalizeDocumentPlan({
    mode: "executive-brief",
    title: `${state.scenarioName} Executive Brief`,
    subtitle: `${state.boundedWorld} | ${state.asOf} | ${state.phase}`,
    pages,
    metadata: {
      scenarioName: state.scenarioName,
      asOf: state.asOf,
      phase: state.phase,
      generatedAt: formatGeneratedAt(),
      confidentialityLabel: "Confidential | Internal strategic orientation",
      currentViewName,
    },
  });
};

const renderExecutivePage = (plan: ExportDocumentPlan, page: ExportDocumentPlan["pages"][number]) => {
  const modules = page.modules;

  if (page.id === "executive-cover") {
    return `
      <article class="export-page">
        <section class="page-shell">
          <header class="page-header">
            <div>
              <div class="page-kicker">Executive Brief</div>
              <h1 class="page-title">${escapeText(plan.metadata.scenarioName)}</h1>
              <p class="page-subtitle">${escapeText(plan.subtitle)}</p>
            </div>
            <div class="page-meta">${escapeText(plan.metadata.confidentialityLabel)}</div>
          </header>
          <div class="page-body">
            <div class="page-grid-2">
              <section class="export-module export-module--expanded">
                <div class="module-label">Boundary</div>
                <h3>${escapeText(modules[0]?.title ?? "Scenario")}</h3>
                ${(modules[0]?.narrative ?? []).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}
              </section>
              <div class="page-grid-2">
                ${(modules[1]?.items ?? [])
                  .slice(0, 4)
                  .map(
                    (item, index) => `
                    <section class="export-module export-module--compact">
                      <div class="module-label">Summary ${index + 1}</div>
                      <h3>Headline</h3>
                      <p>${escapeText(item)}</p>
                    </section>`,
                  )
                  .join("")}
              </div>
            </div>
            <section class="export-module export-module--standard">
              <div class="module-label">System State Snapshot</div>
              <div class="kpi-strip">
                ${(modules[2]?.items ?? [])
                  .map(
                    (item) => {
                      const [label, value] = item.split(": ");
                      return `<div class="kpi-chip"><span class="label">${escapeText(label ?? item)}</span><span class="value">${escapeText(value ?? item)}</span></div>`;
                    },
                  )
                  .join("")}
              </div>
            </section>
            <section class="export-module export-module--standard">
              <div class="module-label">Executive Interpretation</div>
              <h3>${escapeText(modules[3]?.title ?? "Interpretation")}</h3>
              ${(modules[3]?.narrative ?? []).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}
            </section>
          </div>
          ${renderFooter(plan, page)}
        </section>
      </article>
    `;
  }

  if (page.id === "executive-evolution") {
    return `
      <article class="export-page">
        <section class="page-shell">
          <header class="page-header">
            <div>
              <div class="page-kicker">Narrative Development Timeline</div>
              <h2 class="page-title">${escapeText(page.title)}</h2>
              <p class="page-subtitle">Early signals, systemic uptake, and current condition are sequenced here as a bounded development path.</p>
            </div>
            <div class="page-meta">${escapeText(plan.metadata.phase)}</div>
          </header>
          <div class="page-body">
            <section class="export-module export-module--expanded">
              <div class="module-label">Narrative Development Timeline</div>
              <div class="timeline-stack">
                ${page.modules
                  .map((module, index) => `
                    <div class="timeline-row">
                      <div class="timeline-month">T${index + 1}</div>
                      <div class="timeline-content">
                        <h4>${escapeText(module.title)}</h4>
                        ${(module.items ?? []).map((item) => `<p>${escapeText(item)}</p>`).join("")}
                        ${(module.narrative ?? []).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}
                      </div>
                    </div>`)
                  .join("")}
              </div>
            </section>
          </div>
          ${renderFooter(plan, page)}
        </section>
      </article>
    `;
  }

  return `
    <article class="export-page">
      <section class="page-shell">
        <header class="page-header">
          <div>
            <div class="page-kicker">${escapeText(page.title)}</div>
            <h2 class="page-title">${escapeText(page.title)}</h2>
            <p class="page-subtitle">${escapeText(plan.subtitle)}</p>
          </div>
          <div class="page-meta">Page ${page.pageNumber}</div>
        </header>
        <div class="page-body ${page.modules.length >= 3 ? "page-grid-2" : ""}">
          ${page.modules.map((module) => renderModule(module)).join("")}
        </div>
        ${renderFooter(plan, page)}
      </section>
    </article>
  `;
};

const renderModule = (module: ExportDocumentPlan["pages"][number]["modules"][number]) => `
  <section class="export-module export-module--${module.size}">
    ${module.label ? `<div class="module-label">${escapeText(module.label)}</div>` : ""}
    <h3>${escapeText(module.title)}</h3>
    ${(module.narrative ?? []).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}
    ${(module.items ?? []).length ? `<ul>${module.items!.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>` : ""}
  </section>
`;

export const renderExecutiveBriefDocument = (state: BriefingState, currentViewName: string) => {
  const plan = buildExecutiveBriefPlan(state, currentViewName);
  const qa = qaDocumentPlan(plan);
  const html = buildDocumentHtml(plan, plan.pages.map((page) => renderExecutivePage(plan, page)).join(""));
  return { plan, qa, html };
};
