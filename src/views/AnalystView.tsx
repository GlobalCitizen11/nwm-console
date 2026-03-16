import type { ProjectionResult, SimulationResult, WorldStatePoint } from "../types";
import { ArtifactExplorer } from "../components/ArtifactExplorer";
import { ConditionalProjectionPanel } from "../components/ConditionalProjectionPanel";
import { NarrativeWorldMap } from "../components/NarrativeWorldMap";
import { StateCharts } from "../components/StateCharts";

interface AnalystViewProps {
  result: SimulationResult;
  point: WorldStatePoint;
  projection: ProjectionResult;
  worldBoundaryContext: string;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

export function AnalystView({
  result,
  point,
  projection,
  worldBoundaryContext,
  selectedEventId,
  onSelectEvent,
}: AnalystViewProps) {
  return (
    <div className="space-y-4">
      <StateCharts timeline={result.timeline} currentMonth={point.month} worldBoundaryContext={worldBoundaryContext} />
      <NarrativeWorldMap
        events={point.visibleEvents}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        worldBoundaryContext={worldBoundaryContext}
      />
      <ArtifactExplorer
        events={point.visibleEvents}
        transitions={result.transitions.filter((transition) => transition.month <= point.month)}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        worldBoundaryContext={worldBoundaryContext}
      />
      <ConditionalProjectionPanel projection={projection} worldBoundaryContext={worldBoundaryContext} />
    </div>
  );
}
