import type { BriefingState, ExportDocumentPlan } from "../types";
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

const chunk = (items: string[], size: number) => {
  const output: string[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
};

export const buildExecutiveBriefPlan = (state: BriefingState, currentViewName: string): ExportDocumentPlan => {
  const timelineRows = [
    ...chunk(state.earlySignals, 2).map((items, index) =>
      createModule({
        id: `exec-dev-early-${index}`,
        kind: "timeline",
        title: index === 0 ? "Early signals" : "Early signals continued",
        label: "Narrative evolution",
        items,
      }),
    ),
    ...chunk(state.systemicUptake, 2).map((items, index) =>
      createModule({
        id: `exec-dev-systemic-${index}`,
        kind: "timeline",
        title: index === 0 ? "Systemic uptake" : "Systemic uptake continued",
        label: "Narrative evolution",
        items,
      }),
    ),
    createModule({
      id: "exec-dev-current",
      kind: "development",
      title: "Current condition",
      label: "Narrative evolution",
      items: state.latestDevelopments,
      narrative: [state.currentCondition, state.structuralShift],
    }),
  ];

  const pages = [
    createPage("executive-cover", "Cover", 1, 20, [
      createModule({
        id: "exec-cover",
        kind: "cover",
        title: state.scenarioName,
        label: "Executive brief",
        narrative: [state.boundedWorld, state.boundaryDefinition, state.currentCondition],
      }),
      createModule({
        id: "exec-summary-cards",
        kind: "summary-cards",
        title: "Top summary cards",
        label: "Simulation state",
        items: [state.currentCondition, state.structuralShift, state.primaryPath, state.pressurePoints[0] ?? ""].filter(Boolean),
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
        title: "Executive interpretation",
        label: "Top line",
        narrative: [
          `${state.currentCondition} ${state.structuralShift}`,
          `Pressure is currently concentrated through ${state.pressurePoints.join(" ")}.`,
        ],
      }),
    ]),
    createPage("executive-takeaways", "Key Takeaways", 2, 18, [
      createModule({
        id: "exec-takeaways",
        kind: "takeaways",
        title: "Key takeaways",
        label: "Page 2",
        items: [...state.priorities.slice(0, 2), ...state.sensitivities.slice(0, 2)],
      }),
      createModule({
        id: "exec-forward",
        kind: "forward-paths",
        title: "Primary path vs alternate paths",
        label: "Forward orientation",
        narrative: [state.primaryPath, ...state.alternatePaths],
      }),
      createModule({
        id: "exec-implications",
        kind: "implications",
        title: "Operational implications",
        label: "Implications",
        items: [...state.visibilityNeeds.slice(0, 2), state.pressurePoints[0] ?? ""].filter(Boolean),
      }),
    ]),
    createPage("executive-evolution", "Narrative Evolution", 3, 18, timelineRows),
    createPage("executive-strategic", "Strategic Interpretation", 4, 18, [
      createModule({
        id: "exec-structural",
        kind: "strategic",
        title: "Structural interpretation",
        label: "Strategic reading",
        narrative: [
          `The structural reading is shaped by ${state.crossDomainEffects.join(" ")}`,
          `The present state remains sensitive to ${state.sensitivities.join(" ")}`,
        ],
      }),
      createModule({
        id: "exec-positioning",
        kind: "strategic",
        title: "Strategic positioning",
        label: "Priorities",
        items: [...state.priorities, ...state.visibilityNeeds].slice(0, 6),
      }),
    ]),
    createPage("executive-evidence", "Evidence & Signals", 5, 18, [
      createModule({
        id: "exec-evidence",
        kind: "evidence",
        title: "Evidence anchors",
        label: "Signal basis",
        items: state.signalAnchors,
      }),
      createModule({
        id: "exec-readout-change",
        kind: "evidence",
        title: "What would change the readout",
        label: "Readout conditions",
        items: [...state.stabilitySignals.slice(0, 2), ...state.alternatePaths.slice(0, 1)],
      }),
    ]),
    createPage("executive-effects", "System Effects + Conclusion", 6, 18, [
      createModule({
        id: "exec-cross-domain",
        kind: "cross-domain",
        title: "Cross-domain effects",
        label: "System effects",
        items: state.crossDomainEffects,
      }),
      createModule({
        id: "exec-containment",
        kind: "containment",
        title: "Containment and non-spreading dynamics",
        label: "Containment",
        items: state.stabilitySignals,
      }),
      createModule({
        id: "exec-close",
        kind: "closing",
        title: "Concluding executive note",
        label: "Conclusion",
        narrative: [
          `${state.currentCondition} ${state.primaryPath}`,
          `The readout remains anchored by ${state.signalAnchors.slice(0, 2).join(" and ")}.`,
        ],
      }),
    ]),
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
