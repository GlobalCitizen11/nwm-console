export const SYSTEM_LABELS = {
  HALO: "Interpretation Layer",
  PAL: "Adjudication Layer",
  PROTOSTAR: "Simulation Engine",
} as const;

export const SYSTEM_DESCRIPTIONS = {
  HALO: "Structures how narratives form across environments.",
  PAL: "Determines system state, thresholds, and constraints.",
  PROTOSTAR: "Explores how conditions evolve across scenarios.",
} as const;

export const SYSTEM_DISPLAY_LABELS = {
  framework: `${SYSTEM_LABELS.HALO} + ${SYSTEM_LABELS.PAL}`,
  interpretationLayerIntegrity: `${SYSTEM_LABELS.HALO} Integrity`,
  threeLayerSystem: `A three-layer system: ${SYSTEM_LABELS.HALO} (understanding), ${SYSTEM_LABELS.PAL} (state + constraints), and ${SYSTEM_LABELS.PROTOSTAR} (scenario exploration).`,
} as const;

const DISPLAY_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bHALO \+ PAL\b/g, SYSTEM_DISPLAY_LABELS.framework],
  [/\bpal-like-threshold\b/gi, `threshold-based ${SYSTEM_LABELS.PAL}`],
  [/\bPAL-adjudicated\b/g, `${SYSTEM_LABELS.PAL} active`],
  [/\bProvisional \(non-PAL\)\b/g, `Provisional (pre-${SYSTEM_LABELS.PAL})`],
  [/\bnon-PAL\b/g, `pre-${SYSTEM_LABELS.PAL}`],
  [/\binstitutional PAL\b/g, `institutional ${SYSTEM_LABELS.PAL}`],
  [/\bformal PAL\b/g, `formal ${SYSTEM_LABELS.PAL}`],
  [/\bProtostar\b/gi, SYSTEM_LABELS.PROTOSTAR],
  [/\bPAL\b/g, SYSTEM_LABELS.PAL],
  [/\bHALO\b/g, SYSTEM_LABELS.HALO],
];

export const replaceSystemCodenames = (text: string) =>
  DISPLAY_TEXT_REPLACEMENTS.reduce(
    (output, [pattern, replacement]) => output.replace(pattern, replacement),
    text,
  );

export const getFrameworkDisplayLabel = (framework: string) =>
  replaceSystemCodenames(framework);

export const getAdjudicationStatusDisplay = (status: string) => {
  if (status === "PAL") {
    return SYSTEM_LABELS.PAL;
  }
  return replaceSystemCodenames(status);
};

export const getGateAdjudicationStatusDisplay = (passed: boolean) =>
  passed ? `${SYSTEM_LABELS.PAL} active` : `Provisional (pre-${SYSTEM_LABELS.PAL})`;

export const getPhaseResolutionReasonDisplay = (reason: string) =>
  replaceSystemCodenames(reason);
