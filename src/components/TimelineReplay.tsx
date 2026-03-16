import { useEffect, useRef, useState } from "react";
import type { TransitionRecord, WorldStatePoint } from "../types";
import { SectionAudioControl } from "./SectionAudioControl";

interface TimelineReplayProps {
  timeline: WorldStatePoint[];
  transitions: TransitionRecord[];
  currentMonth: number;
  onMonthChange: (month: number) => void;
  worldBoundaryContext: string;
  demoPlayback?: {
    token: number;
    startMonth: number;
    endMonth: number;
  } | null;
}

export function TimelineReplay({
  timeline,
  transitions,
  currentMonth,
  onMonthChange,
  worldBoundaryContext,
  demoPlayback = null,
}: TimelineReplayProps) {
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const demoIntervalRef = useRef<number | null>(null);
  const demoPlaybackToken = demoPlayback?.token ?? 0;
  const demoPlaybackStart = demoPlayback?.startMonth ?? 0;
  const demoPlaybackEnd = demoPlayback?.endMonth ?? 0;
  const maxMonth = timeline[timeline.length - 1]?.month ?? 0;
  const currentPhase = timeline.find((point) => point.month === currentMonth)?.phase ?? "Escalating";
  const visibleTransitions = transitions.filter((transition) => transition.month <= currentMonth);
  const latestTransition = visibleTransitions[visibleTransitions.length - 1];

  useEffect(() => {
    if (!playing) {
      return;
    }
    intervalRef.current = window.setInterval(() => {
      onMonthChange(currentMonth >= maxMonth ? 0 : currentMonth + 1);
    }, 900);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [playing, currentMonth, maxMonth, onMonthChange]);

  useEffect(() => {
    if (demoPlaybackToken === 0) {
      return;
    }
    setPlaying(false);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (demoIntervalRef.current) {
      window.clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }

    const boundedStart = Math.max(0, Math.min(maxMonth, demoPlaybackStart));
    const boundedEnd = Math.max(boundedStart, Math.min(maxMonth, demoPlaybackEnd));
    let demoMonth = boundedStart;
    onMonthChange(boundedStart);

    demoIntervalRef.current = window.setInterval(() => {
      demoMonth += 1;
      if (demoMonth >= boundedEnd) {
        demoMonth = boundedEnd;
        if (demoIntervalRef.current) {
          window.clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
        }
      }
      onMonthChange(demoMonth);
    }, 420);

    return () => {
      if (demoIntervalRef.current) {
        window.clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
    };
  }, [demoPlaybackEnd, demoPlaybackStart, demoPlaybackToken, maxMonth, onMonthChange]);

  return (
    <section className="surface-panel">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-kicker">Timeline Replay</p>
          <h3 className="section-title">Month {currentMonth}</h3>
          <p className="mt-2 text-sm text-muted">
            Replay the bounded world month by month to inspect persistence, threshold timing, and phase change sequence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SectionAudioControl
            sectionTitle="Timeline Replay"
            worldBoundaryContext={worldBoundaryContext}
            summary="This timeline and replay section shows how the world evolved over time and where phase transitions occurred."
            currentState={`The replay is currently positioned at month ${currentMonth} out of month ${maxMonth}. The current phase at this point is ${currentPhase}. ${latestTransition ? `The latest visible transition is ${latestTransition.fromPhase} to ${latestTransition.toPhase} at month ${latestTransition.month}.` : "No transition is yet visible at this point in the replay."}`}
            businessUse="A firm can use replay to understand sequence, persistence, and turning points instead of reacting to isolated artifacts."
            decisionGuidance="This helps distinguish an early weak signal from a persistent structural change that may justify escalation, reporting, or deeper review."
            rawContext={[
              `Current month: ${currentMonth}`,
              `Maximum month: ${maxMonth}`,
              `Current phase: ${currentPhase}`,
              `Visible transitions: ${visibleTransitions.length}`,
              `Transition path: ${transitions.map((transition) => `${transition.fromPhase} to ${transition.toPhase} at month ${transition.month}`).join(" | ") || "none"}`,
              `Visible timeline phases: ${timeline.filter((point) => point.month <= currentMonth).map((point) => `M${point.month} ${point.phase}`).join(" | ")}`,
            ]}
          />
          <button
            className="action-button"
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className="action-button"
            onClick={() => onMonthChange(Math.max(0, currentMonth - 1))}
          >
            Step Back
          </button>
          <button
            className="action-button"
            onClick={() => onMonthChange(Math.min(maxMonth, currentMonth + 1))}
          >
            Step Forward
          </button>
        </div>
      </div>

      <input
        className="w-full accent-phaseYellow"
        type="range"
        min={0}
        max={maxMonth}
        value={currentMonth}
        onChange={(event) => onMonthChange(Number(event.target.value))}
      />

      <div className="mt-5 grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="relative h-12 overflow-hidden rounded-md border border-edge bg-shell/70">
            {timeline.map((point) => (
              <div
                key={point.month}
                className="absolute bottom-0 top-0 border-r border-black/30"
                style={{
                  left: `${(point.month / maxMonth) * 100}%`,
                  width: `${100 / (maxMonth + 1)}%`,
                  backgroundColor: point.halo.dominantOrientationColor,
                  opacity: point.month <= currentMonth ? 0.9 : 0.25,
                }}
                title={`Month ${point.month}: ${point.phase}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.18em] text-muted">
            <span>0</span>
            <span>18 months</span>
          </div>
        </div>

        <div className="surface-panel-subtle p-3">
          <p className="section-kicker">Transition markers</p>
          <div className="mt-3 space-y-2">
            {transitions.map((transition) => (
              <div key={transition.id} className="flex items-center justify-between text-sm text-ink">
                <span>{transition.fromPhase} {"->"} {transition.toPhase}</span>
                <span className="text-muted">M{transition.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
