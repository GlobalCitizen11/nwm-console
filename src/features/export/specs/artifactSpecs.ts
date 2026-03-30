import type {
  BoardOnePagerSpec as BoardOnePagerSpecShape,
  LegacyExecutiveBriefSpec as ExecutiveBriefSpecShape,
  FieldRule,
  FallbackBehavior,
  PresentationBriefSpec as PresentationBriefSpecShape,
  PresentationSlideType,
  RenderStyle,
  ToneType,
} from "../types/export";

export function makeFieldRule<T>(
  value: T,
  config: Omit<FieldRule<T>, "value">,
): FieldRule<T> {
  return { value, ...config };
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateWordBudget(
  text: string,
  maxWords?: number,
  minWords?: number,
): boolean {
  const count = wordCount(text);
  if (typeof minWords === "number" && count < minWords) return false;
  if (typeof maxWords === "number" && count > maxWords) return false;
  return true;
}

export function validateArrayBudget<T>(
  items: T[],
  minItems?: number,
  maxItems?: number,
): boolean {
  if (typeof minItems === "number" && items.length < minItems) return false;
  if (typeof maxItems === "number" && items.length > maxItems) return false;
  return true;
}

const base = (tone: ToneType, renderStyle: RenderStyle, placement: string, fallback: FallbackBehavior) => ({
  required: true,
  tone,
  renderStyle,
  placement,
  fallback,
});

export const BoardOnePagerSpec: BoardOnePagerSpecShape = {
  header: {
    scenarioTitle: makeFieldRule("", { ...base("framing", "headline", "top-band", "replace-with-default"), maxWords: 8 }),
    replayMonthLabel: makeFieldRule("", { ...base("framing", "chip", "top-band", "replace-with-default"), maxWords: 4 }),
    confidentialityLabel: makeFieldRule("", { ...base("framing", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
  },
  stateBand: {
    phase: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    density: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    momentum: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    reversibility: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    stateInterpretation: makeFieldRule("", { ...base("declarative", "headline", "top-band", "compress"), maxWords: 10, minWords: 4 }),
  },
  boardRead: {
    headline: makeFieldRule("", { ...base("declarative", "headline", "primary-anchor", "compress"), maxWords: 8, minWords: 3 }),
    summary: makeFieldRule("", { ...base("directive", "headline", "primary-anchor", "compress"), maxWords: 10, minWords: 4 }),
  },
  decisionBox: {
    title: makeFieldRule("Reallocate capital before coordination failure hardens", { ...base("directive", "headline", "primary-anchor", "replace-with-default"), maxWords: 12, minWords: 5 }),
    actions: makeFieldRule<string[]>([], { ...base("directive", "bullet", "primary-anchor", "compress"), minItems: 2, maxItems: 3, maxWords: 12 }),
  },
  dominantPath: {
    statement: makeFieldRule("", { ...base("predictive", "row", "lower-band", "compress"), maxWords: 15, minWords: 4 }),
  },
  primaryPressure: {
    statement: makeFieldRule("", { ...base("interpretive", "row", "lower-band", "compress"), maxWords: 15, minWords: 5 }),
  },
  riskConcentration: {
    items: makeFieldRule<string[]>([], { ...base("directive", "list", "lower-band", "compress"), minItems: 3, maxItems: 3, maxWords: 8 }),
  },
  inflectionPaths: {
    continuation: makeFieldRule("", { ...base("predictive", "row", "lower-band", "compress"), maxWords: 8, minWords: 3 }),
    reversal: makeFieldRule("", { ...base("predictive", "row", "lower-band", "compress"), maxWords: 8, minWords: 3 }),
    acceleration: makeFieldRule("", { ...base("predictive", "row", "lower-band", "compress"), maxWords: 8, minWords: 3 }),
  },
  triggers: {
    items: makeFieldRule<string[]>([], { ...base("directive", "list", "lower-band", "compress"), minItems: 2, maxItems: 3, maxWords: 8 }),
  },
  evidenceSignals: {
    items: makeFieldRule([], { ...base("signal", "strip", "bottom-band", "compress"), minItems: 3, maxItems: 3 }),
  },
  signalGrid: {
    items: makeFieldRule([], { ...base("signal", "strip", "mid-band", "omit"), minItems: 4, maxItems: 4 }),
  },
};

export const ExecutiveBriefSpec: ExecutiveBriefSpecShape = {
  cover: {
    scenarioTitle: makeFieldRule("", { ...base("framing", "headline", "top-band", "replace-with-default"), maxWords: 10 }),
    replayMonthLabel: makeFieldRule("", { ...base("framing", "chip", "top-band", "replace-with-default"), maxWords: 4 }),
    phase: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    density: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    momentum: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    reversibility: makeFieldRule("", { ...base("signal", "chip", "top-band", "replace-with-default"), maxWords: 3 }),
    executiveHeadline: makeFieldRule("", { ...base("interpretive", "headline", "top-band", "compress"), maxWords: 14, minWords: 5 }),
  },
  systemState: {
    title: makeFieldRule("System state overview", { ...base("framing", "headline", "primary-left", "replace-with-default"), maxWords: 4 }),
    summary: makeFieldRule("", { ...base("analytical", "paragraph", "primary-left", "compress"), minWords: 80, maxWords: 120 }),
    sidebarInsight: makeFieldRule("", { ...base("interpretive", "row", "right-rail", "compress"), maxWords: 18, minWords: 5 }),
  },
  narrativeProgression: {
    title: makeFieldRule("Narrative development", { ...base("framing", "headline", "primary-left", "replace-with-default"), maxWords: 3 }),
    summary: makeFieldRule("", { ...base("analytical", "paragraph", "primary-left", "compress"), minWords: 80, maxWords: 120 }),
    sidebarInsight: makeFieldRule("", { ...base("interpretive", "row", "right-rail", "compress"), maxWords: 18, minWords: 5 }),
  },
  structuralRead: {
    title: makeFieldRule("Structural interpretation", { ...base("framing", "headline", "primary-left", "replace-with-default"), maxWords: 3 }),
    summary: makeFieldRule("", { ...base("interpretive", "paragraph", "primary-left", "compress"), minWords: 80, maxWords: 120 }),
    sidebarInsight: makeFieldRule("", { ...base("interpretive", "row", "right-rail", "compress"), maxWords: 18, minWords: 5 }),
  },
  forwardView: {
    title: makeFieldRule("Forward orientation", { ...base("framing", "headline", "primary-left", "replace-with-default"), maxWords: 3 }),
    summary: makeFieldRule("", { ...base("predictive", "paragraph", "primary-left", "compress"), minWords: 80, maxWords: 120 }),
    sidebarInsight: makeFieldRule("", { ...base("predictive", "row", "right-rail", "compress"), maxWords: 18, minWords: 5 }),
  },
  decisionPosture: {
    title: makeFieldRule("Strategic positioning", { ...base("framing", "headline", "primary-left", "replace-with-default"), maxWords: 3 }),
    summary: makeFieldRule("", { ...base("directive", "paragraph", "primary-left", "compress"), minWords: 80, maxWords: 120 }),
    sidebarInsight: makeFieldRule("", { ...base("directive", "row", "right-rail", "compress"), maxWords: 18, minWords: 5 }),
    actions: makeFieldRule<string[]>([], { ...base("directive", "list", "right-rail", "omit"), minItems: 0, maxItems: 3, maxWords: 8 }),
  },
  evidenceBase: {
    title: makeFieldRule("Evidence anchors", { ...base("framing", "headline", "bottom-band", "replace-with-default"), maxWords: 3 }),
    intro: makeFieldRule("", { ...base("explanatory", "paragraph", "bottom-band", "compress"), minWords: 40, maxWords: 120 }),
    items: makeFieldRule([], { ...base("signal", "row", "bottom-band", "compress"), minItems: 1, maxItems: 3 }),
  },
};

const slideRule = (type: PresentationSlideType, title: string): import("../types/export").PresentationSlideSpec => ({
  slideType: makeFieldRule(type, { ...base("framing", "chip", "slide-header", "replace-with-default") }),
  title: makeFieldRule(title, { ...base("framing", "headline", "slide-header", "replace-with-default"), maxWords: 4 }),
  bullets: makeFieldRule<string[]>([], { ...base("directive", "bullet", "slide-body", "compress"), minItems: 2, maxItems: 4, maxWords: 15 }),
});

export const PresentationBriefSpec: PresentationBriefSpecShape = {
  slides: [
    slideRule("title", "Situation"),
    slideRule("system-state", "System state"),
    slideRule("key-risk", "Key judgments"),
    slideRule("pressure", "How we got here"),
    slideRule("path", "Inflection points"),
    slideRule("decision", "Decision impact"),
    slideRule("triggers", "Pathways"),
    slideRule("evidence", "What to watch"),
  ],
};
