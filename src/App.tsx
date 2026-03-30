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
import type { VoiceBriefIntelligence } from "./types/voiceBriefIntelligence";

type Role = "Executive" | "Analyst" | "Oversight" | "Sandbox";

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
        "Welcome. This walkthrough will show you how the console defines a Narrative Bounded World, tracks structural change over time, surfaces governance-grade evidence, and supports better institutional decision-making through replay, proof, and scenario testing.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-intro-card",
      presentationMode: true,
    },
    {
      title: "Deployment posture",
      description:
        "You are starting with deployment posture so you can see immediately that this is meant to operate like a governed institutional console. The environment label, scenario context, and operating posture frame the rest of the walkthrough before you move into the core analysis surfaces.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-deployment",
      presentationMode: true,
    },
    {
      title: "Bounded world framing",
      description:
        "You are starting in Executive View so you can see the Narrative Bounded World first. In this case, the selected boundary is AI sovereignty and compute access across major jurisdictions, focused on policy, semiconductors, cloud infrastructure, export controls, and strategic classification. Inside that boundary, the key insights to watch for are tightening compute access, rising sovereign infrastructure programs, vendor concentration, and signs that AI capability is being treated less like a commercial market and more like strategic infrastructure.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-boundary",
      presentationMode: true,
    },
    {
      title: "World overview",
      description:
        "Right after the boundary, the World Overview gives you the executive briefing frame for the same environment. This is where you read the world summary, source classes, governance mode, top-line metrics, and board-level framing before moving into replay.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Structural evolution through replay",
      description:
        "Now you are looking at timeline replay. Use this to see how the world evolves month by month, where transitions occur, and how pressure accumulates through persistence instead of one-off spikes. This gives you a clearer basis for review timing, escalation timing, and leadership briefing than a static dashboard snapshot.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-timeline-replay",
      presentationMode: true,
    },
    {
      title: "Current state and HALO orientation",
      description:
        "With replay advanced, you can read the current state strip and HALO together. HALO gives you an orientation layer around pressure, motion, evidentiary mass, and instability, while the current state strip shows where the world stands now. This helps you decide whether the environment looks contained, stressed, or structurally reclassified without turning the console into an autonomous decision-maker.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-current-state",
      presentationMode: true,
    },
    {
      title: "Month-over-month change",
      description:
        "This What Changed view shows you what moved from the prior period, which artifacts contributed most, and whether the next threshold is getting closer or farther away. That makes the environment legible for executive review because you can see not only the state, but also the direction and the reasons behind the shift.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-what-changed",
      presentationMode: true,
    },
    {
      title: "Time progression mode",
      description:
        "Right after the month-over-month read, Time Progression Mode shows how the world evolves across checkpoints. This is where you track state transitions, read pressure change through time, and understand how risk escalation is changing as the scenario moves from one month band to the next.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-time-progression",
      presentationMode: true,
    },
    {
      title: "Signal monitor",
      description:
        "The Signal Monitor gives you the live watchlist underneath the broader narrative. Key Signals show what is actively carrying the read, Risks show where downside is concentrating, and Triggers show the conditions that would force a different posture or earlier review.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-signal-monitor",
      presentationMode: true,
    },
    {
      title: "How this applies to AI sovereignty",
      description:
        "In this specific AI sovereignty and compute access scenario, you would use the console to monitor whether export controls, sovereign compute programs, hyperscaler concentration, and strategic infrastructure debates are converging into a more constrained operating regime. That helps your team decide when to escalate review, revisit exposure, or prepare contingency options around compute access, vendor dependence, and jurisdictional divergence.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Governance and exports",
      description:
        "On the right side, you have the governance and export surfaces that make the console operational. This is where you can review deployment safeguards and generate briefing artifacts without leaving the workflow.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-governance",
      presentationMode: true,
    },
    {
      title: "Scenario comparison",
      description:
        "Before moving into the sandbox, you can compare this AI sovereignty world against a second bounded scenario. This helps you see whether the current phase path, transition burden, and reversibility profile are unique to this environment or whether similar structural dynamics are appearing elsewhere.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-comparison",
      presentationMode: true,
    },
    {
      title: "Proof and oversight",
      description:
        "In Oversight View, you can inspect adjudicated transitions, proof objects, review state, and audit metadata. This is where you challenge the legitimacy of a phase change, review the threshold conditions that were met, and export the record for governance or committee workflows.",
      role: "Oversight" as Role,
      month: 12,
      targetId: "demo-oversight",
      presentationMode: false,
    },
    {
      title: "What each view is for",
      description:
        "At this point, it helps to understand the four working views. Executive View is best for top-line orientation, leadership briefing, and current posture. Analyst View is where you investigate charts, artifacts, provenance, and comparison. Oversight View is where you review proof, adjudication logic, and governance state. Sandbox View is where you test remove, delay, and impact changes to see how sensitive the phase path is before you act.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-view-modes",
      presentationMode: false,
    },
    {
      title: "Counterfactual sandbox",
      description:
        "Now you are in the Counterfactual Sandbox. In this brief example, the demo will remove one artifact, add another artifact, then focus on A12 by switching it to Delay, increasing the delay to 5 months, and finally increasing impact to 2.7. That shows you that the sandbox supports both composition and sensitivity testing inside the same workflow. It is exploratory scenario analysis for decision support, not prediction and not policy prescription.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-sandbox-controls",
      presentationMode: false,
    },
    {
      title: "Scenario import",
      description:
        "Right after the sandbox, you can move into Scenario Import. This is where you bring a new bounded world or event set into the console so the same workflow can be reused for a different operating environment, client case, or internal monitoring track.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-import",
      presentationMode: false,
    },
    {
      title: "Scenario report",
      description:
        "This operational summary works like a scenario report. It brings the active world, current month, transition burden, and simulation status into one concise readout so you can communicate the current posture quickly after running a sandbox variation.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-operational-summary",
      presentationMode: false,
    },
    {
      title: "Saved views",
      description:
        "Saved Views lets you preserve the exact scenario state you want to come back to later. That is useful when your team needs to compare committee-ready snapshots, preserve a checkpoint before a briefing, or keep a high-signal sandbox path for follow-up review.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-saved-views",
      presentationMode: false,
    },
    {
      title: "Operational summary and exports",
      description:
        "Before the walkthrough closes, you can see the operational summary and export surfaces together. This is where the live state becomes reusable for a briefing, committee package, or operating handoff.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-exports",
      presentationMode: false,
    },
    {
      title: "Activity log",
      description:
        "The activity log preserves a local trail of imports, exports, proof changes, and view transitions. That gives you lightweight operating memory around how the workspace was used during the review cycle.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-activity-log",
      presentationMode: false,
    },
    {
      title: "Closing summary",
      description:
        "You have now seen how the console moves from bounded-world definition to replay, orientation, evidence, oversight, and scenario testing. The result is a more transparent and auditable way for your team to interpret a changing environment and act with stronger institutional discipline.",
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
        "Welcome. This walkthrough is designed to show you the full product flow, from Narrative Bounded World framing through analyst evidence, oversight, sandbox testing, and operational export.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-intro-card",
      presentationMode: true,
    },
    {
      title: "Deployment posture",
      description:
        "You are beginning with deployment posture so the operating context is explicit before any analysis starts. This helps you present the console as a governance-aware product rather than just a collection of dashboards.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-deployment",
      presentationMode: true,
    },
    {
      title: "Bounded world framing",
      description:
        "You are starting in Executive View so the first thing you see is the Narrative Bounded World itself. This selected boundary covers AI sovereignty and compute access across the United States, Europe, China, and adjacent infrastructure geographies, with emphasis on policy, chips, cloud, export controls, and strategic infrastructure treatment. That gives you a disciplined frame for the specific insights you want to monitor, including compute segmentation, regulatory hardening, vendor dependence, and jurisdictional divergence.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-boundary",
      presentationMode: true,
    },
    {
      title: "World overview",
      description:
        "The next stop is the World Overview. This is the executive readout for the bounded environment, where you can see summary, source classes, governance posture, and top-level metrics before stepping into how the world evolved.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Structural evolution through replay",
      description:
        "The replay advances the world through time so you can see that state has memory. Phase shifts depend on persistence, not isolated spikes. This is where you trace how policy, infrastructure, market, and sovereign artifacts accumulate into structural change over time.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-timeline-replay",
      presentationMode: true,
    },
    {
      title: "Current state and HALO orientation",
      description:
        "The current-state strip and HALO explain where the world stands now, how much instability is present, how much evidentiary mass has accumulated, and whether the environment looks contained or stressed. For you, this becomes a fast orientation read before you move into deeper analyst or oversight workflows.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-current-state",
      presentationMode: true,
    },
    {
      title: "Month-over-month change",
      description:
        "This panel explains what changed from the prior month, which artifacts are driving the move, and whether the next threshold is nearing. It helps you distinguish between noise, momentum, and real structural reclassification.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-what-changed",
      presentationMode: true,
    },
    {
      title: "Time progression mode",
      description:
        "After the month-over-month panel, Time Progression Mode shows you how the world is moving across checkpoint months. It lets you read state transitions directly, see how pressure changes through time, and judge whether risk escalation is accelerating or staying contained.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-time-progression",
      presentationMode: true,
    },
    {
      title: "Signal monitor",
      description:
        "The Signal Monitor is the live decision watchlist. It pulls Key Signals, Risks, and Triggers into one place so you can see what is carrying the current read, where the next pressure is likely to surface, and what conditions would change the operating posture.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-signal-monitor",
      presentationMode: true,
    },
    {
      title: "How this would be used in AI sovereignty",
      description:
        "In the AI sovereignty scenario, this tool helps you assess whether export-control tightening, sovereign compute build-outs, cloud concentration, and strategic reclassification pressures are creating a materially different operating environment. In practice, that can support earlier cross-functional review around supply exposure, compliance posture, vendor concentration, and regional operating options.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Right-rail governance and exports",
      description:
        "The right rail gives you governance posture and export controls in one place. This matters because the console is not only about seeing the world. It is also about preserving a governed operating record and moving insights into briefing workflows.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-governance",
      presentationMode: true,
    },
    {
      title: "Scenario comparison",
      description:
        "This comparison view shows the active AI sovereignty world against a second bounded scenario so you can see where the paths align and where they diverge. It is useful when you want to distinguish scenario-specific pressure from broader systemic patterns before testing interventions in the sandbox.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-comparison",
      presentationMode: false,
    },
    {
      title: "Analyst evidence surfaces",
      description:
        "Switching into Analyst View opens the evidence surfaces you would use for deeper investigation. Here you have charts, artifact exploration, the narrative world map, projection status, and state provenance. Together they show trend direction, relationship clustering, influence concentration, and which parts of the world are carrying the most pressure.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-analyst",
      presentationMode: false,
    },
    {
      title: "State provenance",
      description:
        "This provenance layer shows you which signals and thresholds are driving the current world state. It is where your team can separate genuine structural influence from background noise and explain the basis for the current posture more rigorously.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-provenance",
      presentationMode: false,
    },
    {
      title: "Proof and oversight",
      description:
        "Oversight View shows you that transitions are adjudicated under explicit rules and supported by proof objects that can be reviewed, challenged, annotated, and exported. This is where the console demonstrates traceability rather than black-box scoring.",
      role: "Oversight" as Role,
      month: 12,
      targetId: "demo-oversight",
      presentationMode: false,
    },
    {
      title: "What each view is for",
      description:
        "Before the sandbox, it is useful to clarify the working views. Executive View is for leadership orientation and briefing. Analyst View is for evidence review, pattern investigation, and comparison. Oversight View is for proof, auditability, and challenge. Sandbox View is for scenario testing through remove, delay, and impact adjustments.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-view-modes",
      presentationMode: false,
    },
    {
      title: "Counterfactual sandbox",
      description:
        "The sandbox closes the walkthrough with bounded sensitivity analysis. Here you can remove an artifact, delay it, or reduce its impact, compare scenarios, save views, and watch the world recompute deterministically. This helps you understand which assumptions matter most when you are preparing decisions, reviews, or contingency planning.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-sandbox-controls",
      presentationMode: false,
    },
    {
      title: "Scenario import",
      description:
        "Right after sandbox testing, Scenario Import shows that you can bring a new bounded world into the same workflow. That is useful when your team wants to move from a showcase world into a client-specific environment without changing the operating model of the console.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-import",
      presentationMode: false,
    },
    {
      title: "Scenario report",
      description:
        "This operational summary acts as a compact scenario report. It captures the active world, current phase, transition count, and simulation status in one place so the analytical output can be handed off cleanly.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-operational-summary",
      presentationMode: false,
    },
    {
      title: "Saved views",
      description:
        "Saved views allow you to preserve exact analysis states across roles and months. That becomes useful when you want to compare a baseline, an escalation point, and a sandboxed path without reconstructing each one manually.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-saved-views",
      presentationMode: false,
    },
    {
      title: "Exports and operational summary",
      description:
        "The walkthrough ends with operational summary and exports. This is where you turn the live console state into something reusable for leadership briefings, governance review, and follow-on operating cadence.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-exports",
      presentationMode: false,
    },
    {
      title: "Activity log",
      description:
        "The activity log captures imports, exports, proof updates, and movement through the console. That gives you a simple audit trail of how the workspace has been used during analysis and review.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-activity-log",
      presentationMode: false,
    },
    {
      title: "Closing summary",
      description:
        "This closes the full walkthrough. You have seen how the console supports executive orientation, analyst investigation, oversight review, and scenario planning inside a single governed operating surface.",
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
        "Welcome. This commercial walkthrough is designed to show you why the console is valuable as a high-trust institutional product: it frames a Narrative Bounded World, explains structural change, preserves auditability, and helps your team make better-informed decisions.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-intro-card",
      presentationMode: true,
    },
    {
      title: "Deployment posture",
      description:
        "You are starting with deployment posture so you can see immediately that this is designed to operate like a serious institutional system. That matters in a commercial setting because it shows the product understands governance, not just interface design.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-deployment",
      presentationMode: true,
    },
    {
      title: "Strategic operating environment",
      description:
        "You are beginning with the Narrative Bounded World so you can immediately see what operating environment is being modeled. Here, the selected boundary is AI sovereignty and compute access, spanning policy, semiconductors, compute infrastructure, cloud concentration, and export controls across major jurisdictions. For you, that means the most relevant insights are whether access is becoming more segmented, whether strategic dependence is increasing, and whether the environment is moving toward a more constrained operating regime.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-boundary",
      presentationMode: true,
    },
    {
      title: "World overview",
      description:
        "Immediately after that, the World Overview turns the boundary into an executive brief. Here you can see the summary, source classes, governance posture, and top-line state in a format that is easier to use in a leadership conversation.",
      role: "Executive" as Role,
      month: 0,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "How the environment evolves",
      description:
        "Now you are looking at replay, which is where the platform becomes useful for leadership. Instead of showing you a static point-in-time summary, it shows how pressure accumulates, when the environment begins to harden, and when the narrative world starts moving toward a different operating regime. That helps you time reviews, escalation, and contingency planning more effectively.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-timeline-replay",
      presentationMode: true,
    },
    {
      title: "Executive orientation and current posture",
      description:
        "Here you can see the current state and HALO together. This gives you a fast read on phase, momentum, instability, and evidentiary support. In practice, this is useful when you need to brief leadership quickly on whether the environment is still manageable, whether it is nearing a structural threshold, or whether it has already shifted into a more constrained regime.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-current-state",
      presentationMode: true,
    },
    {
      title: "Operational change and business relevance",
      description:
        "The What Changed panel makes the movement operational. It shows you what changed from the prior period, which artifacts are carrying the movement, and where the next threshold pressure is building. For your team, this helps connect abstract signals to actual decisions around monitoring priorities, committee review, investment timing, and exposure management.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-what-changed",
      presentationMode: true,
    },
    {
      title: "Time progression mode",
      description:
        "The next stop is Time Progression Mode. This is where you read state transitions through time, understand whether pressure is stepping higher or stabilizing, and see if risk escalation is broadening or remaining concentrated.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-time-progression",
      presentationMode: true,
    },
    {
      title: "Signal monitor",
      description:
        "Then you move into the Signal Monitor. It gives you the active Key Signals, Risks, and Triggers that sit underneath the broader executive story, so your team can separate durable structural movement from watchpoints that still need confirmation.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-signal-monitor",
      presentationMode: true,
    },
    {
      title: "How your team would use this in AI sovereignty",
      description:
        "For this AI sovereignty scenario, your team could use the console to track whether compute access is becoming more segmented across jurisdictions, whether vendor dependence is becoming riskier, and whether strategic policy alignment is starting to constrain capital, infrastructure, or partnership choices. That supports better timing around executive review, sourcing strategy, compliance preparation, and geopolitical contingency planning.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-world-overview",
      presentationMode: true,
    },
    {
      title: "Governance posture and board-readout workflow",
      description:
        "This stop brings in the governance and export surfaces. For you, this is where the product starts to look deployment-ready because it supports safeguards, briefing generation, and a repeatable operating workflow alongside the analytics.",
      role: "Executive" as Role,
      month: 12,
      targetId: "demo-governance",
      presentationMode: true,
    },
    {
      title: "Scenario comparison",
      description:
        "Before the sandbox, the comparison view shows you how this AI sovereignty world differs from another bounded scenario. In a client setting, this is useful because it demonstrates that the platform can compare structurally different environments rather than only replay a single storyline.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-comparison",
      presentationMode: false,
    },
    {
      title: "Analyst depth and structural evidence",
      description:
        "When you switch into Analyst View, you get the supporting evidence surfaces behind the executive readout. Charts, the world map, state provenance, and projection status let your team trace trend direction, identify where pressure is concentrating, and see how the current scenario ties back to the bounded world definition. This is where your analysts prepare the material that supports better decisions upstream.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-analyst",
      presentationMode: false,
    },
    {
      title: "Provenance and structural support",
      description:
        "Here you see the provenance layer that supports the executive story. It helps your team explain which artifacts, deltas, and threshold conditions are actually carrying the current state, which is essential if you want a high-trust decision-support product instead of a black-box signal feed.",
      role: "Analyst" as Role,
      month: 12,
      targetId: "demo-provenance",
      presentationMode: false,
    },
    {
      title: "Governance, proof, and auditability",
      description:
        "Oversight View is where you demonstrate institutional discipline. Every transition is backed by an adjudicated proof object, threshold logic, review state, and exportable audit record. That means when your organization acts on the output, it can explain why the environment was interpreted the way it was and what evidence supported that interpretation.",
      role: "Oversight" as Role,
      month: 12,
      targetId: "demo-oversight",
      presentationMode: false,
    },
    {
      title: "What each view is for",
      description:
        "Before you enter the sandbox, the four views map to four different jobs. Executive View supports leadership orientation. Analyst View supports investigation and comparison. Oversight View supports governance and proof review. Sandbox View supports structured what-if testing through remove, delay, and impact controls.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-view-modes",
      presentationMode: false,
    },
    {
      title: "Scenario testing for decision support",
      description:
        "The final stop is the Sandbox. Here you can remove a signal, delay it, or reduce its impact and watch the world recompute deterministically. This is especially valuable when you want to understand whether your current posture depends on one key artifact or whether the environment remains structurally stressed even under alternative assumptions. That gives you a more grounded basis for planning and resource allocation.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-sandbox-controls",
      presentationMode: false,
    },
    {
      title: "Scenario import",
      description:
        "Right after sandbox testing, Scenario Import shows that the platform can take in a new bounded world and reuse the same governed workflow. That is important commercially because it shows you are not locked into one canned scenario or one static storyline.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-import",
      presentationMode: false,
    },
    {
      title: "Scenario report and saved views",
      description:
        "After running a sandbox variation, the scenario report and saved views let you preserve the resulting posture and compare it against other checkpoints. That turns the sandbox from a one-off exploration into a reusable operating artifact.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-operational-summary",
      presentationMode: false,
    },
    {
      title: "Saved views",
      description:
        "Saved views help your team keep the exact states that matter most, whether that is a base case, an adverse case, or a board-ready snapshot of the current environment.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-saved-views",
      presentationMode: false,
    },
    {
      title: "Operational handoff and exports",
      description:
        "The final handoff is where you convert the current state into exports and summaries that your organization can actually reuse after the meeting ends. This is the point where the console stops being a demo and starts looking like a real operating tool.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-exports",
      presentationMode: false,
    },
    {
      title: "Activity log",
      description:
        "The activity log gives you a lightweight history of how the console was used during the working session. That helps reinforce that this is not just a visual experience, but an operating workspace with memory.",
      role: "Sandbox" as Role,
      month: 12,
      targetId: "demo-activity-log",
      presentationMode: false,
    },
    {
      title: "Closing summary",
      description:
        "That completes the commercial walkthrough. What you have seen is not just a visualization layer, but a governed system for turning structural signals into evidence-backed operational understanding your organization can actually use.",
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
      setAutoDemoSandboxMessage("Demo setup: starting with two visible artifacts, A10 and A12.");
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
          setAutoDemoSandboxMessage("Demo step 1: Removing artifact A10.");
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
          setAutoDemoSandboxMessage("Demo step 2: Adding artifact A13 to show you can add rows as well.");
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
          setAutoDemoSandboxMessage("Demo step 3: Switching to artifact A12 and changing type to Delay.");
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
          setAutoDemoSandboxMessage("Demo step 4: Increasing the delay on A12 to 5 months.");
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
          setAutoDemoSandboxMessage("Demo step 5: Increasing A12 impact to 2.7.");
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
    logActivity("view_changed", "Auto demo", `Started step ${autoDemoStepIndex + 1}: ${step.title}.`);

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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between xl:gap-4">
              <div>
                <p className="section-kicker">Narrative World Modeling Console</p>
                <h1 className="mt-1.5 text-2xl font-semibold md:text-[1.75rem] xl:mt-2 xl:text-3xl">NWM Console</h1>
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted md:max-w-2xl xl:mt-2">
                  {selectedScenario.description} Traceable orientation, adjudicated transitions, and bounded scenario review for institutional operators.
                </p>
              </div>
              <div className="surface-panel-subtle hidden gap-2 px-4 py-3 text-sm lg:grid lg:min-w-[320px] xl:min-w-[360px]">
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
                  <span className="text-muted">Demo ready</span>
                  <span className={isDemoReady ? "text-phaseYellow" : "text-ink"}>
                    {isDemoReady ? "Ready" : "Check state"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="segmented-control">
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
                Guided Demo
              </button>
              <button
                className="action-button"
                onClick={() => setAutoDemoOpen(true)}
              >
                Auto Demo
              </button>
              <button
                className="action-button"
                onClick={resetDemoState}
              >
                Reset Demo State
              </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between xl:justify-end">
                <div className="surface-panel-subtle text-sm text-muted lg:flex-1 xl:flex-none">
                  <p>
                    Demo readiness:{" "}
                    <span className={isDemoReady ? "text-phaseYellow" : "text-ink"}>
                      {isDemoReady
                        ? "Ready to present"
                        : `Set Executive View, Presentation Mode, Month 0, AI Sovereignty scenario${
                            hasNarrationReady ? "" : ", and valid narration configuration"
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
            role === "Executive" && presentationMode ? "xl:grid-cols-[minmax(0,1fr)_300px]" : "xl:grid-cols-[minmax(0,1fr)_360px]"
          }`}
        >
          <div className="space-y-5">
          {autoDemoOpen ? (
            <section
              id="demo-intro-card"
              style={{ scrollMarginTop: "140px" }}
              className={demoSectionClassName("demo-intro-card")}
            >
              <div className="surface-panel">
                <p className="section-kicker">Auto Demo</p>
                <h2 className="section-title">Narrative World Modeling Walkthrough</h2>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
                  This guided presentation will walk you through Narrative Bounded World definition, structural replay, current orientation, oversight evidence, and counterfactual scenario testing using the active demo script.
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

          <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
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
                  <p>Narration engine: <span className="text-ink">OpenAI-enhanced</span></p>
                  {role === "Executive" ? <p>Presentation mode: <span className="text-ink">{presentationMode ? "Yes" : "No"}</span></p> : null}
                  <p>Keyboard shortcuts: <span className="text-ink">Left/Right month, G guided demo, S sandbox</span></p>
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
