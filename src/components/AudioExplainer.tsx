import { useEffect, useMemo, useState } from "react";
import type { WorldDefinition } from "../types";
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
  current: "Current Link Context",
  world: "World Overview",
  timeline: "Timeline And Replay",
  proof: "Proof And Transition Review",
  sandbox: "Counterfactual Sandbox",
  projection: "Conditional Projection",
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
    const sharedContext = `You are currently in the ${role} view at month ${currentMonth} in the ${world.name} world.`;
    const decisionGuardrail =
      "Firms should use this information to support better governed human decisions, stronger review discipline, and clearer escalation logic, not to automate judgment.";

    switch (section) {
      case "world":
        return `${sharedContext} The world overview explains the bounded domain, geography, time horizon, and governance mode. A firm can use this section to confirm what is in scope before interpreting any signal, so teams do not overread the model beyond its declared boundary. ${decisionGuardrail}`;
      case "timeline":
        return `${sharedContext} The timeline and replay section shows when structural pressure accumulated and when the phase path changed. A firm can use this to brief leadership on sequence, persistence, and turning points rather than reacting to isolated artifacts. ${decisionGuardrail}`;
      case "proof":
        return `${sharedContext} The proof and transition surfaces explain why a phase change was adjudicated, including thresholds, deltas, and supporting artifacts. A firm can use this for oversight, challenge review, escalation memos, and audit documentation before taking action. The current selected transition is ${selectedTransitionId ?? "not set"}. ${decisionGuardrail}`;
      case "sandbox":
        return `${sharedContext} The sandbox allows a firm to explore how the phase path changes if selected artifacts are removed, delayed, or weakened. There are currently ${activeScenarioCount} active sandbox modifications. A firm can use this to stress test assumptions, compare scenario sensitivity, and identify which artifacts materially affect the world-state path. It should not be treated as policy advice. ${decisionGuardrail}`;
      case "projection":
        return `${sharedContext} The conditional projection layer shows a bounded forward outlook under explicit assumptions. A firm can use it to understand threshold proximity and scenario continuation risk, while keeping uncertainty visible. It is an exploratory projection, not a prediction of real-world behavior. ${decisionGuardrail}`;
      case "governance":
        return `${sharedContext} The governance panel states safeguards, non-claims, and deployment posture. A firm can use this section to ensure the console is used in a governance-grade manner, with human review and without truth adjudication, belief inference, or automated decision authority. ${decisionGuardrail}`;
      case "current":
      default:
        return `${sharedContext} ${getCurrentUrlContext()} The selected artifact is ${selectedEventId ?? "not set"}, and the selected transition is ${selectedTransitionId ?? "not set"}. This audio explainer helps users understand what the current shared link is showing and how the firm can use the information for orientation, review, and disciplined human decision support. ${decisionGuardrail}`;
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
      <h3 className="mt-2 text-lg font-semibold text-ink">Section narration and decision-support guidance</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Spoken guidance for the active console context. Uses the browser voice engine only. Framed for human decision support, not automated judgment.
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
