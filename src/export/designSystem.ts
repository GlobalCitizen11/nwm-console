import type { ExportDocumentPlan, ExportModule } from "../types";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderModuleBody = (module: ExportModule) => {
  const narrative = (module.narrative ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const items = (module.items ?? []).length
    ? `<ul>${module.items!.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  return `
    <section class="export-module export-module--${module.kind} export-module--${module.size}">
      ${module.label ? `<div class="module-label">${escapeHtml(module.label)}</div>` : ""}
      <h3>${escapeHtml(module.title)}</h3>
      ${narrative}
      ${items}
    </section>
  `;
};

export const buildExportStyles = (mode: ExportDocumentPlan["mode"]) => `
  :root {
    color-scheme: dark;
    --page-ink: #e6eef5;
    --page-muted: #9db0bf;
    --page-border: rgba(125, 145, 162, 0.18);
    --page-accent: #d7b56c;
    --page-accent-alt: #7ca6c8;
    --page-surface: rgba(10, 16, 23, 0.96);
    --page-panel: linear-gradient(180deg, rgba(18, 28, 39, 0.86) 0%, rgba(10, 16, 22, 0.76) 100%);
  }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    background:
      radial-gradient(circle at top left, rgba(68, 92, 115, 0.18), transparent 28%),
      linear-gradient(180deg, #0a1118 0%, #0d151d 100%);
    color: var(--page-ink);
    font-family: "Avenir Next", "Inter", "Segoe UI", Arial, sans-serif;
    text-rendering: optimizeLegibility;
  }
  .document-shell {
    width: 100%;
    min-height: 100vh;
    padding: 0;
  }
  .export-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    padding: 24mm 18mm 16mm;
    background:
      radial-gradient(circle at top right, rgba(124, 166, 200, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(20, 29, 39, 0.98) 0%, rgba(11, 17, 23, 0.98) 100%);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    page-break-after: always;
  }
  .export-page:last-child { page-break-after: auto; }
  .page-shell {
    border: 1px solid var(--page-border);
    background: rgba(8, 13, 19, 0.44);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    padding: 16mm 14mm 12mm;
    min-height: calc(100vh - 40mm);
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 12mm;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-start;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding-bottom: 7mm;
  }
  .page-kicker, .module-label, .page-meta {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 9px;
    font-weight: 600;
    color: var(--page-muted);
  }
  .page-title {
    margin: 10px 0 6px;
    font-size: ${mode === "presentation-brief" ? "34px" : "28px"};
    line-height: 1.03;
    font-weight: 650;
    letter-spacing: -0.03em;
    color: #f3f8fc;
  }
  .page-subtitle {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.58;
    color: var(--page-muted);
    max-width: 72ch;
  }
  .page-body {
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .page-grid-2 { display: grid; grid-template-columns: 1.25fr 1fr; gap: 12px; }
  .page-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .export-module {
    border: 1px solid var(--page-border);
    background: var(--page-panel);
    padding: 14px 14px 13px;
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.025);
  }
  .export-module--compact { padding: 12px; }
  .export-module--expanded { padding: 16px; }
  .export-module h3 {
    margin: 8px 0 10px;
    font-size: 17px;
    line-height: 1.15;
    font-weight: 620;
    letter-spacing: -0.02em;
    color: #f2f7fb;
  }
  .export-module p {
    margin: 0 0 10px;
    font-size: 12.5px;
    line-height: 1.62;
    color: #d5e0e8;
  }
  .export-module p:last-child { margin-bottom: 0; }
  .export-module ul {
    margin: 8px 0 0;
    padding-left: 18px;
  }
  .export-module li {
    margin-bottom: 8px;
    font-size: 12.5px;
    line-height: 1.58;
    color: #d9e4ec;
  }
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }
  .kpi-chip {
    border: 1px solid rgba(124, 145, 164, 0.18);
    background: linear-gradient(180deg, rgba(17, 26, 35, 0.96) 0%, rgba(11, 17, 24, 0.95) 100%);
    padding: 12px;
  }
  .kpi-chip span {
    display: block;
  }
  .kpi-chip .label {
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--page-muted);
  }
  .kpi-chip .value {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.35;
    color: #f4f8fb;
  }
  .insight-band {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .insight-band .export-module h3 {
    font-size: 15px;
  }
  .timeline-stack {
    display: grid;
    gap: 10px;
  }
  .timeline-row {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .timeline-row:first-child { border-top: 0; padding-top: 0; }
  .timeline-month {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--page-accent);
  }
  .timeline-content h4 {
    margin: 0 0 6px;
    font-size: 14px;
    color: #f2f7fb;
  }
  .timeline-content p {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: #d7e2ea;
  }
  .page-footer {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-end;
    padding-top: 6mm;
    border-top: 1px solid rgba(255,255,255,0.06);
    color: var(--page-muted);
    font-size: 10px;
    letter-spacing: 0.06em;
  }
  .footer-left, .footer-right {
    display: grid;
    gap: 4px;
  }
  .footer-right {
    text-align: right;
  }
  .slide-page .page-body {
    gap: 18px;
  }
  .slide-callout {
    border-left: 2px solid rgba(215, 181, 108, 0.48);
    padding-left: 14px;
    max-width: 62ch;
  }
  .board-page .page-shell {
    gap: 8mm;
  }
  .board-zones {
    display: grid;
    gap: 10px;
  }
  @media screen and (max-width: 960px) {
    .export-page {
      padding: 16px;
      min-height: auto;
    }
    .page-shell {
      min-height: auto;
      padding: 16px;
    }
    .page-grid-2,
    .page-grid-3,
    .insight-band,
    .kpi-strip {
      grid-template-columns: 1fr;
    }
  }
  @media print {
    @page {
      size: letter;
      margin: 0;
    }
    body {
      background: #0b131b;
    }
    .document-shell {
      padding: 0;
    }
    .export-page {
      min-height: 279.4mm;
      padding: 0;
      border: 0;
    }
    .page-shell {
      min-height: 279.4mm;
      border: 0;
      padding: 18mm 16mm 12mm;
    }
  }
`;

export const buildDocumentHtml = (plan: ExportDocumentPlan, pagesHtml: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(plan.title)}</title>
    <style>${buildExportStyles(plan.mode)}</style>
  </head>
  <body>
    <main class="document-shell">
      ${pagesHtml}
    </main>
  </body>
</html>`;

export const renderFooter = (plan: ExportDocumentPlan, page: ExportDocumentPlan["pages"][number]) => `
  <footer class="page-footer">
    <div class="footer-left">
      <span>${escapeHtml(plan.metadata.confidentialityLabel)}</span>
      <span>${escapeHtml(plan.metadata.scenarioName)} | ${escapeHtml(plan.metadata.asOf)} | ${escapeHtml(plan.metadata.phase)}</span>
    </div>
    <div class="footer-right">
      <span>Generated ${escapeHtml(plan.metadata.generatedAt)}</span>
      <span>Page ${page.pageNumber} / ${plan.pages.length} | ${escapeHtml(plan.metadata.currentViewName)}</span>
    </div>
  </footer>
`;

export const escapeText = escapeHtml;
