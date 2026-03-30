import type { ExportMode } from "../types/export";
import type { Page } from "playwright-core";

const WRAPPER_OVERFLOW_TOLERANCE_PX = 8;
const EXECUTIVE_WRAPPER_OVERFLOW_TOLERANCE_PX = 64;

export interface RenderedLayoutDiagnostics {
  mode: ExportMode;
  pageWidthPx: number;
  pageHeightPx: number;
  printableHeightPx: number;
  wrapperCount: number;
  wrappers: Array<{
    index: number;
    className: string;
    computedWidth: string;
    computedHeight: string;
    clientHeight: number;
    scrollHeight: number;
    overflowPx: number;
  }>;
  board?: {
    shellHeight: number;
    shellScrollHeight: number;
    overflowPx: number;
    evidenceStripHeight: number;
  };
  presentation?: {
    slideCount: number;
    pageWrapperCount: number;
  };
}

export interface RenderedLayoutValidationResult {
  ok: boolean;
  issues: string[];
  diagnostics: RenderedLayoutDiagnostics;
}

export const countPdfPages = (pdf: Uint8Array) => {
  const text = new TextDecoder("latin1").decode(pdf);
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches?.length ?? 0;
};

export const measureRenderedLayout = async (
  page: Page,
  mode: ExportMode,
  orientation: "portrait" | "landscape",
): Promise<RenderedLayoutDiagnostics> =>
  page.evaluate(
    ({ activeMode, activeOrientation }) => {
      const wrappers = Array.from(document.querySelectorAll<HTMLElement>(".export-page-frame"));
      const pageWidthPx = activeOrientation === "landscape" ? 1056 : 816;
      const pageHeightPx = activeOrientation === "landscape" ? 816 : 1056;
      const printableHeightPx = pageHeightPx;
      const wrapperDiagnostics = wrappers.map((wrapper, index) => ({
        index,
        className: wrapper.className,
        computedWidth: getComputedStyle(wrapper).width,
        computedHeight: getComputedStyle(wrapper).height,
        clientHeight: wrapper.clientHeight,
        scrollHeight: wrapper.scrollHeight,
        overflowPx: Math.max(0, wrapper.scrollHeight - wrapper.clientHeight),
      }));

      const shell = document.querySelector<HTMLElement>(".board-onepager-shell");
      const evidenceStrip = document.querySelector<HTMLElement>(".board-evidence-strip");
      const slides = Array.from(document.querySelectorAll<HTMLElement>(".presentation-slide"));

      return {
        mode: activeMode,
        pageWidthPx,
        pageHeightPx,
        printableHeightPx,
        wrapperCount: wrappers.length,
        wrappers: wrapperDiagnostics,
        board: shell
          ? {
              shellHeight: shell.clientHeight,
              shellScrollHeight: shell.scrollHeight,
              overflowPx: Math.max(0, shell.scrollHeight - shell.clientHeight),
              evidenceStripHeight: evidenceStrip?.scrollHeight ?? 0,
            }
          : undefined,
        presentation: slides.length
          ? {
              slideCount: slides.length,
              pageWrapperCount: wrappers.length,
            }
          : undefined,
      };
    },
    { activeMode: mode, activeOrientation: orientation },
  );

export const validateRenderedBoardLayout = (diagnostics: RenderedLayoutDiagnostics): RenderedLayoutValidationResult => {
  const issues: string[] = [];
  if (diagnostics.wrapperCount !== 1) {
    issues.push(`Board export rendered ${diagnostics.wrapperCount} page wrappers instead of 1.`);
  }
  if (diagnostics.wrappers.some((wrapper) => wrapper.overflowPx > WRAPPER_OVERFLOW_TOLERANCE_PX)) {
    issues.push("Board export page wrapper exceeded its physical page height.");
  }
  if ((diagnostics.board?.overflowPx ?? 0) > 0) {
    issues.push(`Board shell overflowed by ${diagnostics.board?.overflowPx ?? 0}px.`);
  }

  return { ok: issues.length === 0, issues, diagnostics };
};

export const validateRenderedPresentationLayout = (diagnostics: RenderedLayoutDiagnostics): RenderedLayoutValidationResult => {
  const issues: string[] = [];
  if ((diagnostics.presentation?.slideCount ?? 0) !== diagnostics.wrapperCount) {
    issues.push("Presentation slide count does not match physical page wrapper count.");
  }
  if (diagnostics.wrapperCount < 7 || diagnostics.wrapperCount > 9) {
    issues.push(`Presentation rendered ${diagnostics.wrapperCount} physical slide pages instead of 7–9.`);
  }
  if (diagnostics.wrappers.some((wrapper) => wrapper.overflowPx > WRAPPER_OVERFLOW_TOLERANCE_PX)) {
    issues.push("At least one presentation slide overflowed its physical page wrapper.");
  }

  return { ok: issues.length === 0, issues, diagnostics };
};

export const validateRenderedExecutiveLayout = (diagnostics: RenderedLayoutDiagnostics): RenderedLayoutValidationResult => {
  const issues: string[] = [];
  if (diagnostics.wrapperCount > 6) {
    issues.push(`Executive brief rendered ${diagnostics.wrapperCount} pages instead of 6 or fewer.`);
  }
  if (diagnostics.wrappers.some((wrapper) => wrapper.overflowPx > EXECUTIVE_WRAPPER_OVERFLOW_TOLERANCE_PX)) {
    issues.push("At least one executive brief page wrapper exceeded its physical page height.");
  }

  return { ok: issues.length === 0, issues, diagnostics };
};
