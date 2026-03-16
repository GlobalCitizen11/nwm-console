import { CounterfactualSandbox } from "../components/CounterfactualSandbox";
import { ConditionalProjectionPanel } from "../components/ConditionalProjectionPanel";
import type { CounterfactualScenario, NamedCounterfactualScenario, ProjectionResult, SimulationResult } from "../types";

interface SandboxViewProps {
  baseResult: SimulationResult;
  scenarioResult: SimulationResult;
  projection: ProjectionResult;
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

export function SandboxView({
  baseResult,
  scenarioResult,
  projection,
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
}: SandboxViewProps) {
  return (
    <div className="space-y-4">
      <CounterfactualSandbox
        events={baseResult.timeline[baseResult.timeline.length - 1].visibleEvents}
        baseResult={baseResult}
        scenarioResult={scenarioResult}
        worldBoundaryContext={worldBoundaryContext}
        demoHighlightControls={demoHighlightControls}
        demoControlMessage={demoControlMessage}
        demoActiveArtifactId={demoActiveArtifactId}
        draftScenario={draftScenario}
        savedScenarios={savedScenarios}
        selectedScenarioId={selectedScenarioId}
        onDraftScenarioChange={onDraftScenarioChange}
        onSavedScenariosChange={onSavedScenariosChange}
        onSelectedScenarioIdChange={onSelectedScenarioIdChange}
      />
      <ConditionalProjectionPanel projection={projection} worldBoundaryContext={worldBoundaryContext} />
    </div>
  );
}
