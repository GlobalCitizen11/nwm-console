import { useEffect, useMemo, useState } from "react";
import type { WorldDefinition } from "../types";
import { SYSTEM_LABELS } from "../lib/systemLabels";
import { configurePreferredVoice } from "../utils/speech";

type AudioRole = "Executive" | "Analyst" | "Sandbox" | "Oversight";
type AudioSection =
  | "current"
  | "world"
  | "timeline"
  | "proof"
  | "sandbox"
  | "projection"
  | "governance";

interface AudioExplainerProps {
  role: AudioRole;
  world: WorldDefinition;
  currentMonth: number;
  selectedEventId: string | null;
  selectedTransitionId: string | null;
  activeScenarioCount: number;
}

const sectionLabels: Record<AudioSection, string> = {
  current: "Current View Context",
  world: "World Overview",
  timeline: "Timeline And Replay",
  proof: "Proof And Transition Review",
  sandbox: `${SYSTEM_LABELS.PROTOSTAR} Sandbox`,
  projection: `${SYSTEM_LABELS.PROTOSTAR} Projection`,
  governance: "Governance Panel",
};

const getCurrentUrlContext = () => {
  if (typeof window === "undefined") {
    return "";
  }
  const params = new URLSearchParams(window.location.search);
  const pairs = Array.from(params.entries());
  if (pairs.length === 0) {
    return "No additional URL state is active beyond the default console configuration.";
  }
  return `The current shared link preserves ${pairs
    .map(([key, value]) => `${key} equals ${value}`)
    .join(", ")}.`;
};

export function AudioExplainer({
  role,
  world,
  currentMonth,
  selectedEventId,
  selectedTransitionId,
  activeScenarioCount,
}: AudioExplainerProps) {
  const [section, setSection] = useState<AudioSection>("current");
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const script = useMemo(() => {
    const sharedContext = `You are currently in the ${role} view at month ${currentMonth} within the ${world.name} bounded world.`;
    const decisionGuardrail =
      "This surface is intended to support human review and clearer orientation, not automated judgment.";

    switch (section) {
      case "world":
        return `${sharedContext} The world overview sets the boundary: domain, geography, time horizon, and governance mode. It keeps the later read anchored to what is actually in scope before any signal is interpreted. ${decisionGuardrail}`;
      case "timeline":
        return `${sharedContext} Timeline and replay show when structural pressure accumulated and when the phase path changed. Sequence matters more than any isolated artifact, which makes turning points easier to read here. ${decisionGuardrail}`;
      case "proof":
        return `${sharedContext} The proof and transition surfaces keep the basis for a phase change reviewable, including thresholds, deltas, and supporting artifacts. The current selected transition is ${selectedTransitionId ?? "not set"}. ${decisionGuardrail}`;
      case "sandbox":
        return `${sharedContext} The ${SYSTEM_LABELS.PROTOSTAR} examines how the phase path changes when selected artifacts are removed, delayed, or weakened. There are currently ${activeScenarioCount} active sandbox modifications. It is a bounded scenario exercise, not a policy instruction or a forecast. ${decisionGuardrail}`;
      case "projection":
        return `${sharedContext} The ${SYSTEM_LABELS.PROTOSTAR} presents a conditional forward view under explicit assumptions. It keeps threshold proximity and continuation risk visible without implying prediction. ${decisionGuardrail}`;
      case "governance":
        return `${sharedContext} The governance panel keeps safeguards, non-claims, and deployment posture visible. It frames how the console should be used before outputs move into review or circulation. ${decisionGuardrail}`;
      case "current":
      default:
        return `${sharedContext} ${getCurrentUrlContext()} The selected artifact is ${selectedEventId ?? "not set"}, and the selected transition is ${selectedTransitionId ?? "not set"}. This spoken note is meant to clarify what the current shared view is showing and where attention should rest. ${decisionGuardrail}`;
    }
  }, [role, currentMonth, world.name, section, selectedEventId, selectedTransitionId, activeScenarioCount]);

  const speak = () => {
    if (!supported || typeof window === "undefined") {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    configurePreferredVoice(utterance);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (!supported || typeof window === "undefined") {
      return;
    }
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <section className="surface-panel">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">Audio Explainer</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">Section narration</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Spoken guidance for the active console context. Uses the browser voice engine only. Intended for orientation and review, not automated judgment.
      </p>

      <div className="mt-4 grid gap-3">
        <select
          className="control-input"
          value={section}
          onChange={(event) => setSection(event.target.value as AudioSection)}
        >
          {Object.entries(sectionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            className="action-button disabled:opacity-50"
            onClick={speak}
            disabled={!supported || speaking}
          >
            Play Audio
          </button>
          <button
            className="action-button disabled:opacity-50"
            onClick={stop}
            disabled={!supported || !speaking}
          >
            Stop
          </button>
        </div>
      </div>

      <div className="surface-panel-subtle mt-4 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Narration preview</p>
        <p className="mt-3 text-sm leading-6 text-muted">{script}</p>
      </div>

      {!supported ? (
        <p className="mt-3 text-sm text-muted">
          Audio narration is unavailable in this browser because Speech Synthesis is not supported.
        </p>
      ) : null}
    </section>
  );
}
