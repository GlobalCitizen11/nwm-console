import type { ScenarioDataset } from "../types";

export interface ScenarioValidationReport {
  warnings: string[];
}

export const validateScenarioDataset = (dataset: ScenarioDataset): ScenarioValidationReport => {
  const warnings: string[] = [];
  const ids = new Set<string>();
  let lastMonth = -1;

  dataset.events.forEach((event, index) => {
    if (ids.has(event.id)) {
      warnings.push(`Duplicate event id detected: ${event.id}`);
    }
    ids.add(event.id);

    if (event.month < lastMonth) {
      warnings.push(`Event order is non-monotonic near ${event.id}.`);
    }
    lastMonth = event.month;

    if (event.domainTags.length === 0) {
      warnings.push(`Event ${event.id} has no domain tags.`);
    }

    if (index > 0 && event.month === dataset.events[index - 1].month) {
      warnings.push(`Multiple events share month ${event.month}; ensure this is intentional.`);
    }

    if (event.metrics.reversibility > 80 && event.structuralEffect === "reclassify") {
      warnings.push(`Event ${event.id} is marked reclassify but remains highly reversible.`);
    }
  });

  if (dataset.events.length < 4) {
    warnings.push("Scenario has fewer than four events; replay and phase progression may be weak.");
  }

  if (!dataset.world.sourceClasses || dataset.world.sourceClasses.length === 0) {
    warnings.push("World definition has no source classes listed.");
  }

  return { warnings };
};
