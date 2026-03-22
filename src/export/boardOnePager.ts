import type { BriefingState, ExportDocumentPlan } from "../types";
import { composeBoardOnePager } from "../utils/briefingArtifacts";
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

export const buildBoardOnePagerPlan = (state: BriefingState, currentViewName: string): ExportDocumentPlan => {
  const board = composeBoardOnePager(state);
  const page = createPage("board-onepager", "Board One Pager", 1, 20, [
    createModule({
      id: "board-top",
      kind: "board-topline",
      title: "Key insights",
      label: "Upper",
      items: [...board.whatHasShifted.slice(0, 2), ...state.priorities.slice(0, 2)],
    }),
    createModule({
      id: "board-kpi",
      kind: "board-kpis",
      title: "System state snapshot",
      label: "Middle",
      items: [
        `Phase: ${state.phase}`,
        `Density: ${state.narrativeDensity}`,
        `Momentum: ${state.structuralMomentum}`,
        `Reversibility: ${state.reversibility}`,
      ],
    }),
    createModule({
      id: "board-risks",
      kind: "board-risks",
      title: "Strategic implications",
      label: "Lower",
      items: [...board.oversightPriorities.slice(0, 2), ...state.visibilityNeeds.slice(0, 2)],
      narrative: [board.whyThisMattersNow],
    }),
    createModule({
      id: "board-evidence",
      kind: "board-evidence",
      title: "Evidence anchors",
      label: "Bottom",
      items: board.signalBasis.slice(0, 4),
      narrative: [board.stabilitySignals[0] ?? ""].filter(Boolean),
    }),
  ]);

  return normalizeDocumentPlan({
    mode: "board-onepager",
    title: `${state.scenarioName} Board One Pager`,
    subtitle: `${state.boundedWorld} | ${state.asOf} | ${state.phase}`,
    pages: [page],
    metadata: {
      scenarioName: state.scenarioName,
      asOf: state.asOf,
      phase: state.phase,
      generatedAt: formatGeneratedAt(),
      confidentialityLabel: "Board-level strategic snapshot",
      currentViewName,
    },
  });
};

export const renderBoardOnePagerDocument = (state: BriefingState, currentViewName: string) => {
  const plan = buildBoardOnePagerPlan(state, currentViewName);
  const qa = qaDocumentPlan(plan);
  const page = plan.pages[0]!;
  const html = buildDocumentHtml(
    plan,
    `
      <article class="export-page board-page">
        <section class="page-shell">
          <header class="page-header">
            <div>
              <div class="page-kicker">Board One Pager</div>
              <h1 class="page-title">${escapeText(plan.metadata.scenarioName)}</h1>
              <p class="page-subtitle">${escapeText(plan.subtitle)}</p>
            </div>
            <div class="page-meta">${escapeText(plan.metadata.confidentialityLabel)}</div>
          </header>
          <div class="page-body board-zones">
            <div class="page-grid-3">
              ${(page.modules[0]?.items ?? [])
                .slice(0, 4)
                .map(
                  (item, index) => `
                    <section class="export-module export-module--compact">
                      <div class="module-label">Insight ${index + 1}</div>
                      <h3>Board signal</h3>
                      <p>${escapeText(item)}</p>
                    </section>`,
                )
                .join("")}
            </div>
            <section class="export-module export-module--standard">
              <div class="module-label">System state snapshot</div>
              <div class="kpi-strip">
                ${(page.modules[1]?.items ?? [])
                  .map((item) => {
                    const [label, value] = item.split(": ");
                    return `<div class="kpi-chip"><span class="label">${escapeText(label ?? item)}</span><span class="value">${escapeText(value ?? item)}</span></div>`;
                  })
                  .join("")}
              </div>
            </section>
            <div class="page-grid-2">
              <section class="export-module export-module--standard">
                <div class="module-label">Strategic implications</div>
                <h3>${escapeText(page.modules[2]?.title ?? "Implications")}</h3>
                ${(page.modules[2]?.narrative ?? []).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}
                ${(page.modules[2]?.items ?? []).length ? `<ul>${page.modules[2]!.items!.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>` : ""}
              </section>
              <section class="export-module export-module--standard">
                <div class="module-label">Evidence anchors</div>
                <h3>${escapeText(page.modules[3]?.title ?? "Evidence")}</h3>
                ${(page.modules[3]?.items ?? []).length ? `<ul>${page.modules[3]!.items!.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>` : ""}
                ${(page.modules[3]?.narrative ?? []).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}
              </section>
            </div>
          </div>
          ${renderFooter(plan, page)}
        </section>
      </article>
    `,
  );

  return { plan, qa, html };
};
