import type {
  CounterfactualOperation,
  CounterfactualScenario,
  NamedCounterfactualScenario,
  NarrativeEvent,
  SimulationResult,
} from "../types";
import { SYSTEM_LABELS } from "../lib/systemLabels";
import { SectionAudioControl } from "./SectionAudioControl";

interface CounterfactualSandboxProps {
  events: NarrativeEvent[];
  baseResult: SimulationResult;
  scenarioResult: SimulationResult;
  worldBoundaryContext: string;
  demoHighlightControls?: boolean;
  demoControlMessage?: string | null;
  demoActiveArtifactId?: string | null;
  draftScenario: CounterfactualScenario;
  savedScenarios: NamedCounterfactualScenario[];
  selectedScenarioId: string | null;
  onDraftScenarioChange: (scenario: CounterfactualScenario) => void;
  onSavedScenariosChange: (scenarios: NamedCounterfactualScenario[]) => void;
  onSelectedScenarioIdChange: (scenarioId: string | null) => void;
}

export function CounterfactualSandbox({
  events,
  baseResult,
  scenarioResult,
  worldBoundaryContext,
  demoHighlightControls = false,
  demoControlMessage = null,
  demoActiveArtifactId = null,
  draftScenario,
  savedScenarios,
  selectedScenarioId,
  onDraftScenarioChange,
  onSavedScenariosChange,
  onSelectedScenarioIdChange,
}: CounterfactualSandboxProps) {
  const currentScenario = draftScenario;

  const addOperation = () => {
    const usedIds = new Set(currentScenario.map((operation) => operation.eventId));
    const available = events.find((event) => !usedIds.has(event.id)) ?? events[0];
    if (!available) {
      return;
    }
    onDraftScenarioChange([
      ...currentScenario,
      {
        eventId: available.id,
        mode: "remove",
        delayMonths: 2,
        strengthMultiplier: 0.65,
      },
    ]);
  };

  const updateOperation = (index: number, partial: Partial<CounterfactualOperation>) => {
    onDraftScenarioChange(
      currentScenario.map((operation, candidateIndex) =>
        candidateIndex === index ? { ...operation, ...partial } : operation,
      ),
    );
  };

  const removeOperation = (index: number) => {
    onDraftScenarioChange(currentScenario.filter((_, candidateIndex) => candidateIndex !== index));
  };

  const saveScenario = () => {
    if (currentScenario.length === 0) {
      return;
    }
    const nextScenario: NamedCounterfactualScenario = {
      id: selectedScenarioId ?? `scenario-${Date.now()}`,
      name: `Scenario ${savedScenarios.length + 1}`,
      operations: currentScenario,
    };
    const existingIndex = savedScenarios.findIndex((scenario) => scenario.id === nextScenario.id);
    const nextSaved =
      existingIndex >= 0
        ? savedScenarios.map((scenario, index) => (index === existingIndex ? nextScenario : scenario))
        : [...savedScenarios, nextScenario];
    onSavedScenariosChange(nextSaved);
    onSelectedScenarioIdChange(nextScenario.id);
  };

  const loadScenario = (scenarioId: string) => {
    const selected = savedScenarios.find((scenario) => scenario.id === scenarioId);
    onSelectedScenarioIdChange(scenarioId || null);
    onDraftScenarioChange(selected?.operations ?? []);
  };

  const renameScenario = (scenarioId: string, name: string) => {
    onSavedScenariosChange(
      savedScenarios.map((scenario) => (scenario.id === scenarioId ? { ...scenario, name } : scenario)),
    );
  };

  const basePhases = baseResult.timeline.map((point) => point.phase).join(" > ");
  const scenarioPhases = scenarioResult.timeline.map((point) => point.phase).join(" > ");
  const pathChanged = basePhases !== scenarioPhases;
  const removedTransitions = baseResult.transitions.filter(
    (transition) =>
      !scenarioResult.transitions.some(
        (candidate) => candidate.month === transition.month && candidate.toPhase === transition.toPhase,
      ),
  );
  const addedTransitions = scenarioResult.transitions.filter(
    (transition) =>
      !baseResult.transitions.some(
        (candidate) => candidate.month === transition.month && candidate.toPhase === transition.toPhase,
      ),
  );
  const latestBase = baseResult.timeline[baseResult.timeline.length - 1];
  const latestScenario = scenarioResult.timeline[scenarioResult.timeline.length - 1];

  return (
    <section className="surface-panel">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker">{SYSTEM_LABELS.PROTOSTAR}</p>
            <h3 className="section-title">Exploratory scenario testing workspace</h3>
            <p className="mt-2 text-sm text-muted">
              The Simulation Engine supports bounded scenario testing by stacking multiple artifact changes. Read it as structured exploration under explicit assumptions.
            </p>
          </div>
          <SectionAudioControl
            sectionTitle="Counterfactual Sandbox"
            worldBoundaryContext={worldBoundaryContext}
            summary="The Simulation Engine lets users build bounded exploratory scenarios and compare them against the base world."
            currentState={`The sandbox currently has ${currentScenario.length} active artifact changes and ${savedScenarios.length} saved scenarios. The selected saved scenario is ${selectedScenarioId ?? "draft scenario"}. ${pathChanged ? "The current scenario is changing the phase path relative to the base world." : "The current scenario is not materially changing the phase path relative to the base world."}`}
            businessUse="This section helps reveal which artifacts materially alter the structural path."
            decisionGuidance="Use it to compare sensitivity across assumptions before the read moves into planning or review."
            rawContext={[
              `Active operations: ${currentScenario.map((operation) => `${operation.eventId} ${operation.mode} delay ${operation.delayMonths} strength ${operation.strengthMultiplier}`).join(" | ") || "none"}`,
              `Saved scenarios: ${savedScenarios.map((scenario) => scenario.name).join(" | ") || "none"}`,
              `Base phase path: ${basePhases}`,
              `Scenario phase path: ${scenarioPhases}`,
              `Path changed: ${pathChanged ? "yes" : "no"}`,
            ]}
          />
        </div>
      </div>

      <div className="surface-panel-subtle p-4">
        <p className="section-kicker">How to use it</p>
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p>1. Add one or more artifact changes to your scenario.</p>
          <p>2. Choose whether each artifact is removed, delayed, or weakened.</p>
          <p>3. Compare the resulting phase path against the base world.</p>
          <p>4. Clear the scenario to return to the unmodified replay.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Scenario impact summary</p>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>
              Base final phase: <span className="text-ink">{latestBase.phase}</span>
            </p>
            <p>
              Scenario final phase: <span className="text-ink">{latestScenario.phase}</span>
            </p>
            <p>
              Phase path changed: <span className="text-ink">{pathChanged ? "Yes" : "No"}</span>
            </p>
            <p>
              Removed transitions: <span className="text-ink">{removedTransitions.length}</span>
            </p>
            <p>
              Added transitions: <span className="text-ink">{addedTransitions.length}</span>
            </p>
          </div>
        </div>
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">What changed structurally</p>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>
              Instability: <span className="text-ink">{latestBase.halo.instability} {"->"} {latestScenario.halo.instability}</span>
            </p>
            <p>
              Density: <span className="text-ink">{latestBase.metrics.density} {"->"} {latestScenario.metrics.density}</span>
            </p>
            <p>
              Reversibility: <span className="text-ink">{latestBase.metrics.reversibility} {"->"} {latestScenario.metrics.reversibility}</span>
            </p>
            <p>
              Interpretation: <span className="text-ink">{pathChanged ? "This scenario materially alters the structural path." : "This scenario perturbs the world but does not reopen the phase path."}</span>
            </p>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 surface-panel-subtle p-4 ${demoHighlightControls ? "demo-highlight-panel" : ""}`}
        id="demo-sandbox-controls"
        style={{ scrollMarginTop: "140px" }}
      >
        {demoHighlightControls ? (
          <div className="mb-3 rounded-md border border-phaseYellow/60 bg-shell/80 px-3 py-2 text-sm text-ink">
            {demoControlMessage ?? "The walkthrough is adjusting this artifact row through remove, delay, and impact changes."}
          </div>
        ) : null}
        <div className="grid items-end gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <label className="control-stack">
            <span className="control-label">Saved scenario</span>
            <select
              className="control-input"
              value={selectedScenarioId ?? ""}
              onChange={(event) => loadScenario(event.target.value)}
            >
              <option value="">Draft scenario</option>
              {savedScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </label>
          <div className="control-stack">
            <span className="control-label">Actions</span>
            <button
              className="action-button"
              onClick={saveScenario}
            >
              Save Scenario
            </button>
          </div>
          <div className="control-stack">
            <span className="control-label">Reset</span>
            <button
              className="action-button"
              onClick={() => {
                onSelectedScenarioIdChange(null);
                onDraftScenarioChange([]);
              }}
            >
              New Draft
            </button>
          </div>
        </div>
        {selectedScenarioId ? (
          <label className="control-stack mt-3">
            <span className="control-label">Scenario name</span>
            <input
              className="control-input w-full"
              value={savedScenarios.find((scenario) => scenario.id === selectedScenarioId)?.name ?? ""}
              onChange={(event) => renameScenario(selectedScenarioId, event.target.value)}
              placeholder="Scenario name"
            />
          </label>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {currentScenario.map((operation, index) => (
          <div
            key={`${operation.eventId}-${index}`}
            className={`surface-panel-subtle grid items-end gap-3 p-4 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] 2xl:grid-cols-[minmax(0,1.8fr)_minmax(180px,0.9fr)_minmax(120px,0.65fr)_minmax(140px,0.75fr)_auto] ${
              demoHighlightControls && demoActiveArtifactId === operation.eventId ? "border-phaseYellow/80 bg-shell/80" : ""
            }`}
          >
            <label className="control-stack">
              <span className="control-label">Artifact</span>
              <select
                className="control-input"
                value={operation.eventId}
                onChange={(event) => updateOperation(index, { eventId: event.target.value })}
              >
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="control-stack">
              <span className="control-label">Change type</span>
              <select
                className="control-input"
                value={operation.mode}
                onChange={(event) => updateOperation(index, { mode: event.target.value as CounterfactualOperation["mode"] })}
              >
                <option value="remove">Remove artifact</option>
                <option value="delay">Delay artifact</option>
                <option value="reduce">Reduce impact</option>
              </select>
            </label>
            <label className="control-stack">
              <span className="control-label">Delay</span>
              <input
                className="control-input"
                type="number"
                min={1}
                max={6}
                value={operation.delayMonths}
                onChange={(event) => updateOperation(index, { delayMonths: Number(event.target.value) })}
                title="Delay months"
              />
            </label>
            <label className="control-stack">
              <span className="control-label">Impact</span>
              <input
                className="control-input"
                type="number"
                min={0.2}
                max={3}
                step={0.05}
                value={operation.strengthMultiplier}
                onChange={(event) => updateOperation(index, { strengthMultiplier: Number(event.target.value) })}
                title="Strength multiplier"
              />
            </label>
            <div className="control-stack justify-self-start">
              <span className="control-label">Row</span>
              <button
                className="action-button"
                onClick={() => removeOperation(index)}
              >
                Remove Row
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="action-button"
          onClick={addOperation}
        >
          Add Artifact Change
        </button>
        <button
          className="action-button"
          onClick={() => onDraftScenarioChange([])}
        >
          Clear simulation
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Base phase path</p>
          <p className="mt-3 text-sm leading-6 text-muted">{basePhases}</p>
        </div>
        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Scenario phase path</p>
          <p className="mt-3 text-sm leading-6 text-muted">{scenarioPhases}</p>
        </div>
      </div>

      <div className="surface-panel-subtle mt-4 p-4">
        <p className="section-kicker">Scenario status</p>
        <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
          <p>Active artifact changes: <span className="text-ink">{currentScenario.length}</span></p>
          <p>Saved scenarios: <span className="text-ink">{savedScenarios.length}</span></p>
          <p>Removed transitions: <span className="text-ink">{removedTransitions.length}</span></p>
          <p>Added transitions: <span className="text-ink">{addedTransitions.length}</span></p>
        </div>
      </div>
    </section>
  );
}
