import type {
  NarrativeEvent,
  ScenarioDataset,
  SourceType,
  StructuralEffect,
  WorldDefinition,
} from "../types";

export interface SourceWorldDefinition {
  world_id: string;
  world_name: string;
  world_description: string;
  scope_boundaries?: {
    included_domains?: string[];
    excluded_domains?: string[];
  };
  key_actors?: string[];
  key_institutions?: string[];
  key_geographies?: string[];
  key_infrastructures?: string[];
  primary_tensions?: string[];
  time_horizon?: string;
  signal_types?: string[];
  initial_assumptions?: string[];
  analyst_notes?: string;
}

export interface SourceEventRecord {
  event_id: string;
  event_title: string;
  event_type: string;
  event_date: string;
  description: string;
  source: string;
  confidence_level: string;
  affected_actors?: string[];
  affected_domains?: string[];
  narrative_significance?: string;
  severity_level?: string;
  tags?: string[];
}

export interface SourceEventSet {
  event_set_id: string;
  world_id: string;
  events: SourceEventRecord[];
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

const mapSourceType = (eventType: string): SourceType => {
  const normalized = eventType.toLowerCase();
  if (normalized.includes("regulation")) {
    return "legal";
  }
  if (normalized.includes("policy")) {
    return "policy";
  }
  if (normalized.includes("infrastructure")) {
    return "infrastructure";
  }
  if (normalized.includes("sovereign")) {
    return "sovereign";
  }
  if (normalized.includes("market")) {
    return "market";
  }
  return "media";
};

const mapStructuralEffect = (event: SourceEventRecord): StructuralEffect => {
  const text = `${event.event_title} ${event.narrative_significance ?? ""} ${event.event_type}`.toLowerCase();
  if (
    text.includes("reclassification") ||
    text.includes("classifying") ||
    text.includes("strategic") ||
    text.includes("sovereignty") ||
    text.includes("export control")
  ) {
    return "reclassify";
  }
  if ((event.severity_level ?? "").toLowerCase() === "medium" || (event.severity_level ?? "").toLowerCase() === "high") {
    return "destabilize";
  }
  return "reinforce";
};

const monthDiff = (baseDate: Date, eventDate: Date) =>
  (eventDate.getUTCFullYear() - baseDate.getUTCFullYear()) * 12 + (eventDate.getUTCMonth() - baseDate.getUTCMonth());

const inferMetrics = (event: SourceEventRecord, index: number, structuralEffect: StructuralEffect) => {
  const severity = (event.severity_level ?? "low").toLowerCase();
  const confidence = (event.confidence_level ?? "medium").toLowerCase();
  const severityBase = severity === "high" ? 66 : severity === "medium" ? 54 : 40;
  const coherenceBase = confidence === "high" ? 58 : confidence === "medium" ? 48 : 40;
  const structuralBoost = structuralEffect === "reclassify" ? 10 : structuralEffect === "destabilize" ? 6 : 2;

  return {
    velocity: clamp(severityBase + index * 1.5 + (structuralEffect === "destabilize" ? 6 : 0)),
    density: clamp(severityBase - 4 + structuralBoost + index * 2.5),
    coherence: clamp(coherenceBase + (structuralEffect === "reclassify" ? 8 : 0) + index * 1.5),
    reversibility: clamp(
      78 -
        (severity === "high" ? 28 : severity === "medium" ? 18 : 8) -
        (structuralEffect === "reclassify" ? 14 : structuralEffect === "destabilize" ? 9 : 3) -
        index * 2.5,
      8,
      90,
    ),
  };
};

const inferPhase = (metrics: NarrativeEvent["metrics"]) => {
  if (metrics.density >= 69 && metrics.coherence >= 45 && metrics.reversibility <= 30) {
    return { phase: "Fragmented Regime", haloColor: "#645091" };
  }
  if (metrics.density >= 57 && metrics.coherence >= 45 && metrics.reversibility <= 38) {
    return { phase: "Structural Reclassification", haloColor: "#a94646" };
  }
  if (metrics.velocity >= 50 && metrics.density >= 46) {
    return { phase: "Escalation Edge", haloColor: "#c76c2d" };
  }
  return { phase: "Escalating", haloColor: "#d5b349" };
};

const buildWorldDefinition = (world: SourceWorldDefinition, events: SourceEventRecord[]): WorldDefinition => {
  const firstDate = events[0] ? new Date(events[0].event_date) : new Date();
  const lastDate = events[events.length - 1] ? new Date(events[events.length - 1].event_date) : firstDate;
  const horizon = Math.max(18, monthDiff(firstDate, lastDate) + 6);

  return {
    name: world.world_name,
    domain:
      world.scope_boundaries?.included_domains?.join(", ") ??
      "AI governance, compute infrastructure, and sovereignty signals",
    geography: world.key_geographies?.join(" / ") ?? "Multi-jurisdiction",
    timeHorizonMonths: horizon,
    governanceMode: "Institutional",
    boundedDescription: [
      world.world_description,
      world.scope_boundaries?.included_domains?.length
        ? `Included domains: ${world.scope_boundaries.included_domains.join(", ")}.`
        : "",
      world.scope_boundaries?.excluded_domains?.length
        ? `Excluded domains: ${world.scope_boundaries.excluded_domains.join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    summary: [
      world.analyst_notes ?? "",
      world.primary_tensions?.length ? `Primary tensions: ${world.primary_tensions.join("; ")}.` : "",
      world.initial_assumptions?.length ? `Initial assumptions: ${world.initial_assumptions.join("; ")}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    sourceClasses: ["policy", "legal", "market", "infrastructure", "sovereign"],
  };
};

export const buildScenarioFromSource = (
  world: SourceWorldDefinition,
  eventSet: SourceEventSet,
): ScenarioDataset => {
  const sortedSourceEvents = [...eventSet.events].sort((left, right) => left.event_date.localeCompare(right.event_date));
  const firstDate = sortedSourceEvents[0] ? new Date(sortedSourceEvents[0].event_date) : new Date();
  let lastMonth = 0;

  const events: NarrativeEvent[] = [
    {
      id: "T0",
      month: 0,
      label: "T0",
      title: "Baseline Bounded World Assumption",
      description: "Baseline state generated from the imported world definition before narrative pressure accumulates.",
      sourceType: "market",
      domainTags: ["baseline", "bounded-world"],
      structuralEffect: "reinforce",
      metrics: { velocity: 18, density: 22, coherence: 52, reversibility: 78 },
      phase: "Escalating",
      haloColor: "#d5b349",
    },
    ...sortedSourceEvents.map((event, index) => {
      const eventDate = new Date(event.event_date);
      const inferredMonth = Math.max(lastMonth + 1, monthDiff(firstDate, eventDate) + 1);
      lastMonth = inferredMonth;
      const structuralEffect = mapStructuralEffect(event);
      const metrics = inferMetrics(event, index + 1, structuralEffect);
      const { phase, haloColor } = inferPhase(metrics);

      return {
        id: event.event_id,
        month: inferredMonth,
        label: `A${index + 1}`,
        title: event.event_title,
        description: event.description,
        sourceType: mapSourceType(event.event_type),
        domainTags: [...(event.affected_domains ?? []), ...(event.tags ?? [])]
          .map((entry) => entry.trim())
          .filter(Boolean),
        structuralEffect,
        metrics,
        phase,
        haloColor,
      } satisfies NarrativeEvent;
    }),
  ];

  return {
    world: buildWorldDefinition(world, sortedSourceEvents),
    events,
  };
};
