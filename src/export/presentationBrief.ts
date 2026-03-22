import type { BriefingState, ExportDocumentPlan } from "../types";
import { composePresentationBrief } from "../utils/briefingArtifacts";
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

export const buildPresentationBriefPlan = (state: BriefingState, currentViewName: string): ExportDocumentPlan => {
  const slides = composePresentationBrief(state).slides;
  const pages = [
    createPage("slide-title", "Title Slide", 1, 12, [
      createModule({
        id: "slide-title",
        kind: "title-slide",
        title: state.scenarioName,
        label: "Presentation brief",
        narrative: [state.boundedWorld, state.boundaryDefinition, `${state.asOf} | ${state.phase}`],
      }),
    ]),
    ...slides.map((slide, index) =>
      createPage(`slide-${index + 2}`, slide.title, index + 2, 12, [
        createModule({
          id: `slide-module-${index}`,
          kind:
            index === 0
              ? "system-overview"
              : index === slides.length - 1
                ? "synthesis"
                : index === slides.length - 2
                  ? "risk-monitoring"
                  : "strategic",
          title: slide.title,
          label: `Slide ${index + 2}`,
          items: slide.bullets,
          narrative: [slide.speakerNotes],
        }),
      ]),
    ),
  ];

  return normalizeDocumentPlan({
    mode: "presentation-brief",
    title: `${state.scenarioName} Presentation Brief`,
    subtitle: `${state.boundedWorld} | ${state.asOf} | ${state.phase}`,
    pages,
    metadata: {
      scenarioName: state.scenarioName,
      asOf: state.asOf,
      phase: state.phase,
      generatedAt: formatGeneratedAt(),
      confidentialityLabel: "Confidential | Presentation narrative",
      currentViewName,
    },
  });
};

export const renderPresentationBriefDocument = (state: BriefingState, currentViewName: string) => {
  const plan = buildPresentationBriefPlan(state, currentViewName);
  const qa = qaDocumentPlan(plan);
  const html = buildDocumentHtml(
    plan,
    plan.pages
      .map(
        (page) => `
          <article class="export-page slide-page">
            <section class="page-shell">
              <header class="page-header">
                <div>
                  <div class="page-kicker">${escapeText(page.pageNumber === 1 ? "Presentation Brief" : "Slide")}</div>
                  <h2 class="page-title">${escapeText(page.title)}</h2>
                  <p class="page-subtitle">${escapeText(plan.subtitle)}</p>
                </div>
                <div class="page-meta">Slide ${page.pageNumber}</div>
              </header>
              <div class="page-body">
                ${page.modules
                  .map(
                    (module) => `
                    <section class="export-module export-module--expanded">
                      ${module.label ? `<div class="module-label">${escapeText(module.label)}</div>` : ""}
                      <h3>${escapeText(module.title)}</h3>
                      ${(module.items ?? []).length ? `<ul>${module.items!.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>` : ""}
                      ${(module.narrative ?? []).length ? `<div class="slide-callout">${module.narrative!.map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}</div>` : ""}
                    </section>`,
                  )
                  .join("")}
              </div>
              ${renderFooter(plan, page)}
            </section>
          </article>`,
      )
      .join(""),
  );

  return { plan, qa, html };
};
