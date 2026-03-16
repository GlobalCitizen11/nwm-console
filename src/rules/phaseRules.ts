export const ruleVersion = "phase-rules.v1.0.0";

export const phaseOrder = [
  "Escalating",
  "Escalation Edge",
  "Structural Reclassification",
  "Fragmented Regime",
] as const;

export const phaseColors: Record<string, string> = {
  Escalating: "#d5b349",
  "Escalation Edge": "#c76c2d",
  "Structural Reclassification": "#a94646",
  "Fragmented Regime": "#645091",
};

export interface RuleThreshold {
  toPhase: string;
  minMonths: number;
  lowerBound: {
    velocity?: number;
    density?: number;
    coherence?: number;
    reversibilityMax?: number;
    instability?: number;
  };
  hysteresisFloor: {
    velocity?: number;
    density?: number;
    coherence?: number;
    reversibilityMax?: number;
    instability?: number;
  };
}

export const transitionRules: RuleThreshold[] = [
  {
    toPhase: "Escalation Edge",
    minMonths: 2,
    lowerBound: {
      velocity: 50,
      density: 46,
    },
    hysteresisFloor: {
      velocity: 45,
      density: 43,
    },
  },
  {
    toPhase: "Structural Reclassification",
    minMonths: 2,
    lowerBound: {
      density: 57,
      coherence: 45,
      reversibilityMax: 38,
    },
    hysteresisFloor: {
      density: 53,
      coherence: 43,
      reversibilityMax: 41,
    },
  },
  {
    toPhase: "Fragmented Regime",
    minMonths: 2,
    lowerBound: {
      density: 69,
      coherence: 45,
      reversibilityMax: 30,
      instability: 64,
    },
    hysteresisFloor: {
      density: 66,
      coherence: 43,
      reversibilityMax: 33,
      instability: 61,
    },
  },
];
