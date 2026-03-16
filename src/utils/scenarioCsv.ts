import type { NarrativeEvent, ScenarioDataset, SourceType, StructuralEffect, WorldDefinition } from "../types";

export const scenarioCsvHeaders = [
  "world_name",
  "world_domain",
  "world_geography",
  "time_horizon_months",
  "governance_mode",
  "source_classes",
  "bounded_description",
  "world_summary",
  "event_id",
  "month",
  "label",
  "title",
  "description",
  "source_type",
  "domain_tags",
  "structural_effect",
  "velocity",
  "density",
  "coherence",
  "reversibility",
  "phase",
  "halo_color",
] as const;

type CsvHeader = (typeof scenarioCsvHeaders)[number];
type CsvRow = Record<CsvHeader, string>;

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
};

export const parseScenarioCsv = (csv: string): CsvRow[] => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]) as CsvHeader[];
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {} as CsvRow;
    scenarioCsvHeaders.forEach((header, index) => {
      row[header] = values[headers.indexOf(header)] ?? values[index] ?? "";
    });
    return row;
  });
};

export const scenarioDatasetFromCsvRows = (rows: CsvRow[]): ScenarioDataset => {
  if (rows.length === 0) {
    throw new Error("No CSV rows were provided.");
  }

  const first = rows[0];
  const world: WorldDefinition = {
    name: first.world_name,
    domain: first.world_domain,
    geography: first.world_geography,
    timeHorizonMonths: Number(first.time_horizon_months),
    governanceMode: first.governance_mode as WorldDefinition["governanceMode"],
    boundedDescription: first.bounded_description,
    summary: first.world_summary,
    sourceClasses: first.source_classes.split("|").map((entry) => entry.trim()).filter(Boolean),
  };

  const events: NarrativeEvent[] = rows.map((row) => ({
    id: row.event_id,
    month: Number(row.month),
    label: row.label,
    title: row.title,
    description: row.description,
    sourceType: row.source_type as SourceType,
    domainTags: row.domain_tags.split("|").map((entry) => entry.trim()).filter(Boolean),
    structuralEffect: row.structural_effect as StructuralEffect,
    metrics: {
      velocity: Number(row.velocity),
      density: Number(row.density),
      coherence: Number(row.coherence),
      reversibility: Number(row.reversibility),
    },
    phase: row.phase,
    haloColor: row.halo_color,
  }));

  return {
    world,
    events: events.sort((left, right) => left.month - right.month),
  };
};
