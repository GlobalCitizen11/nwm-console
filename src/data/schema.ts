import { z } from "zod";
import type { ScenarioDataset } from "../types";

const narrativeEventSchema = z.object({
  id: z.string(),
  month: z.number().int().min(0),
  label: z.string(),
  title: z.string(),
  description: z.string(),
  sourceType: z.enum(["policy", "media", "market", "legal", "infrastructure", "sovereign"]),
  domainTags: z.array(z.string()).min(1),
  structuralEffect: z.enum(["reinforce", "destabilize", "reclassify"]),
  metrics: z.object({
    velocity: z.number().min(0).max(100),
    density: z.number().min(0).max(100),
    coherence: z.number().min(0).max(100),
    reversibility: z.number().min(0).max(100),
  }),
  phase: z.string(),
  haloColor: z.string(),
});

const scenarioSchema = z.object({
  world: z.object({
    name: z.string(),
    domain: z.string(),
    geography: z.string(),
    timeHorizonMonths: z.number().int().min(1),
    governanceMode: z.enum(["Demo", "Institutional", "Public-grade"]),
    boundedDescription: z.string(),
    summary: z.string(),
    sourceClasses: z.array(z.string()).optional(),
  }),
  events: z.array(narrativeEventSchema).min(1),
});

export const loadScenarioDataset = (raw: unknown): ScenarioDataset => {
  const parsed = scenarioSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Scenario dataset validation failed: ${details}`);
  }

  const sortedEvents = [...parsed.data.events].sort((left, right) => left.month - right.month);
  return {
    world: parsed.data.world,
    events: sortedEvents,
  };
};
