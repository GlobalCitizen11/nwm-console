import type { CopyVariant, ExportMode, ModuleFitMode } from "../types/export";

type FitProfile = {
  headlineChars: number;
  bodyChars: number;
};

const PROFILES: Record<ExportMode, Record<ModuleFitMode, Record<CopyVariant, FitProfile>>> = {
  "executive-brief": {
    hero: {
      full: { headlineChars: 72, bodyChars: 220 },
      medium: { headlineChars: 58, bodyChars: 170 },
      compact: { headlineChars: 48, bodyChars: 130 },
    },
    support: {
      full: { headlineChars: 64, bodyChars: 170 },
      medium: { headlineChars: 54, bodyChars: 130 },
      compact: { headlineChars: 46, bodyChars: 104 },
    },
    kpi: {
      full: { headlineChars: 24, bodyChars: 24 },
      medium: { headlineChars: 24, bodyChars: 24 },
      compact: { headlineChars: 24, bodyChars: 24 },
    },
    evidence: {
      full: { headlineChars: 54, bodyChars: 120 },
      medium: { headlineChars: 48, bodyChars: 96 },
      compact: { headlineChars: 40, bodyChars: 76 },
    },
    timeline: {
      full: { headlineChars: 48, bodyChars: 120 },
      medium: { headlineChars: 42, bodyChars: 92 },
      compact: { headlineChars: 36, bodyChars: 72 },
    },
    implication: {
      full: { headlineChars: 54, bodyChars: 120 },
      medium: { headlineChars: 46, bodyChars: 92 },
      compact: { headlineChars: 40, bodyChars: 76 },
    },
    monitoring: {
      full: { headlineChars: 52, bodyChars: 110 },
      medium: { headlineChars: 44, bodyChars: 88 },
      compact: { headlineChars: 38, bodyChars: 72 },
    },
    scenario: {
      full: { headlineChars: 54, bodyChars: 120 },
      medium: { headlineChars: 46, bodyChars: 92 },
      compact: { headlineChars: 40, bodyChars: 76 },
    },
    closing: {
      full: { headlineChars: 64, bodyChars: 190 },
      medium: { headlineChars: 54, bodyChars: 150 },
      compact: { headlineChars: 46, bodyChars: 110 },
    },
  },
  "presentation-brief": {
    hero: {
      full: { headlineChars: 56, bodyChars: 110 },
      medium: { headlineChars: 48, bodyChars: 88 },
      compact: { headlineChars: 40, bodyChars: 68 },
    },
    support: {
      full: { headlineChars: 42, bodyChars: 72 },
      medium: { headlineChars: 36, bodyChars: 56 },
      compact: { headlineChars: 32, bodyChars: 44 },
    },
    kpi: {
      full: { headlineChars: 22, bodyChars: 22 },
      medium: { headlineChars: 22, bodyChars: 22 },
      compact: { headlineChars: 22, bodyChars: 22 },
    },
    evidence: {
      full: { headlineChars: 40, bodyChars: 68 },
      medium: { headlineChars: 34, bodyChars: 54 },
      compact: { headlineChars: 28, bodyChars: 42 },
    },
    timeline: {
      full: { headlineChars: 40, bodyChars: 66 },
      medium: { headlineChars: 34, bodyChars: 52 },
      compact: { headlineChars: 28, bodyChars: 40 },
    },
    implication: {
      full: { headlineChars: 40, bodyChars: 68 },
      medium: { headlineChars: 34, bodyChars: 54 },
      compact: { headlineChars: 28, bodyChars: 42 },
    },
    monitoring: {
      full: { headlineChars: 40, bodyChars: 68 },
      medium: { headlineChars: 34, bodyChars: 54 },
      compact: { headlineChars: 28, bodyChars: 42 },
    },
    scenario: {
      full: { headlineChars: 42, bodyChars: 70 },
      medium: { headlineChars: 36, bodyChars: 56 },
      compact: { headlineChars: 30, bodyChars: 44 },
    },
    closing: {
      full: { headlineChars: 48, bodyChars: 92 },
      medium: { headlineChars: 40, bodyChars: 76 },
      compact: { headlineChars: 34, bodyChars: 58 },
    },
  },
  "board-onepager": {
    hero: {
      full: { headlineChars: 42, bodyChars: 110 },
      medium: { headlineChars: 34, bodyChars: 86 },
      compact: { headlineChars: 28, bodyChars: 64 },
    },
    support: {
      full: { headlineChars: 30, bodyChars: 52 },
      medium: { headlineChars: 26, bodyChars: 42 },
      compact: { headlineChars: 22, bodyChars: 34 },
    },
    kpi: {
      full: { headlineChars: 18, bodyChars: 18 },
      medium: { headlineChars: 18, bodyChars: 18 },
      compact: { headlineChars: 18, bodyChars: 18 },
    },
    evidence: {
      full: { headlineChars: 28, bodyChars: 34 },
      medium: { headlineChars: 24, bodyChars: 28 },
      compact: { headlineChars: 20, bodyChars: 22 },
    },
    timeline: {
      full: { headlineChars: 28, bodyChars: 38 },
      medium: { headlineChars: 24, bodyChars: 30 },
      compact: { headlineChars: 20, bodyChars: 24 },
    },
    implication: {
      full: { headlineChars: 28, bodyChars: 42 },
      medium: { headlineChars: 24, bodyChars: 34 },
      compact: { headlineChars: 20, bodyChars: 26 },
    },
    monitoring: {
      full: { headlineChars: 28, bodyChars: 42 },
      medium: { headlineChars: 24, bodyChars: 34 },
      compact: { headlineChars: 20, bodyChars: 26 },
    },
    scenario: {
      full: { headlineChars: 28, bodyChars: 42 },
      medium: { headlineChars: 24, bodyChars: 34 },
      compact: { headlineChars: 20, bodyChars: 26 },
    },
    closing: {
      full: { headlineChars: 34, bodyChars: 64 },
      medium: { headlineChars: 28, bodyChars: 48 },
      compact: { headlineChars: 24, bodyChars: 36 },
    },
  },
};

export const measureTextBlock = ({
  mode,
  fitMode,
  variant,
  headline,
  body,
}: {
  mode: ExportMode;
  fitMode: ModuleFitMode;
  variant: CopyVariant;
  headline: string;
  body: string;
}) => {
  const profile = PROFILES[mode][fitMode][variant];
  return {
    fits: headline.length <= profile.headlineChars && body.length <= profile.bodyChars,
    profile,
  };
};
