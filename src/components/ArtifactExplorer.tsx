import type { NarrativeEvent, TransitionRecord } from "../types";
import { SectionAudioControl } from "./SectionAudioControl";

interface ArtifactExplorerProps {
  events: NarrativeEvent[];
  transitions: TransitionRecord[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  worldBoundaryContext: string;
}

export function ArtifactExplorer({
  events,
  transitions,
  selectedEventId,
  onSelectEvent,
  worldBoundaryContext,
}: ArtifactExplorerProps) {
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[events.length - 1];
  const linkedTransitionCount = selectedEvent
    ? transitions.filter((transition) =>
        transition.triggeringArtifacts.some((artifact) => artifact.id === selectedEvent.id),
      ).length
    : 0;

  return (
    <section className="rounded-sm border border-edge bg-panel p-4 shadow-panel">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Artifact Explorer</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">Seeded narrative artifacts</h3>
          </div>
          <SectionAudioControl
            sectionTitle="Artifact Explorer"
            worldBoundaryContext={worldBoundaryContext}
            summary="The artifact explorer shows the individual events that contributed to the world state."
            currentState={`There are currently ${events.length} visible artifacts. The selected artifact is ${selectedEvent?.title ?? "none"}, from month ${selectedEvent?.month ?? "unknown"}, with structural contribution ${selectedEvent?.structuralEffect ?? "unknown"}, and it is linked to ${linkedTransitionCount} visible transitions.`}
            businessUse="A firm can use this section to judge whether a specific artifact is background noise, a meaningful contributor, or part of a transition-driving cluster."
            decisionGuidance="This supports better prioritization of analyst effort by focusing review on the artifacts most likely to have altered the structural path."
            rawContext={[
              `Visible artifact count: ${events.length}`,
              `Selected artifact title: ${selectedEvent?.title ?? "none"}`,
              `Selected artifact description: ${selectedEvent?.description ?? "none"}`,
              `Selected artifact source type: ${selectedEvent?.sourceType ?? "unknown"}`,
              `Selected artifact domain tags: ${selectedEvent?.domainTags.join(", ") ?? "none"}`,
              `Selected artifact metrics: velocity ${selectedEvent?.metrics.velocity ?? 0}, density ${selectedEvent?.metrics.density ?? 0}, coherence ${selectedEvent?.metrics.coherence ?? 0}, reversibility ${selectedEvent?.metrics.reversibility ?? 0}`,
              `Linked transitions: ${transitions.filter((transition) => selectedEvent && transition.triggeringArtifacts.some((artifact) => artifact.id === selectedEvent.id)).map((transition) => `${transition.fromPhase} to ${transition.toPhase} at month ${transition.month}`).join(" | ") || "none"}`,
            ]}
          />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
          {events.map((event) => (
            <button
              key={event.id}
              className={`w-full rounded-sm border px-3 py-3 text-left ${
                selectedEvent?.id === event.id
                  ? "border-muted bg-shell/90"
                  : "border-edge bg-shell/50 hover:border-muted"
              }`}
              onClick={() => onSelectEvent(event.id)}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{event.label} {event.title}</p>
                <span className="text-xs uppercase tracking-[0.16em] text-muted">Month {event.month}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{event.description}</p>
            </button>
          ))}
        </div>

        {selectedEvent ? (
          <div className="rounded-sm border border-edge bg-shell/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Artifact detail</p>
            <h4 className="mt-2 text-lg font-semibold text-ink">{selectedEvent.title}</h4>
            <p className="mt-3 text-sm leading-6 text-muted">{selectedEvent.description}</p>

            <div className="mt-4 grid gap-3 text-sm text-ink">
              <p>Source type: <span className="text-muted">{selectedEvent.sourceType}</span></p>
              <p>Domain tags: <span className="text-muted">{selectedEvent.domainTags.join(", ")}</span></p>
              <p>Structural contribution: <span className="text-muted">{selectedEvent.structuralEffect}</span></p>
              <p>Phase contribution: <span className="text-muted">{selectedEvent.phase}</span></p>
            </div>

            <div className="mt-4 rounded-sm border border-edge/80 bg-panel p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Linked transitions</p>
              <div className="mt-3 space-y-2">
                {transitions
                  .filter((transition) =>
                    transition.triggeringArtifacts.some((artifact) => artifact.id === selectedEvent.id),
                  )
                  .map((transition) => (
                    <div key={transition.id} className="text-sm text-ink">
                      {transition.fromPhase} {"->"} {transition.toPhase} at M{transition.month}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
