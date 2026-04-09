import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import scenarioData from "./data/scenarioCapitalFragmentation.json";
import scenarioEpsteinData from "./data/scenarioEpsteinDisclosure.json";
import scenarioSupplyChainData from "./data/scenarioSupplyChainRealignment.json";
import scenarioDigitalAssetsData from "./data/scenarioDigitalAssets.json";
import scenarioAISovereigntyData from "./data/aiSovereigntyScenario";
import { AudioPreferencesProvider } from "./components/AudioPreferencesProvider";
import { BriefingExportPanel } from "./components/BriefingExportPanel";
import { DeploymentBanner } from "./components/DeploymentBanner";
import { GovernancePanel } from "./components/GovernancePanel";
import { GuidedWalkthrough } from "./components/GuidedWalkthrough";
import { SavedViewsPanel } from "./components/SavedViewsPanel";
import { ScenarioComparisonPanel } from "./components/ScenarioComparisonPanel";
import { TimelineReplay } from "./components/TimelineReplay";
import { ExplainabilityGuide } from "./components/ExplainabilityGuide";
import { WorldBoundaryEditor } from "./components/WorldBoundaryEditor";
import { ConditionalProjectionPanel } from "./components/ConditionalProjectionPanel";
import { HALOPanel } from "./components/HALOPanel";
import { CurrentStateStrip } from "./components/CurrentStateStrip";
import { WhatChangedPanel } from "./components/WhatChangedPanel";
import { TimeProgressionMode } from "./components/TimeProgressionMode";
import { loadScenarioDataset } from "./data/schema";
import { runCounterfactualSimulation } from "./engine/counterfactualEngine";
import { buildConditionalProjection } from "./engine/projectionEngine";
import { runWorldSimulation } from "./engine/stateEngine";
import { configurePreferredVoice, getSavedVoiceProfile, isOpenAiVoiceProfile, setSavedVoiceProfile, type VoiceProfile } from "./utils/speech";
import { generateOpenAiSpeechAudio } from "./utils/openaiNarration";
import { hasOpenAiNarrationConfig } from "./utils/openaiNarration";
import { readUrlState, writeUrlState } from "./utils/urlState";
import { blockSectionAudio, claimAudioFocus, releaseAudioFocus, unblockSectionAudio } from "./utils/audioFocus";
import { ExecutiveView } from "./views/ExecutiveView";
import { AnalystView } from "./views/AnalystView";
import { OversightView } from "./views/OversightView";
import { SandboxView } from "./views/SandboxView";
import type { ActivityLogEntry, CounterfactualScenario, NamedCounterfactualScenario, ProofObject, ProofOverride, ScenarioDefinition, ViewSnapshot } from "./types";
import { StateProvenancePanel } from "./components/StateProvenancePanel";
import { ScenarioImportPanel } from "./components/ScenarioImportPanel";
import { ActivityLogPanel } from "./components/ActivityLogPanel";
import { AutoDemoPanel } from "./components/AutoDemoPanel";
import { ArtifactIngressRibbon } from "./components/ArtifactIngressRibbon";
import { VoiceBriefPanel } from "./components/VoiceBriefPanel";
import { VoiceBriefSignalMonitor } from "./components/VoiceBriefSignalMonitor";
import { LocalNwmConsolePanel } from "./components/LocalNwmConsolePanel";
import type { VoiceBriefIntelligence } from "./types/voiceBriefIntelligence";
import { SYSTEM_DISPLAY_LABELS, SYSTEM_LABELS } from "./lib/systemLabels";

type Role = "Executive" | "Analyst" | "Oversight" | "Sandbox";
const INTERPRETATION_LAYER = SYSTEM_LABELS.HALO;
const ADJUDICATION_LAYER = SYSTEM_LABELS.PAL;
const SIMULATION_ENGINE = SYSTEM_LABELS.PROTOSTAR;
const THREE_LAYER_SYSTEM = SYSTEM_DISPLAY_LABELS.threeLayerSystem;

const initialUrlState = typeof window !== "undefined" ? readUrlState() : {};
const builtInScenarioDefinitions: ScenarioDefinition[] = [
  {
    id: "capital-fragmentation",
    label: "Capital Fragmentation",
    description: "Geopolitical capital alignment and infrastructure governance.",
    dataset: loadScenarioDataset(scenarioData),
  },
  {
    id: "supply-chain-realignment",
    label: "Supply Chain Realignment",
    description: "Strategic supply chain sovereignty and industrial resilience.",
    dataset: loadScenarioDataset(scenarioSupplyChainData),
  },
  {
    id: "epstein-disclosure-stress",
    label: "Institutional Disclosure Stress",
    description: "Disclosure governance, reputational contagion, and institutional trust stress.",
    dataset: loadScenarioDataset(scenarioEpsteinData),
  },
  {
    id: "digital-asset-fragmentation",
    label: "Digital Asset Fragmentation",
    description: "Digital asset governance, custody, and market-structure divergence.",
    dataset: loadScenarioDataset(scenarioDigitalAssetsData),
  },
  {
    id: "ai-sovereignty-compute-access",
    label: "AI Sovereignty and Compute Access",
    description: "AI governance, compute access, export controls, and sovereign infrastructure fragmentation.",
    dataset: loadScenarioDataset(scenarioAISovereigntyData),
  },
];

const phaseColor = (phase: string) =>
  ({
    Escalating: "text-phaseYellow",
    "Escalation Edge": "text-phaseOrange",
    "Structural Reclassification": "text-phaseRed",
    "Fragmented Regime": "text-phaseViolet",
  }[phase] ?? "text-ink");

const AUTO_DEMO_REPLAY_SEQUENCE = [0, 18, 11] as const;

const buildWorldBoundaryContext = (world: ScenarioDefinition["dataset"]["world"]) =>
  [
    `World name: ${world.name}`,
    `Domain: ${world.domain}`,
    `Geography: ${world.geography}`,
    `Time horizon: ${world.timeHorizonMonths} months`,
    `Governance mode: ${world.governanceMode}`,
    `Source classes: ${(world.sourceClasses ?? []).join(", ") || "not specified"}`,
    `Boundary description: ${world.boundedDescription}`,
    `World summary: ${world.summary}`,
  ].join(" | ");

const autoDemoScripts = {
  executive: [
    {
      title: "Welcome",
      description:
        `Welcome. This walkthrough follows one bounded world through ${THREE_LAYER_SYSTEM}. The emphasis is on context: how signals begin to cohere, how state is resolved, and how alternative assumptions can be examined without losing traceability.`,
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-intro-card",
      presentationMode: true,
    },
    {
      title: "Operating posture",
      description:
        "Begin with operating posture. The scenario label, review setting, and safeguards establish the terms of the read before any interpretation begins.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-deployment",
      presentationMode: true,
    },
    {
      title: "Bounded world",
      description:
        "Start with the boundary. Here the environment is AI sovereignty and compute access across major jurisdictions, with attention to policy, semiconductors, cloud infrastructure, export controls, and strategic classification. That frame keeps the later read anchored to the signals most likely to shape the operating environment.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-boundary",
      presentationMode: true,
    },
    {
      title: "World overview",
      description:
        "World Overview condenses the boundary into a working brief. It gives you the summary, source classes, governance mode, and top-line measures that orient the rest of the read.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Replay and sequence",
      description:
        "Replay shows how pressure accumulates over time. What matters here is less any single event than the sequence through which conditions persist, tighten, or begin to cross a threshold.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-timeline-replay",
      presentationMode: true,
    },
    {
      title: `Current state and ${INTERPRETATION_LAYER}`,
      description:
        `Read the current-state strip beside the ${INTERPRETATION_LAYER}. Together they show where the world stands, how signals are cohering, and whether the environment still reads as contained or is beginning to harden.`,
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-current-state",
      presentationMode: true,
    },
    {
      title: "Month-over-month movement",
      description:
        "This panel isolates what changed from the prior month. It helps separate ordinary movement from shifts that materially change the read.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-what-changed",
      presentationMode: true,
    },
    {
      title: "Checkpoint progression",
      description:
        "Checkpoint months make the pace of change easier to see. This is useful when the question is whether pressure is stabilizing, tightening, or beginning to spread.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-time-progression",
      presentationMode: true,
    },
    {
      title: "Signal monitor",
      description:
        "The Signal Monitor keeps the watchlist close at hand. Key Signals, Risks, and Triggers make emerging pressure points easier to read without losing the broader context.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-signal-monitor",
      presentationMode: true,
    },
    {
      title: "Reading the AI sovereignty environment",
      description:
        "In this AI sovereignty scenario, the question is whether export controls, sovereign build-outs, vendor concentration, and strategic classification are beginning to move together. Patterns that might otherwise appear disconnected start to read as part of the same environment.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Governance and exports",
      description:
        "The right rail keeps governance posture and export paths visible. It is where a live read becomes something reviewable and reusable.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-governance",
      presentationMode: true,
    },
    {
      title: "Scenario comparison",
      description:
        "Comparison helps distinguish what is specific to this bounded world from pressures that may be appearing elsewhere.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-comparison",
      presentationMode: true,
    },
    {
      title: "Oversight review",
      description:
        "Oversight View keeps transition logic reviewable. Threshold conditions, proof objects, and audit state remain visible before the record moves outward.",
      role: "Oversight" as Role,
      month: 12,
      targetId: "demo-oversight",
      presentationMode: false,
    },
    {
      title: "Working views",
      description:
        "Each view carries a different job. Executive View supports orientation, Analyst View supports investigation, Oversight View supports review, and Sandbox View supports structured scenario testing.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-view-modes",
      presentationMode: false,
    },
    {
      title: `${SIMULATION_ENGINE}`,
      description:
        `The ${SIMULATION_ENGINE} supports bounded scenario testing. In this example the walkthrough removes one artifact, adds another, then adjusts A12 through delay and impact so you can see how the path responds under changed assumptions.`,
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-sandbox-controls",
      presentationMode: false,
    },
    {
      title: "Scenario import",
      description:
        "Scenario Import shows how the same workflow can be reused for a different bounded world or event set.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-import",
      presentationMode: false,
    },
    {
      title: "Operational summary",
      description:
        "This operational summary condenses the active world, current month, transition burden, and simulation status into a compact handoff.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-operational-summary",
      presentationMode: false,
    },
    {
      title: "Saved views",
      description:
        "Saved Views preserve exact states for later comparison, briefing, or review.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-saved-views",
      presentationMode: false,
    },
    {
      title: "Exports",
      description:
        "Exports turn the live state into a briefing surface or committee packet without losing the current context.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-exports",
      presentationMode: false,
    },
    {
      title: "Activity log",
      description:
        "The activity log keeps a local record of how the workspace changed during review.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-activity-log",
      presentationMode: false,
    },
    {
      title: "Closing read",
      description:
        "You have now moved from boundary definition through interpretation, adjudication, oversight, and scenario testing. The emphasis throughout is orientation before action.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-outro-card",
      presentationMode: false,
    },
  ],
  full: [
    {
      title: "Welcome",
      description:
        `Welcome. This walkthrough follows the full console flow, from bounded-world framing into the ${INTERPRETATION_LAYER}, the ${ADJUDICATION_LAYER}, analyst review surfaces, and the ${SIMULATION_ENGINE}.`,
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-intro-card",
      presentationMode: true,
    },
    {
      title: "Operating posture",
      description:
        "Begin with operating posture. It establishes scenario context and safeguards before the analytical surfaces come into view.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-deployment",
      presentationMode: true,
    },
    {
      title: "Bounded world",
      description:
        "Start with the bounded world itself. Here the environment is AI sovereignty and compute access across the United States, Europe, China, and adjacent infrastructure geographies. That frame keeps the later read anchored to policy, chips, cloud, export controls, and strategic infrastructure.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-boundary",
      presentationMode: true,
    },
    {
      title: "World overview",
      description:
        "World Overview translates the boundary into an initial brief. Summary, source classes, governance posture, and top-line measures set the conditions for everything that follows.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Replay and sequence",
      description:
        "Replay gives the world sequence and memory. It shows how policy, infrastructure, market, and sovereign signals accumulate into structural change over time.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-timeline-replay",
      presentationMode: true,
    },
    {
      title: `Current state and ${INTERPRETATION_LAYER}`,
      description:
        `The current-state strip and the ${INTERPRETATION_LAYER} provide the first consolidated read. They help clarify how much pressure has formed, how stable the environment appears, and where closer review may be warranted.`,
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-current-state",
      presentationMode: true,
    },
    {
      title: "Month-over-month movement",
      description:
        "This panel shows what moved since the prior month and which artifacts are carrying the shift. It helps separate drift from a more consequential change in state.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-what-changed",
      presentationMode: true,
    },
    {
      title: "Checkpoint progression",
      description:
        "Checkpoint months make the tempo of change easier to read. You can see whether pressure is accelerating, stabilizing, or beginning to recede.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-time-progression",
      presentationMode: true,
    },
    {
      title: "Signal monitor",
      description:
        "The Signal Monitor keeps the live watchlist visible. Key Signals, Risks, and Triggers bring the next pressure points closer to the surface.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-signal-monitor",
      presentationMode: true,
    },
    {
      title: "Reading the AI sovereignty environment",
      description:
        "In the AI sovereignty scenario, the working question is whether export controls, sovereign compute build-outs, cloud concentration, and strategic reclassification are beginning to align. This is where the broader situation becomes easier to read.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Governance and exports",
      description:
        "The right rail keeps governance posture and export paths in view. It links interpretation to review rather than treating the console as a closed analytical surface.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-governance",
      presentationMode: true,
    },
    {
      title: "Scenario comparison",
      description:
        "Comparison helps distinguish what is specific to this world from patterns that may be repeating elsewhere.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-comparison",
      presentationMode: false,
    },
    {
      title: "Analyst evidence",
      description:
        "Analyst View opens the evidence surfaces behind the executive readout. Charts, artifact exploration, the world map, and state provenance make concentration and relationship structure easier to inspect.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-analyst",
      presentationMode: false,
    },
    {
      title: "State provenance",
      description:
        "Provenance shows which signals and thresholds are carrying the current state. It is the quickest way to trace the read back to visible support.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-provenance",
      presentationMode: false,
    },
    {
      title: "Oversight review",
      description:
        "Oversight View keeps the basis for a phase change reviewable. Adjudication conditions, proof objects, and challenge state remain explicit.",
      role: "Oversight" as Role,
      month: 12,
      targetId: "demo-oversight",
      presentationMode: false,
    },
    {
      title: "Working views",
      description:
        "The views divide the work into orientation, investigation, review, and scenario testing. That division helps the same read remain legible across roles.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-view-modes",
      presentationMode: false,
    },
    {
      title: `${SIMULATION_ENGINE}`,
      description:
        `The ${SIMULATION_ENGINE} is used here for bounded sensitivity analysis. Remove, delay, or weaken an artifact and the console recomputes the path under the revised assumptions.`,
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-sandbox-controls",
      presentationMode: false,
    },
    {
      title: "Scenario import",
      description:
        "Scenario Import extends the same workflow to a new bounded world without changing the review model.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-import",
      presentationMode: false,
    },
    {
      title: "Operational summary",
      description:
        "This summary condenses the active world, current phase, transition count, and simulation status into a compact handoff.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-operational-summary",
      presentationMode: false,
    },
    {
      title: "Saved views",
      description:
        "Saved views preserve exact analysis states across roles and months.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-saved-views",
      presentationMode: false,
    },
    {
      title: "Exports",
      description:
        "Exports turn the current read into a reusable briefing surface.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-exports",
      presentationMode: false,
    },
    {
      title: "Activity log",
      description:
        "The activity log records imports, exports, proof updates, and movement through the workspace.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-activity-log",
      presentationMode: false,
    },
    {
      title: "Closing read",
      description:
        "This completes the full walkthrough. The console moves from interpretation to review and scenario testing without losing context or traceability.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-outro-card",
      presentationMode: false,
    },
  ],
  commercial: [
    {
      title: "Welcome",
      description:
        `Welcome. This walkthrough follows one bounded world through ${THREE_LAYER_SYSTEM}, from initial framing to reviewable state resolution and structured scenario testing.`,
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-intro-card",
      presentationMode: true,
    },
    {
      title: "Operating posture",
      description:
        "Start with operating posture. It makes the review setting explicit before any analysis begins.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-deployment",
      presentationMode: true,
    },
    {
      title: "Strategic environment",
      description:
        "The bounded world comes first. Here it covers AI sovereignty and compute access across policy, semiconductors, cloud infrastructure, and export controls. That frame keeps attention on the conditions forming around access, concentration, and constraint.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-boundary",
      presentationMode: true,
    },
    {
      title: "World overview",
      description:
        "World Overview turns that boundary into a concise opening brief. It is the first place where context starts to read as a coherent environment.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Replay and sequence",
      description:
        "Replay shows how pressure accumulates and why sequence matters. Instead of a point-in-time snapshot, you see how the environment begins to harden or remain manageable over time.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-timeline-replay",
      presentationMode: true,
    },
    {
      title: `Current state and ${INTERPRETATION_LAYER}`,
      description:
        `The current state and the ${INTERPRETATION_LAYER} sit together here. They provide a quick read on phase, instability, and evidentiary support before deeper review begins.`,
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-current-state",
      presentationMode: true,
    },
    {
      title: "Operational movement",
      description:
        "What Changed focuses on movement since the prior month. It makes it easier to see whether the read is genuinely shifting or simply absorbing more noise.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-what-changed",
      presentationMode: true,
    },
    {
      title: "Checkpoint progression",
      description:
        "This view makes the pace and direction of change easier to compare across checkpoints.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-time-progression",
      presentationMode: true,
    },
    {
      title: "Signal monitor",
      description:
        "The Signal Monitor keeps the active watchlist in view so emerging pressure points do not get lost in the broader narrative.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-signal-monitor",
      presentationMode: true,
    },
    {
      title: "Reading the AI sovereignty environment",
      description:
        "In this scenario, the question is whether compute access is becoming more segmented across jurisdictions and whether strategic dependence is tightening around a narrower set of actors.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Governance and exports",
      description:
        "Governance posture and export surfaces remain visible alongside the analysis. They help move a live read into a reviewable briefing record.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-governance",
      presentationMode: true,
    },
    {
      title: "Scenario comparison",
      description:
        "Comparison makes it easier to tell whether the current path is specific to this environment or part of a broader pattern.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-comparison",
      presentationMode: false,
    },
    {
      title: "Analyst evidence",
      description:
        "Analyst View opens the supporting evidence behind the executive readout. Charts, the world map, state provenance, and projection status show where pressure is concentrating and how the current read is being carried.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-analyst",
      presentationMode: false,
    },
    {
      title: "Provenance",
      description:
        "This provenance layer keeps the supporting artifacts, deltas, and threshold conditions close to the current read.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-provenance",
      presentationMode: false,
    },
    {
      title: "Oversight review",
      description:
        "Oversight View makes each phase change reviewable. The question shifts from what the system says to why the record supports it.",
      role: "Oversight" as Role,
      month: 12,
      targetId: "demo-oversight",
      presentationMode: false,
    },
    {
      title: "Working views",
      description:
        "The four views divide the work into orientation, investigation, review, and scenario testing.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-view-modes",
      presentationMode: false,
    },
    {
      title: `${SIMULATION_ENGINE}`,
      description:
        `The ${SIMULATION_ENGINE} lets you remove a signal, delay it, or change its impact so the path can be examined under different assumptions.`,
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-sandbox-controls",
      presentationMode: false,
    },
    {
      title: "Scenario import",
      description:
        "Scenario Import shows how the workflow can be reused for a different bounded world without changing the review discipline.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-import",
      presentationMode: false,
    },
    {
      title: "Operational summary",
      description:
        "After a scenario variation, the report and saved views preserve the resulting posture for later comparison.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-operational-summary",
      presentationMode: false,
    },
    {
      title: "Saved views",
      description:
        "Saved views keep the exact states that matter for follow-up review.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-saved-views",
      presentationMode: false,
    },
    {
      title: "Exports",
      description:
        "Exports and summaries let the current read travel beyond the live console without losing structure.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-exports",
      presentationMode: false,
    },
    {
      title: "Activity log",
      description:
        "The activity log keeps a simple local record of how the workspace changed during the session.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-activity-log",
      presentationMode: false,
    },
    {
      title: "Closing read",
      description:
        "This walkthrough closes with the same emphasis it began with: context first, explicit state resolution, and bounded scenario exploration.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-outro-card",
      presentationMode: false,
    },
  ],
} as const;

type AutoDemoScriptId = keyof typeof autoDemoScripts;
type AutoDemoSpeed = "slow" | "standard" | "fast";

export default function App() {
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      return JSON.parse(window.localStorage.getItem("nwm-activity-log") ?? "[]") as ActivityLogEntry[];
    } catch {
      return [];
    }
  });
  const [proofOverrides, setProofOverrides] = useState<Record<string, ProofOverride>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      return JSON.parse(window.localStorage.getItem("nwm-proof-overrides") ?? "{}") as Record<string, ProofOverride>;
    } catch {
      return {};
    }
  });
  const [importedScenarios, setImportedScenarios] = useState<ScenarioDefinition[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      return JSON.parse(window.localStorage.getItem("nwm-imported-scenarios") ?? "[]") as ScenarioDefinition[];
    } catch {
      return [];
    }
  });
  const scenarioDefinitions = useMemo(
    () => [...builtInScenarioDefinitions, ...importedScenarios],
    [importedScenarios],
  );
  const [scenarioId, setScenarioId] = useState(initialUrlState.scenario ?? builtInScenarioDefinitions[0].id);
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(initialUrlState.compareScenario ?? null);
  const [role, setRole] = useState<Role>((initialUrlState.role as Role) ?? "Executive");
  const [presentationMode, setPresentationMode] = useState(initialUrlState.presentation ?? false);
  const selectedScenario = scenarioDefinitions.find((scenario) => scenario.id === scenarioId) ?? scenarioDefinitions[0];
  const compareScenario = scenarioDefinitions.find((scenario) => scenario.id === compareScenarioId) ?? null;
  const autoDemoScenario = builtInScenarioDefinitions.find((scenario) => scenario.id === "ai-sovereignty-compute-access") ?? builtInScenarioDefinitions[0];
  const [worldConfig, setWorldConfig] = useState(selectedScenario.dataset.world);
  const [currentMonth, setCurrentMonth] = useState(initialUrlState.month ?? 18);
  const [guidedOpen, setGuidedOpen] = useState(initialUrlState.guide ?? true);
  const [guideExpanded, setGuideExpanded] = useState(initialUrlState.guideExpanded ?? true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialUrlState.event ?? "A14");
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(
    initialUrlState.transition ?? null,
  );
  const [counterfactualDraftScenario, setCounterfactualDraftScenario] = useState<CounterfactualScenario>(
    initialUrlState.sandboxDraft ?? [
      {
        eventId: "A10",
        mode: "remove",
        delayMonths: 2,
        strengthMultiplier: 0.55,
      },
    ],
  );
  const [savedCounterfactualScenarios, setSavedCounterfactualScenarios] = useState<NamedCounterfactualScenario[]>(
    initialUrlState.sandboxSaved ?? [],
  );
  const [selectedSandboxScenarioId, setSelectedSandboxScenarioId] = useState<string | null>(
    initialUrlState.sandboxSelectedId ?? null,
  );
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>(() =>
    typeof window !== "undefined" ? getSavedVoiceProfile() : "google-us-female",
  );
  const [voiceBriefIntelligence, setVoiceBriefIntelligence] = useState<VoiceBriefIntelligence | undefined>(undefined);
  const [savedViews, setSavedViews] = useState<ViewSnapshot[]>([]);
  const [autoDemoOpen, setAutoDemoOpen] = useState(false);
  const [autoDemoActive, setAutoDemoActive] = useState(false);
  const [autoDemoPaused, setAutoDemoPaused] = useState(false);
  const [autoDemoMinimized, setAutoDemoMinimized] = useState(false);
  const [autoDemoStepIndex, setAutoDemoStepIndex] = useState(0);
  const [autoDemoScriptId, setAutoDemoScriptId] = useState<AutoDemoScriptId>("executive");
  const [autoDemoSpeed, setAutoDemoSpeed] = useState<AutoDemoSpeed>("standard");
  const [autoDemoRunToken, setAutoDemoRunToken] = useState(0);
  const [autoDemoProofToken, setAutoDemoProofToken] = useState(0);
  const [autoDemoReplayToken, setAutoDemoReplayToken] = useState(0);
  const [autoDemoSandboxMessage, setAutoDemoSandboxMessage] = useState<string | null>(null);
  const [autoDemoSandboxActiveArtifactId, setAutoDemoSandboxActiveArtifactId] = useState<string | null>(null);
  const previousViewRef = useRef<{ scenarioId: string; role: Role; month: number } | null>(null);
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);
  const demoAudioUrlRef = useRef<string | null>(null);
  const demoAdvanceTimerRef = useRef<number | null>(null);
  const demoSandboxTimerRefs = useRef<number[]>([]);
  const demoNarrationRequestIdRef = useRef(0);
  const autoDemoAudioOwnerIdRef = useRef("auto-demo-narration");
  const autoDemoPausedRef = useRef(autoDemoPaused);
  const autoDemoSteps = autoDemoScripts[autoDemoScriptId];

  const logActivity = (action: ActivityLogEntry["action"], subject: string, detail: string) => {
    setActivityLog((current) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        action,
        subject,
        detail,
      },
      ...current,
    ].slice(0, 50));
  };

  useEffect(() => {
    setWorldConfig(selectedScenario.dataset.world);
    setCurrentMonth((value) => Math.min(value, selectedScenario.dataset.world.timeHorizonMonths));
  }, [selectedScenario]);

  useEffect(() => {
    window.localStorage.setItem("nwm-imported-scenarios", JSON.stringify(importedScenarios));
  }, [importedScenarios]);

  useEffect(() => {
    window.localStorage.setItem("nwm-activity-log", JSON.stringify(activityLog));
  }, [activityLog]);

  useEffect(() => {
    window.localStorage.setItem("nwm-proof-overrides", JSON.stringify(proofOverrides));
  }, [proofOverrides]);

  const baseResult = useMemo(
    () => runWorldSimulation(worldConfig, selectedScenario.dataset.events),
    [worldConfig, selectedScenario],
  );
  const autoDemoBaselineResult = useMemo(
    () => runWorldSimulation(autoDemoScenario.dataset.world, autoDemoScenario.dataset.events),
    [autoDemoScenario],
  );
  const activeResult = useMemo(
    () => runCounterfactualSimulation(worldConfig, selectedScenario.dataset.events, counterfactualDraftScenario),
    [counterfactualDraftScenario, worldConfig, selectedScenario],
  );
  const displayResult = useMemo(() => {
    if (Object.keys(proofOverrides).length === 0) {
      return activeResult;
    }
    return {
      ...activeResult,
      proofObjects: activeResult.proofObjects.map((proof) =>
        proofOverrides[proof.proofId]
          ? {
              ...proof,
              challengeStatus: proofOverrides[proof.proofId].challengeStatus,
              oversight: proofOverrides[proof.proofId].oversight,
            }
          : proof,
      ),
      transitions: activeResult.transitions.map((transition) =>
        proofOverrides[transition.proof.proofId]
          ? {
              ...transition,
              proof: {
                ...transition.proof,
                challengeStatus: proofOverrides[transition.proof.proofId].challengeStatus,
                oversight: proofOverrides[transition.proof.proofId].oversight,
              },
            }
          : transition,
      ),
    };
  }, [activeResult, proofOverrides]);
  const safeMonth = Math.min(currentMonth, activeResult.timeline.length - 1);
  const currentPoint = displayResult.timeline[safeMonth];
  const worldBoundaryContext = useMemo(() => buildWorldBoundaryContext(worldConfig), [worldConfig]);
  const comparisonResult = useMemo(
    () => (compareScenario ? runWorldSimulation(compareScenario.dataset.world, compareScenario.dataset.events) : null),
    [compareScenario],
  );
  const comparisonPoint = comparisonResult
    ? comparisonResult.timeline[Math.min(safeMonth, comparisonResult.timeline.length - 1)]
    : null;
  const projection = useMemo(
    () => buildConditionalProjection(displayResult, safeMonth),
    [displayResult, safeMonth],
  );

  const transitionCount = displayResult.transitions.length;
  const visibleTransitions = displayResult.transitions.filter((transition) => transition.month <= currentMonth);
  const activeDemoTargetId = autoDemoOpen ? autoDemoSteps[autoDemoStepIndex]?.targetId ?? null : null;
  const hasNarrationReady = !isOpenAiVoiceProfile(voiceProfile) || hasOpenAiNarrationConfig();
  const isPreferredDemoScenario = scenarioId === "ai-sovereignty-compute-access";
  const isDemoReady =
    role === "Executive" &&
    presentationMode &&
    isPreferredDemoScenario &&
    safeMonth === 0 &&
    hasNarrationReady &&
    !autoDemoActive;

  useEffect(() => {
    setSavedVoiceProfile(voiceProfile);
  }, [voiceProfile]);

  useEffect(() => {
    autoDemoPausedRef.current = autoDemoPaused;
  }, [autoDemoPaused]);

  useEffect(() => {
    if (autoDemoActive && !autoDemoPaused) {
      blockSectionAudio();
      return;
    }

    unblockSectionAudio();
  }, [autoDemoActive, autoDemoPaused]);

  const stopAutoDemoNarration = useCallback(() => {
    demoNarrationRequestIdRef.current += 1;
    window.speechSynthesis.cancel();
    if (demoAudioRef.current) {
      demoAudioRef.current.pause();
      demoAudioRef.current = null;
    }
    if (demoAudioUrlRef.current) {
      window.URL.revokeObjectURL(demoAudioUrlRef.current);
      demoAudioUrlRef.current = null;
    }
    releaseAudioFocus(autoDemoAudioOwnerIdRef.current);
  }, []);

  const stopAutoDemoPlayback = useCallback(() => {
    if (demoAdvanceTimerRef.current) {
      window.clearTimeout(demoAdvanceTimerRef.current);
      demoAdvanceTimerRef.current = null;
    }
    demoSandboxTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    demoSandboxTimerRefs.current = [];
    setAutoDemoSandboxMessage(null);
    setAutoDemoSandboxActiveArtifactId(null);
    stopAutoDemoNarration();
  }, [stopAutoDemoNarration]);

  const scrollAutoDemoTargetIntoView = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }
    const header = document.querySelector("header");
    const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 96;
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top + window.scrollY;
    const targetBottom = targetTop + targetRect.height;
    const viewportTop = window.scrollY + headerHeight + 24;
    const viewportBottom = window.scrollY + window.innerHeight - 24;

    let nextTop = targetTop - headerHeight - 24;
    if (targetRect.height <= window.innerHeight - headerHeight - 48) {
      if (targetBottom > viewportBottom) {
        nextTop = targetBottom - window.innerHeight + 24;
      }
      if (targetTop < viewportTop) {
        nextTop = targetTop - headerHeight - 24;
      }
    }

    window.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  };

  const demoSectionClassName = (targetId: string) =>
    activeDemoTargetId === targetId ? "demo-highlight-panel" : "";

  useEffect(() => {
    return () => {
      stopAutoDemoPlayback();
    };
  }, [stopAutoDemoPlayback]);

  useEffect(() => {
    writeUrlState({
      scenario: scenarioId,
      compareScenario: compareScenarioId,
      role,
      presentation: presentationMode,
      month: safeMonth,
      event: selectedEventId,
      transition: selectedTransitionId,
      guide: guidedOpen,
      guideExpanded,
      sandboxDraft: counterfactualDraftScenario,
      sandboxSaved: savedCounterfactualScenarios,
      sandboxSelectedId: selectedSandboxScenarioId,
    });
  }, [
    scenarioId,
    compareScenarioId,
    role,
    presentationMode,
    safeMonth,
    selectedEventId,
    selectedTransitionId,
    guidedOpen,
    guideExpanded,
    counterfactualDraftScenario,
    savedCounterfactualScenarios,
    selectedSandboxScenarioId,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.tagName === "INPUT" || (event.target as HTMLElement | null)?.tagName === "TEXTAREA") {
        return;
      }
      if (event.key === "ArrowRight") {
        setCurrentMonth((value) => Math.min(activeResult.timeline.length - 1, value + 1));
      }
      if (event.key === "ArrowLeft") {
        setCurrentMonth((value) => Math.max(0, value - 1));
      }
      if (event.key.toLowerCase() === "g") {
        setGuidedOpen(true);
      }
      if (event.key.toLowerCase() === "s") {
        setRole("Sandbox");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeResult.timeline.length]);

  useEffect(() => {
    const previous = previousViewRef.current;
    if (previous && (previous.scenarioId !== scenarioId || previous.role !== role || previous.month !== safeMonth)) {
      logActivity("view_changed", `${selectedScenario.label} ${role}`, `Moved to month ${safeMonth}.`);
    }
    previousViewRef.current = { scenarioId, role, month: safeMonth };
  }, [role, safeMonth, scenarioId, selectedScenario.label]);

  const saveCurrentView = () => {
    const snapshot: ViewSnapshot = {
      id: `view-${Date.now()}`,
      name: `${selectedScenario.label} ${role} M${safeMonth}`,
      scenarioId,
      role,
      month: safeMonth,
      eventId: selectedEventId,
      transitionId: selectedTransitionId,
      compareScenarioId,
    };
    setSavedViews((current) => [...current, snapshot]);
  };

  const loadSavedView = (view: ViewSnapshot) => {
    setScenarioId(view.scenarioId);
    setCompareScenarioId(view.compareScenarioId);
    setRole(view.role as Role);
    setCurrentMonth(view.month);
    setSelectedEventId(view.eventId);
    setSelectedTransitionId(view.transitionId);
  };

  const resetDemoState = () => {
    stopAutoDemoPlayback();
    setAutoDemoOpen(false);
    setAutoDemoActive(false);
    setAutoDemoPaused(false);
    setAutoDemoMinimized(false);
    setAutoDemoStepIndex(0);
    setAutoDemoScriptId("executive");
    setAutoDemoSpeed("standard");
    setAutoDemoSandboxMessage(null);
    setAutoDemoSandboxActiveArtifactId(null);
    setScenarioId("ai-sovereignty-compute-access");
    setCompareScenarioId(null);
    setRole("Executive");
    setPresentationMode(true);
    setCurrentMonth(0);
    setSelectedEventId(null);
    setSelectedTransitionId(null);
    setSelectedSandboxScenarioId(null);
    setCounterfactualDraftScenario([]);
  };

  useEffect(() => {
    if (!autoDemoActive) {
      return;
    }

    const step = autoDemoSteps[autoDemoStepIndex];
    if (!step) {
      setAutoDemoActive(false);
      setAutoDemoPaused(false);
      return;
    }

    setScenarioId("ai-sovereignty-compute-access");
    setRole(step.role);
    setPresentationMode(step.presentationMode);
    setCurrentMonth(step.month);

    if (step.targetId === "demo-timeline-replay") {
      window.setTimeout(() => {
        setAutoDemoReplayToken((value) => value + 1);
      }, 300);
    }

    if (step.targetId === "demo-comparison") {
      setCompareScenarioId("supply-chain-realignment");
    }

    if (step.targetId === "demo-oversight") {
      const demoVisibleTransitions = autoDemoBaselineResult.transitions.filter((transition) => transition.month <= step.month);
      const latestVisibleTransition = demoVisibleTransitions[demoVisibleTransitions.length - 1] ?? null;
      if (latestVisibleTransition) {
        setSelectedTransitionId(latestVisibleTransition.id);
      }
      window.setTimeout(() => {
        setAutoDemoProofToken((value) => value + 1);
      }, 700);
    }

    if (step.targetId === "demo-sandbox-controls") {
      setSelectedSandboxScenarioId(null);
      setAutoDemoSandboxActiveArtifactId("A10");
      setAutoDemoSandboxMessage("Initial setup: two artifacts are in view here, A10 and A12.");
      setCounterfactualDraftScenario([
        {
          eventId: "A10",
          mode: "remove",
          delayMonths: 0,
          strengthMultiplier: 1,
        },
        {
          eventId: "A12",
          mode: "reduce",
          delayMonths: 0,
          strengthMultiplier: 0.85,
        },
      ]);
      demoSandboxTimerRefs.current = [
        window.setTimeout(() => {
          setAutoDemoSandboxActiveArtifactId("A10");
          setAutoDemoSandboxMessage("Step 1: A10 is removed so the path change is easier to read.");
          setCounterfactualDraftScenario([
            {
              eventId: "A12",
              mode: "reduce",
              delayMonths: 0,
              strengthMultiplier: 0.85,
            },
          ]);
          scrollAutoDemoTargetIntoView("demo-sandbox-controls");
        }, 7800),
        window.setTimeout(() => {
          setAutoDemoSandboxActiveArtifactId("A13");
          setAutoDemoSandboxMessage("Step 2: A13 is added to introduce a second directional change.");
          setCounterfactualDraftScenario([
            {
              eventId: "A12",
              mode: "reduce",
              delayMonths: 0,
              strengthMultiplier: 0.85,
            },
            {
              eventId: "A13",
              mode: "remove",
              delayMonths: 0,
              strengthMultiplier: 1,
            },
          ]);
          scrollAutoDemoTargetIntoView("demo-sandbox-controls");
        }, 11200),
        window.setTimeout(() => {
          setAutoDemoSandboxActiveArtifactId("A12");
          setAutoDemoSandboxMessage("Step 3: focus shifts to A12, now treated as a delay.");
          setCounterfactualDraftScenario([
            {
              eventId: "A12",
              mode: "delay",
              delayMonths: 2,
              strengthMultiplier: 1,
            },
            {
              eventId: "A13",
              mode: "remove",
              delayMonths: 0,
              strengthMultiplier: 1,
            },
          ]);
          scrollAutoDemoTargetIntoView("demo-sandbox-controls");
        }, 13600),
        window.setTimeout(() => {
          setAutoDemoSandboxActiveArtifactId("A12");
          setAutoDemoSandboxMessage("Step 4: the delay on A12 is extended to five months.");
          setCounterfactualDraftScenario([
            {
              eventId: "A12",
              mode: "delay",
              delayMonths: 5,
              strengthMultiplier: 1,
            },
            {
              eventId: "A13",
              mode: "remove",
              delayMonths: 0,
              strengthMultiplier: 1,
            },
          ]);
          scrollAutoDemoTargetIntoView("demo-sandbox-controls");
        }, 16300),
        window.setTimeout(() => {
          setAutoDemoSandboxActiveArtifactId("A12");
          setAutoDemoSandboxMessage("Step 5: A12's impact is raised to 2.7 under a stronger assumption.");
          setCounterfactualDraftScenario([
            {
              eventId: "A12",
              mode: "reduce",
              delayMonths: 5,
              strengthMultiplier: 2.7,
            },
            {
              eventId: "A13",
              mode: "remove",
              delayMonths: 0,
              strengthMultiplier: 1,
            },
          ]);
          scrollAutoDemoTargetIntoView("demo-sandbox-controls");
        }, 20200),
      ];
    }

    const scrollTimer = window.setTimeout(() => {
      scrollAutoDemoTargetIntoView(step.targetId);
    }, 350);

    const finishStep = () => {
      if (autoDemoPausedRef.current) {
        return;
      }
      const baseDelay = { slow: 1800, standard: 1000, fast: 500 }[autoDemoSpeed];
      const stepDelay = step.targetId === "demo-sandbox-controls" ? 2000 : baseDelay;
      demoAdvanceTimerRef.current = window.setTimeout(() => {
        setAutoDemoStepIndex((current) => {
          if (current >= autoDemoSteps.length - 1) {
            setAutoDemoActive(false);
            setAutoDemoPaused(false);
            return current;
          }
          return current + 1;
        });
      }, stepDelay);
    };

    const playNarration = async () => {
      stopAutoDemoNarration();
      claimAudioFocus(autoDemoAudioOwnerIdRef.current, stopAutoDemoNarration);
      const narrationRequestId = demoNarrationRequestIdRef.current;

      if (isOpenAiVoiceProfile(voiceProfile)) {
        try {
          const blob = await generateOpenAiSpeechAudio(step.description, voiceProfile, "Executive");
          if (demoNarrationRequestIdRef.current !== narrationRequestId) {
            return;
          }
          const url = window.URL.createObjectURL(blob);
          demoAudioUrlRef.current = url;
          const audio = new Audio(url);
          demoAudioRef.current = audio;
          audio.onended = () => {
            releaseAudioFocus(autoDemoAudioOwnerIdRef.current);
            finishStep();
          };
          audio.onerror = () => {
            releaseAudioFocus(autoDemoAudioOwnerIdRef.current);
            finishStep();
          };
          await audio.play();
          return;
        } catch {
          // fall back to browser speech
        }
      }

      const utterance = new SpeechSynthesisUtterance(step.description);
      configurePreferredVoice(utterance, "Executive");
      utterance.onend = () => {
        releaseAudioFocus(autoDemoAudioOwnerIdRef.current);
        finishStep();
      };
      utterance.onerror = () => {
        releaseAudioFocus(autoDemoAudioOwnerIdRef.current);
        finishStep();
      };
      if (demoNarrationRequestIdRef.current !== narrationRequestId) {
        return;
      }
      window.speechSynthesis.speak(utterance);
    };

    playNarration();
    logActivity("view_changed", "Auto walkthrough", `Entered step ${autoDemoStepIndex + 1}: ${step.title}.`);

    return () => {
      window.clearTimeout(scrollTimer);
      stopAutoDemoPlayback();
    };
  }, [
    autoDemoActive,
    autoDemoRunToken,
    autoDemoStepIndex,
    autoDemoSteps,
    autoDemoSpeed,
    voiceProfile,
    autoDemoBaselineResult.transitions,
    stopAutoDemoNarration,
    stopAutoDemoPlayback,
  ]);

  return (
    <AudioPreferencesProvider role={role} mode="detailed" provider="openai" voiceProfile={voiceProfile}>
      <div className="min-h-screen bg-shell text-ink">
        <GuidedWalkthrough open={guidedOpen} onClose={() => setGuidedOpen(false)} />
        <AutoDemoPanel
          open={autoDemoOpen}
          active={autoDemoActive}
          paused={autoDemoPaused}
          minimized={autoDemoMinimized}
          stepIndex={autoDemoStepIndex}
          totalSteps={autoDemoSteps.length}
          stepTitles={autoDemoSteps.map((step) => step.title)}
          stepTitle={autoDemoSteps[autoDemoStepIndex]?.title ?? null}
          stepDescription={autoDemoSteps[autoDemoStepIndex]?.description ?? null}
          scriptId={autoDemoScriptId}
          speed={autoDemoSpeed}
          onClose={() => {
            setAutoDemoOpen(false);
            setAutoDemoActive(false);
            setAutoDemoPaused(false);
            setAutoDemoMinimized(false);
            stopAutoDemoPlayback();
          }}
          onExpand={() => setAutoDemoMinimized(false)}
          onMinimize={() => setAutoDemoMinimized(true)}
          onStart={() => {
            stopAutoDemoPlayback();
            setAutoDemoStepIndex(0);
            setAutoDemoPaused(false);
            setAutoDemoActive(true);
            setAutoDemoMinimized(true);
            setAutoDemoRunToken((value) => value + 1);
          }}
          onPause={() => {
            setAutoDemoPaused(true);
            stopAutoDemoPlayback();
            setAutoDemoMinimized(false);
          }}
          onResume={() => {
            stopAutoDemoPlayback();
            setAutoDemoPaused(false);
            setAutoDemoActive(true);
            setAutoDemoMinimized(true);
            setAutoDemoRunToken((value) => value + 1);
          }}
          onStop={() => {
            setAutoDemoActive(false);
            setAutoDemoPaused(false);
            setAutoDemoStepIndex(0);
            setAutoDemoMinimized(false);
            stopAutoDemoPlayback();
          }}
          onStepBack={() => {
            stopAutoDemoPlayback();
            setAutoDemoOpen(true);
            setAutoDemoActive(true);
            setAutoDemoPaused(true);
            setAutoDemoMinimized(false);
            setAutoDemoStepIndex((current) => Math.max(0, current - 1));
          }}
          onStepForward={() => {
            stopAutoDemoPlayback();
            setAutoDemoOpen(true);
            setAutoDemoActive(true);
            setAutoDemoPaused(true);
            setAutoDemoMinimized(false);
            setAutoDemoStepIndex((current) => Math.min(autoDemoSteps.length - 1, current + 1));
          }}
          onStepJump={(stepIndex) => {
            stopAutoDemoPlayback();
            setAutoDemoOpen(true);
            setAutoDemoActive(true);
            setAutoDemoPaused(true);
            setAutoDemoMinimized(false);
            setAutoDemoStepIndex(stepIndex);
          }}
          onScriptChange={(scriptId) => {
            stopAutoDemoPlayback();
            setAutoDemoScriptId(scriptId as AutoDemoScriptId);
            setAutoDemoStepIndex(0);
            setAutoDemoPaused(false);
            setAutoDemoActive(false);
            setAutoDemoMinimized(false);
          }}
          onSpeedChange={(speed) => setAutoDemoSpeed(speed as AutoDemoSpeed)}
        />

        <header className="z-30 border-b border-edge bg-panel/95 lg:sticky lg:top-0">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-3 md:gap-4 md:py-3 xl:gap-5 xl:py-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between xl:gap-4">
              <div>
                <p className="section-kicker">Narrative World Modeling Console</p>
                <h1 className="mt-1.5 text-2xl font-semibold md:text-[1.75rem] xl:mt-2 xl:text-3xl">NWM Console</h1>
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted md:max-w-2xl xl:mt-2">
                  {selectedScenario.description} Structured orientation across narrative movement, state resolution, and bounded scenario review.
                </p>
              </div>
              <div className="surface-panel-subtle hidden gap-2 px-4 py-3 text-sm lg:grid lg:w-full xl:max-w-[360px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted">Scenario</span>
                  <span className="text-ink">{selectedScenario.label}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted">Role</span>
                  <span className="text-ink">{role}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted">Replay month</span>
                  <span className="text-ink">M{safeMonth}</span>
                </div>
                {role === "Executive" ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">Presentation</span>
                    <span className="text-ink">{presentationMode ? "Enabled" : "Standard"}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted">Walkthrough ready</span>
                  <span className={isDemoReady ? "text-phaseYellow" : "text-ink"}>
                    {isDemoReady ? "Ready" : "Check state"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="segmented-control w-full xl:w-auto">
              {(["Executive", "Analyst", "Sandbox", "Oversight"] as Role[]).map((candidate) => (
                <button
                  key={candidate}
                  className={`rounded-md border px-2.5 py-2 text-sm transition-colors md:px-3 ${
                    role === candidate ? "border-muted bg-shell text-ink" : "border-edge/70 text-muted hover:border-edge hover:text-ink"
                  }`}
                  onClick={() => setRole(candidate)}
                >
                  {candidate} View
                </button>
              ))}
              <button
                className="action-button"
                onClick={() => setGuidedOpen(true)}
              >
                Guided Walkthrough
              </button>
              <button
                className="action-button"
                onClick={() => setAutoDemoOpen(true)}
              >
                Auto Walkthrough
              </button>
              <button
                className="action-button"
                onClick={resetDemoState}
              >
                  Reset Walkthrough State
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                <label className="control-stack">
                  <span className="control-label">Scenario</span>
                  <select
                    className="control-input"
                    value={scenarioId}
                    onChange={(event) => setScenarioId(event.target.value)}
                    title="Active scenario"
                  >
                    {scenarioDefinitions.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="control-stack">
                  <span className="control-label">Comparison</span>
                  <select
                    className="control-input"
                    value={compareScenarioId ?? ""}
                    onChange={(event) => setCompareScenarioId(event.target.value || null)}
                    title="Comparison scenario"
                  >
                    <option value="">No comparison</option>
                    {scenarioDefinitions
                      .filter((scenario) => scenario.id !== scenarioId)
                      .map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                          Compare: {scenario.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="control-stack">
                  <span className="control-label">Audio brief voice</span>
                  <select
                    className="control-input"
                    value={voiceProfile}
                    onChange={(event) => setVoiceProfile(event.target.value as VoiceProfile)}
                    title="Preferred audio brief voice"
                  >
                    <option value="google-us-female">Google US Female</option>
                    <option value="openai-shimmer">HiFi Audio</option>
                  </select>
                </label>
              </div>
            </div>
            {role === "Executive" ? (
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between 2xl:justify-end">
                <div className="surface-panel-subtle text-sm text-muted xl:flex-1 2xl:flex-none">
                  <p>
                    Walkthrough readiness:{" "}
                    <span className={isDemoReady ? "text-phaseYellow" : "text-ink"}>
                      {isDemoReady
                        ? "Walkthrough ready"
                        : `Set Executive View, Presentation Mode, Month 0, and the AI Sovereignty scenario${
                            hasNarrationReady ? "" : ", plus valid narration configuration"
                          }.`}
                    </span>
                  </p>
                </div>
                <button
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    presentationMode ? "border-phaseYellow bg-shell text-ink" : "border-edge/70 text-muted hover:border-edge hover:text-ink"
                  }`}
                  onClick={() => setPresentationMode((value) => !value)}
                >
                  {presentationMode ? "Presentation Mode On" : "Presentation Mode Off"}
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <ArtifactIngressRibbon events={selectedScenario.dataset.events} currentMonth={safeMonth} />

        <main
          className={`mx-auto grid max-w-[1600px] gap-5 px-4 py-5 ${
            role === "Executive" && presentationMode
              ? "2xl:grid-cols-[minmax(0,1fr)_minmax(260px,19rem)]"
              : "2xl:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)]"
          }`}
        >
          <div className="min-w-0 space-y-5">
          {autoDemoOpen ? (
            <section
              id="demo-intro-card"
              style={{ scrollMarginTop: "140px" }}
              className={demoSectionClassName("demo-intro-card")}
            >
              <div className="surface-panel">
                <p className="section-kicker">Guided Walkthrough</p>
                <h2 className="section-title">Narrative World Modeling review</h2>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
                  This walkthrough follows a bounded world from initial framing through the {INTERPRETATION_LAYER}, the {ADJUDICATION_LAYER}, and the {SIMULATION_ENGINE}. Use it to see how the environment is interpreted, how state is clarified, and how alternative assumptions can be examined without breaking continuity.
                </p>
              </div>
            </section>
          ) : null}
          <div id="demo-deployment" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-deployment")}>
            <DeploymentBanner scenarioLabel={selectedScenario.label} compareLabel={compareScenario?.label ?? null} />
          </div>
          {role !== "Executive" ? (
            <CurrentStateStrip
              scenarioLabel={selectedScenario.label}
              compareLabel={compareScenario?.label ?? null}
              point={currentPoint}
              visibleTransitionCount={visibleTransitions.length}
              simulationActive={counterfactualDraftScenario.length > 0}
            />
          ) : null}

          {!presentationMode ? (
            <ExplainabilityGuide
              role={role}
              open={guideExpanded}
              onToggle={() => setGuideExpanded((value) => !value)}
            />
          ) : null}

          {role === "Executive" ? (
            <>
              <div id="demo-world-boundary" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-world-boundary")}>
                <WorldBoundaryEditor
                  world={worldConfig}
                  worldBoundaryContext={worldBoundaryContext}
                  onChange={setWorldConfig}
                />
              </div>
              <div id="demo-world-overview" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-world-overview")}>
                <ExecutiveView
                  scenarioLabel={selectedScenario.label}
                  scenarioId={scenarioId}
                  result={displayResult}
                  point={currentPoint}
                />
              </div>
              <div id="demo-timeline-replay" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-timeline-replay")}>
                <TimelineReplay
                  timeline={displayResult.timeline}
                  transitions={displayResult.transitions}
                  currentMonth={safeMonth}
                  onMonthChange={setCurrentMonth}
                  worldBoundaryContext={worldBoundaryContext}
                  demoPlayback={
                    activeDemoTargetId === "demo-timeline-replay"
                      ? {
                          token: autoDemoReplayToken,
                          startMonth: 0,
                          endMonth: autoDemoSteps[autoDemoStepIndex]?.month ?? safeMonth,
                          sequence: AUTO_DEMO_REPLAY_SEQUENCE,
                        }
                      : null
                  }
                />
              </div>
              <div id="demo-current-state" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-current-state")}>
                <CurrentStateStrip
                  scenarioLabel={selectedScenario.label}
                  compareLabel={compareScenario?.label ?? null}
                  point={currentPoint}
                  visibleTransitionCount={visibleTransitions.length}
                  simulationActive={counterfactualDraftScenario.length > 0}
                />
                <HALOPanel
                  halo={currentPoint.halo}
                  phase={currentPoint.phase}
                  ringCount={currentPoint.visibleEvents.length}
                  worldBoundaryContext={worldBoundaryContext}
                />
              </div>
              <div id="demo-what-changed" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-what-changed")}>
                <WhatChangedPanel result={displayResult} point={currentPoint} />
              </div>
              <div id="demo-time-progression" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-time-progression")}>
                <TimeProgressionMode result={displayResult} />
              </div>
              {!presentationMode ? (
                <>
                  <StateProvenancePanel result={displayResult} point={currentPoint} />
                  <ConditionalProjectionPanel projection={projection} worldBoundaryContext={worldBoundaryContext} />
                </>
              ) : null}
              <section className="surface-panel">
                <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                  <div>
                    <p className="section-kicker">Bounded Narrative World</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{worldConfig.boundedDescription}</p>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="surface-panel-subtle p-3">
                      <p className="section-kicker">Current Phase</p>
                      <p className={`mt-2 text-lg font-semibold ${phaseColor(currentPoint.phase)}`}>{currentPoint.phase}</p>
                    </div>
                    <div className="surface-panel-subtle p-3">
                      <p className="section-kicker">Proof Objects</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{displayResult.proofObjects.length}</p>
                    </div>
                    <div className="surface-panel-subtle p-3">
                      <p className="section-kicker">Transitions</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{transitionCount}</p>
                    </div>
                    <div className="surface-panel-subtle p-3">
                      <p className="section-kicker">Visible Artifacts</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{currentPoint.visibleEvents.length}</p>
                    </div>
                  </div>
                </div>
              </section>
              <div id="demo-signal-monitor" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-signal-monitor")}>
                <VoiceBriefSignalMonitor intelligence={voiceBriefIntelligence} />
              </div>
              {comparisonResult && comparisonPoint ? (
                <div id="demo-comparison" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-comparison")}>
                  <ScenarioComparisonPanel
                    primaryLabel={selectedScenario.label}
                    primaryResult={displayResult}
                    primaryPoint={currentPoint}
                    secondaryLabel={compareScenario?.label ?? "Comparison"}
                    secondaryResult={comparisonResult}
                    secondaryPoint={comparisonPoint}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {role !== "Executive" ? (
            <>
              <section className="surface-panel">
                <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">Bounded Narrative World</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{worldConfig.boundedDescription}</p>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="surface-panel-subtle p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Current Phase</p>
                      <p className={`mt-2 text-lg font-semibold ${phaseColor(currentPoint.phase)}`}>{currentPoint.phase}</p>
                    </div>
                    <div className="surface-panel-subtle p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Proof Objects</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{displayResult.proofObjects.length}</p>
                    </div>
                    <div className="surface-panel-subtle p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Transitions</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{transitionCount}</p>
                    </div>
                    <div className="surface-panel-subtle p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Visible Artifacts</p>
                      <p className="mt-2 text-lg font-semibold text-ink">{currentPoint.visibleEvents.length}</p>
                    </div>
                  </div>
                </div>
              </section>
              <div id="demo-signal-monitor" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-signal-monitor")}>
                <VoiceBriefSignalMonitor intelligence={voiceBriefIntelligence} />
              </div>

              {comparisonResult && comparisonPoint ? (
                <div id="demo-comparison" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-comparison")}>
                  <ScenarioComparisonPanel
                    primaryLabel={selectedScenario.label}
                    primaryResult={displayResult}
                    primaryPoint={currentPoint}
                    secondaryLabel={compareScenario?.label ?? "Comparison"}
                    secondaryResult={comparisonResult}
                    secondaryPoint={comparisonPoint}
                  />
                </div>
              ) : null}

              <div id="demo-provenance" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-provenance")}>
                <StateProvenancePanel result={displayResult} point={currentPoint} />
              </div>

              <TimelineReplay
                timeline={displayResult.timeline}
                transitions={displayResult.transitions}
                currentMonth={safeMonth}
                onMonthChange={setCurrentMonth}
                worldBoundaryContext={worldBoundaryContext}
                demoPlayback={
                  activeDemoTargetId === "demo-timeline-replay"
                    ? {
                        token: autoDemoReplayToken,
                        startMonth: 0,
                        endMonth: autoDemoSteps[autoDemoStepIndex]?.month ?? safeMonth,
                        sequence: AUTO_DEMO_REPLAY_SEQUENCE,
                      }
                    : null
                }
              />
              <div id="demo-time-progression" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-time-progression")}>
                <TimeProgressionMode result={displayResult} />
              </div>
              <WhatChangedPanel result={displayResult} point={currentPoint} />

              {role === "Analyst" ? (
                <div id="demo-analyst" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-analyst")}>
                  <AnalystView
                    result={displayResult}
                    point={currentPoint}
                    projection={projection}
                    worldBoundaryContext={worldBoundaryContext}
                    selectedEventId={selectedEventId}
                    onSelectEvent={setSelectedEventId}
                  />
                </div>
              ) : null}

              {role === "Sandbox" ? (
                <div id="demo-sandbox" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-sandbox")}>
                  <SandboxView
                    baseResult={baseResult}
                    scenarioResult={activeResult}
                    projection={projection}
                    worldBoundaryContext={worldBoundaryContext}
                    demoHighlightControls={activeDemoTargetId === "demo-sandbox-controls"}
                    demoControlMessage={autoDemoSandboxMessage}
                    demoActiveArtifactId={autoDemoSandboxActiveArtifactId}
                    draftScenario={counterfactualDraftScenario}
                    savedScenarios={savedCounterfactualScenarios}
                    selectedScenarioId={selectedSandboxScenarioId}
                    onDraftScenarioChange={setCounterfactualDraftScenario}
                    onSavedScenariosChange={setSavedCounterfactualScenarios}
                    onSelectedScenarioIdChange={setSelectedSandboxScenarioId}
                  />
                </div>
              ) : null}

              {role === "Oversight" ? (
                <div id="demo-oversight" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-oversight")}>
                  <OversightView
                    result={displayResult}
                    currentMonth={safeMonth}
                    worldBoundaryContext={worldBoundaryContext}
                    selectedTransitionId={selectedTransitionId ?? visibleTransitions[visibleTransitions.length - 1]?.id ?? null}
                    autoOpenProofToken={autoDemoProofToken}
                    onSelectTransition={setSelectedTransitionId}
                    onProofUpdate={(proof: ProofObject) => {
                      setProofOverrides((current) => ({
                        ...current,
                        [proof.proofId]: {
                          challengeStatus: proof.challengeStatus,
                          oversight: proof.oversight,
                        },
                      }));
                      logActivity("proof_updated", proof.proofId, `Review state set to ${proof.oversight.reviewState}; challenge status ${proof.challengeStatus}.`);
                    }}
                  />
                </div>
              ) : null}
            </>
              ) : null}
              {autoDemoOpen ? (
                <section
                  id="demo-view-modes"
                  style={{ scrollMarginTop: "140px" }}
                  className={demoSectionClassName("demo-view-modes")}
                >
                  <div className="surface-panel">
                    <p className="section-kicker">View Modes</p>
                    <h2 className="section-title">What each view is for</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="surface-panel-subtle p-4">
                        <p className="section-kicker">Executive</p>
                        <p className="mt-2 text-sm leading-6 text-muted">Best for top-line orientation, leadership briefing, and current structural posture.</p>
                      </div>
                      <div className="surface-panel-subtle p-4">
                        <p className="section-kicker">Analyst</p>
                        <p className="mt-2 text-sm leading-6 text-muted">Best for charts, artifacts, provenance, comparison, and deeper evidence review.</p>
                      </div>
                      <div className="surface-panel-subtle p-4">
                        <p className="section-kicker">Oversight</p>
                        <p className="mt-2 text-sm leading-6 text-muted">Best for proof objects, adjudication logic, review workflow, and governance challenge.</p>
                      </div>
                      <div className="surface-panel-subtle p-4">
                        <p className="section-kicker">Sandbox</p>
                        <p className="mt-2 text-sm leading-6 text-muted">Best for remove, delay, and impact testing to see how sensitive the world is to key artifacts.</p>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
              {autoDemoOpen ? (
                <section
                  id="demo-outro-card"
                  style={{ scrollMarginTop: "140px" }}
                  className={demoSectionClassName("demo-outro-card")}
                >
                  <div className="surface-panel">
                    <p className="section-kicker">Walkthrough Complete</p>
                    <h2 className="section-title">Operational handoff</h2>
                    <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
                      You have now seen the core flow from world definition to replay, evidence, oversight, and scenario testing. From here, the console can move directly into saved views, exports, imported worlds, or a client-specific scenario review.
                    </p>
                  </div>
                </section>
              ) : null}
          </div>

          <div className="min-w-0 space-y-5 2xl:sticky 2xl:top-28 2xl:self-start">
              <div id="demo-governance" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-governance")}>
                <GovernancePanel world={worldConfig} worldBoundaryContext={worldBoundaryContext} />
              </div>
              {!presentationMode ? (
                <div id="demo-saved-views" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-saved-views")}>
                  <SavedViewsPanel
                    currentView={{
                      scenarioId,
                      role,
                      month: safeMonth,
                      eventId: selectedEventId,
                      transitionId: selectedTransitionId,
                      compareScenarioId,
                    }}
                    savedViews={savedViews}
                    onSave={saveCurrentView}
                    onLoad={loadSavedView}
                    onDelete={(viewId) => setSavedViews((current) => current.filter((view) => view.id !== viewId))}
                  />
                </div>
              ) : null}
              <div id="demo-exports" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-exports")}>
                <BriefingExportPanel
                  scenarioLabel={selectedScenario.label}
                  result={displayResult}
                  point={currentPoint}
                  currentView={{
                    id: "current",
                    name: "Current View",
                    scenarioId,
                    role,
                    month: safeMonth,
                    eventId: selectedEventId,
                    transitionId: selectedTransitionId,
                    compareScenarioId,
                  }}
                  onExport={(artifact) => logActivity("brief_exported", `${selectedScenario.label}`, `Exported ${artifact}.`)}
                />
              </div>
              <div>
                <LocalNwmConsolePanel
                  scenarioLabel={selectedScenario.label}
                  result={displayResult}
                  point={currentPoint}
                  currentView={{
                    id: "current",
                    name: "Current View",
                    scenarioId,
                    role,
                    month: safeMonth,
                    eventId: selectedEventId,
                    transitionId: selectedTransitionId,
                    compareScenarioId,
                  }}
                />
              </div>
              <div>
                <VoiceBriefPanel
                  scenarioLabel={selectedScenario.label}
                  result={displayResult}
                  point={currentPoint}
                  onIntelligenceUpdate={setVoiceBriefIntelligence}
                  currentView={{
                    id: "current",
                    name: "Current View",
                    scenarioId,
                    role,
                    month: safeMonth,
                    eventId: selectedEventId,
                    transitionId: selectedTransitionId,
                    compareScenarioId,
                  }}
                />
              </div>
              <section
                className={`surface-panel ${demoSectionClassName("demo-operational-summary")}`}
                id="demo-operational-summary"
                style={{ scrollMarginTop: "140px" }}
              >
                <p className="section-kicker">Operational Summary</p>
                <div className="mt-4 space-y-3 text-sm text-muted">
                  <p>Scenario: <span className="text-ink">{selectedScenario.label}</span></p>
                  <p>Role: <span className="text-ink">{role}</span></p>
                  <p>Replay month: <span className="text-ink">{safeMonth}</span></p>
                  <p>Visible transitions: <span className="text-ink">{visibleTransitions.length}</span></p>
                  <p>Simulation active: <span className="text-ink">{counterfactualDraftScenario.length > 0 ? "Yes" : "No"}</span></p>
                  <p>Narration engine: <span className="text-ink">OpenAI voice path</span></p>
                  {role === "Executive" ? <p>Presentation mode: <span className="text-ink">{presentationMode ? "Yes" : "No"}</span></p> : null}
                  <p>Keyboard shortcuts: <span className="text-ink">Left/Right month, G guided walkthrough, S sandbox</span></p>
                </div>
                <p className="mt-4 text-xs leading-6 text-muted">
                  AI-generated narration may add nuance, but it remains orientation support only. It must not be treated as truth adjudication, automated judgment, or a substitute for human review.
                </p>
              </section>
              {role !== "Executive" ? (
                <WorldBoundaryEditor
                  world={worldConfig}
                  worldBoundaryContext={worldBoundaryContext}
                  onChange={setWorldConfig}
                />
              ) : null}
              <div id="demo-import" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-import")}>
                <ScenarioImportPanel
                  importedScenarios={importedScenarios}
                  onImport={(scenario) => {
                    setImportedScenarios((current) => [...current, scenario]);
                    setScenarioId(scenario.id);
                    logActivity("scenario_imported", scenario.label, `Imported scenario with ${scenario.dataset.events.length} events.`);
                  }}
                  onDelete={(scenarioIdToDelete) => {
                    const deleted = importedScenarios.find((scenario) => scenario.id === scenarioIdToDelete);
                    setImportedScenarios((current) => current.filter((scenario) => scenario.id !== scenarioIdToDelete));
                    if (scenarioId === scenarioIdToDelete) {
                      setScenarioId(builtInScenarioDefinitions[0].id);
                    }
                    if (deleted) {
                      logActivity("scenario_removed", deleted.label, "Removed imported scenario from local workspace.");
                    }
                  }}
                  onExport={(scenarioIdToExport) => {
                    const scenario = importedScenarios.find((entry) => entry.id === scenarioIdToExport);
                    if (!scenario) {
                      return;
                    }
                    const blob = new Blob([JSON.stringify(scenario.dataset, null, 2)], { type: "application/json" });
                    const url = window.URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `${scenario.id}.json`;
                    anchor.click();
                    window.URL.revokeObjectURL(url);
                    logActivity("scenario_exported", scenario.label, "Exported transformed scenario dataset JSON.");
                  }}
                />
              </div>
              <div id="demo-activity-log" style={{ scrollMarginTop: "140px" }} className={demoSectionClassName("demo-activity-log")}>
                <ActivityLogPanel entries={activityLog} onClear={() => setActivityLog([])} />
              </div>
            </div>
        </main>
      </div>
    </AudioPreferencesProvider>
  );
}
