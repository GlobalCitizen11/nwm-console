import worldSource from "./aiSovereigntyWorldSource.json";
import eventSource from "./aiSovereigntyInitialEvents.json";
import type { ScenarioDataset } from "../types";
import { buildScenarioFromSource } from "../utils/sourceScenario";

const seededContinuation: ScenarioDataset["events"] = [
  {
    id: "A5",
    month: 6,
    label: "A5",
    title: "Strategic Compute Capacity Disclosure Requirement",
    description:
      "Operators of large training clusters are required to disclose material capacity and high-scale compute concentration above reporting thresholds.",
    sourceType: "legal",
    domainTags: ["compute-clusters", "disclosure", "oversight"],
    structuralEffect: "reclassify",
    metrics: { velocity: 51, density: 58, coherence: 49, reversibility: 42 },
    phase: "Escalation Edge",
    haloColor: "#c76c2d",
  },
  {
    id: "A6",
    month: 7,
    label: "A6",
    title: "Sovereign AI Compute Reserve Announcement",
    description:
      "A major jurisdiction announces a sovereign compute reserve, signaling that strategic model capacity is no longer treated as an interchangeable commercial input.",
    sourceType: "sovereign",
    domainTags: ["sovereign", "compute", "reserve"],
    structuralEffect: "reclassify",
    metrics: { velocity: 57, density: 62, coherence: 52, reversibility: 39 },
    phase: "Escalation Edge",
    haloColor: "#c76c2d",
  },
  {
    id: "A7",
    month: 8,
    label: "A7",
    title: "Hyperscaler Region Locking Policy",
    description:
      "A hyperscaler adds region-locked model training and checkpoint handling language for certain cross-border enterprise workloads.",
    sourceType: "infrastructure",
    domainTags: ["cloud", "region-locking", "models"],
    structuralEffect: "destabilize",
    metrics: { velocity: 62, density: 65, coherence: 41, reversibility: 34 },
    phase: "Escalation Edge",
    haloColor: "#c76c2d",
  },
  {
    id: "A8",
    month: 10,
    label: "A8",
    title: "General-Purpose AI Obligations Enter Force",
    description:
      "Staged governance obligations for general-purpose AI models begin to apply, tightening operational expectations around capability governance and supply chain accountability.",
    sourceType: "legal",
    domainTags: ["gpai", "compliance", "governance"],
    structuralEffect: "reclassify",
    metrics: { velocity: 58, density: 69, coherence: 57, reversibility: 30 },
    phase: "Structural Reclassification",
    haloColor: "#a94646",
  },
  {
    id: "A9",
    month: 11,
    label: "A9",
    title: "Model Export Screening Mechanism Leak",
    description:
      "A leaked screening mechanism suggests future review of high-capability model export and cross-border model serving arrangements.",
    sourceType: "policy",
    domainTags: ["model-export", "screening", "alignment"],
    structuralEffect: "reclassify",
    metrics: { velocity: 61, density: 72, coherence: 60, reversibility: 27 },
    phase: "Structural Reclassification",
    haloColor: "#a94646",
  },
  {
    id: "A10",
    month: 12,
    label: "A10",
    title: "Compute Access Risk Added to Vendor Assessments",
    description:
      "Enterprise and financial due-diligence frameworks begin to add compute access and jurisdictional dependency risk to supplier review models.",
    sourceType: "market",
    domainTags: ["vendors", "risk", "dependency"],
    structuralEffect: "reclassify",
    metrics: { velocity: 60, density: 74, coherence: 63, reversibility: 25 },
    phase: "Structural Reclassification",
    haloColor: "#a94646",
  },
  {
    id: "A11",
    month: 14,
    label: "A11",
    title: "Advanced Packaging Supply Shock",
    description:
      "A packaging and interconnect supply shock reinforces the narrative that advanced AI capacity is vulnerable to concentrated geopolitical chokepoints.",
    sourceType: "market",
    domainTags: ["packaging", "supply-shock", "hardware"],
    structuralEffect: "destabilize",
    metrics: { velocity: 67, density: 77, coherence: 50, reversibility: 21 },
    phase: "Structural Reclassification",
    haloColor: "#a94646",
  },
  {
    id: "A12",
    month: 15,
    label: "A12",
    title: "Retaliatory Cloud Localization Mandate",
    description:
      "A retaliatory localization response forces certain model training and inference workloads into jurisdiction-specific infrastructure channels.",
    sourceType: "sovereign",
    domainTags: ["localization", "cloud", "retaliation"],
    structuralEffect: "destabilize",
    metrics: { velocity: 71, density: 80, coherence: 45, reversibility: 18 },
    phase: "Fragmented Regime",
    haloColor: "#645091",
  },
  {
    id: "A13",
    month: 16,
    label: "A13",
    title: "AI Infrastructure Insurance Repricing",
    description:
      "Insurance and contractual terms begin to reflect persistent jurisdictional fragmentation and elevated operational dependence on bounded compute pathways.",
    sourceType: "market",
    domainTags: ["insurance", "infrastructure", "repricing"],
    structuralEffect: "reclassify",
    metrics: { velocity: 64, density: 82, coherence: 66, reversibility: 15 },
    phase: "Fragmented Regime",
    haloColor: "#645091",
  },
  {
    id: "A14",
    month: 18,
    label: "A14",
    title: "Bloc-Aligned Compute Access Doctrine",
    description:
      "A formal doctrine links AI compute access, sovereign alignment, and trusted infrastructure, locking in a fragmented cross-border operating environment.",
    sourceType: "sovereign",
    domainTags: ["doctrine", "compute-access", "trusted-infrastructure"],
    structuralEffect: "reclassify",
    metrics: { velocity: 59, density: 85, coherence: 69, reversibility: 11 },
    phase: "Fragmented Regime",
    haloColor: "#645091",
  },
];

const importedBase = buildScenarioFromSource(worldSource, eventSource);

export const aiSovereigntyScenario: ScenarioDataset = {
  world: importedBase.world,
  events: [...importedBase.events, ...seededContinuation],
};

export default aiSovereigntyScenario;
