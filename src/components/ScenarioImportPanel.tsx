import { useState } from "react";
import type { ScenarioDefinition } from "../types";
import { loadScenarioDataset } from "../data/schema";
import { buildScenarioFromSource, type SourceEventSet, type SourceWorldDefinition } from "../utils/sourceScenario";
import { validateScenarioDataset } from "../utils/scenarioValidation";

interface ScenarioImportPanelProps {
  importedScenarios: ScenarioDefinition[];
  onImport: (scenario: ScenarioDefinition) => void;
  onDelete: (scenarioId: string) => void;
  onExport: (scenarioId: string) => void;
}

type ImportMode = "scenario" | "world-events";

const parseJsonFile = async <T,>(file: File) => JSON.parse(await file.text()) as T;

export function ScenarioImportPanel({ importedScenarios, onImport, onDelete, onExport }: ScenarioImportPanelProps) {
  const [mode, setMode] = useState<ImportMode>("world-events");
  const [scenarioFile, setScenarioFile] = useState<File | null>(null);
  const [worldFile, setWorldFile] = useState<File | null>(null);
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("Upload a ready scenario JSON or a world JSON plus event-set JSON.");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleImport = async () => {
    try {
      setError(null);
      if (mode === "scenario") {
        if (!scenarioFile) {
          throw new Error("Choose a scenario JSON file first.");
        }
        const raw = await parseJsonFile<unknown>(scenarioFile);
        const dataset = loadScenarioDataset(raw);
        setWarnings(validateScenarioDataset(dataset).warnings);
        const scenario: ScenarioDefinition = {
          id: `imported-${Date.now()}`,
          label: dataset.world.name,
          description: dataset.world.summary,
          dataset,
        };
        onImport(scenario);
        setStatus(`Imported scenario: ${scenario.label}`);
        return;
      }

      if (!worldFile || !eventFile) {
        throw new Error("Choose both a world JSON file and an event-set JSON file first.");
      }

      const world = await parseJsonFile<SourceWorldDefinition>(worldFile);
      const eventSet = await parseJsonFile<SourceEventSet>(eventFile);
      const dataset = loadScenarioDataset(buildScenarioFromSource(world, eventSet));
      setWarnings(validateScenarioDataset(dataset).warnings);
      const scenario: ScenarioDefinition = {
        id: `imported-${Date.now()}`,
        label: dataset.world.name,
        description: dataset.world.summary,
        dataset,
      };
      onImport(scenario);
      setStatus(`Imported source world: ${scenario.label}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Import failed.";
      setError(message);
      setStatus("Import failed.");
      setWarnings([]);
    }
  };

  return (
    <section className="surface-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Scenario Import</p>
          <p className="mt-2 text-sm text-muted">
            Upload either an app-ready scenario JSON or a raw world JSON plus event-set JSON.
          </p>
        </div>
        <div className="segmented-control">
          <button
            className={`rounded-md border px-3 py-2 text-sm ${mode === "world-events" ? "border-muted bg-shell text-ink" : "border-edge/70 text-muted"}`}
            onClick={() => setMode("world-events")}
          >
            World + Events
          </button>
          <button
            className={`rounded-md border px-3 py-2 text-sm ${mode === "scenario" ? "border-muted bg-shell text-ink" : "border-edge/70 text-muted"}`}
            onClick={() => setMode("scenario")}
          >
            Scenario JSON
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {mode === "scenario" ? (
          <label className="control-stack">
            <span className="control-label">Scenario file</span>
            <input
              className="control-input"
              type="file"
              accept="application/json"
              onChange={(event) => setScenarioFile(event.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="control-stack">
              <span className="control-label">World source file</span>
              <input
                className="control-input"
                type="file"
                accept="application/json"
                onChange={(event) => setWorldFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="control-stack">
              <span className="control-label">Event set file</span>
              <input
                className="control-input"
                type="file"
                accept="application/json"
                onChange={(event) => setEventFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button className="action-button" onClick={handleImport}>
          Import Scenario
        </button>
        <p className="text-sm text-muted">{status}</p>
      </div>

      {error ? <p className="mt-3 text-sm text-phaseRed">{error}</p> : null}
      {warnings.length > 0 ? (
        <div className="surface-panel-subtle mt-4 p-4">
          <p className="section-kicker">Validation warnings</p>
          <div className="mt-3 space-y-2 text-sm text-muted">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="section-kicker">Imported scenarios</p>
        <div className="mt-3 space-y-2">
          {importedScenarios.length > 0 ? (
            importedScenarios.map((scenario) => (
              <div key={scenario.id} className="surface-panel-subtle flex items-center justify-between gap-3 p-3">
                <div className="text-sm">
                  <p className="text-ink">{scenario.label}</p>
                  <p className="mt-1 text-muted">{scenario.dataset.events.length} events</p>
                </div>
                <div className="flex gap-2">
                  <button className="action-button" onClick={() => onExport(scenario.id)}>
                    Export
                  </button>
                  <button className="action-button" onClick={() => onDelete(scenario.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No imported scenarios yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
