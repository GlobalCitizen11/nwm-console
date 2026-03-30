import { useEffect, useMemo, useRef, useState } from "react";
import type { SimulationResult, ViewSnapshot, WorldStatePoint } from "../types";
import type { VoiceBriefIntelligence } from "../types/voiceBriefIntelligence";
import { extractBriefingState } from "../utils/briefingArtifacts";
import { normalizeExportData } from "../features/export/utils/normalizeExportData";
import { buildCanonicalSummary } from "../features/export/utils/canonicalSummary";
import { buildVoiceBriefTranscriptDraft } from "../lib/buildVoiceBriefTranscriptDraft";
import { adaptVoiceBriefTranscript } from "../lib/voiceBriefAdapter";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: {
    transcript: string;
  };
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function VoiceBriefPanel({
  scenarioLabel,
  result,
  point,
  currentView,
  onIntelligenceUpdate,
}: {
  scenarioLabel: string;
  result: SimulationResult;
  point: WorldStatePoint;
  currentView: ViewSnapshot;
  onIntelligenceUpdate?: (intelligence: VoiceBriefIntelligence) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const summary = useMemo(() => {
    const briefingState = extractBriefingState({
      scenarioName: scenarioLabel,
      result,
      point,
      currentView,
    });
    return buildCanonicalSummary(normalizeExportData(briefingState, currentView.name));
  }, [currentView, point, result, scenarioLabel]);

  const voiceDraft = useMemo(() => buildVoiceBriefTranscriptDraft(summary, `${transcript} ${interimTranscript}`.trim()), [summary, transcript, interimTranscript]);
  const normalizedVoice = useMemo(() => adaptVoiceBriefTranscript(voiceDraft), [voiceDraft]);

  useEffect(() => {
    onIntelligenceUpdate?.(normalizedVoice);
  }, [normalizedVoice, onIntelligenceUpdate]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const resultChunk = event.results[index];
        const text = resultChunk[0]?.transcript ?? "";
        if (resultChunk.isFinal) {
          finalChunk += ` ${text}`;
        } else {
          interimChunk += ` ${text}`;
        }
      }
      if (finalChunk.trim()) {
        setTranscript((current) => `${current} ${finalChunk}`.replace(/\s+/g, " ").trim());
      }
      setInterimTranscript(interimChunk.replace(/\s+/g, " ").trim());
    };
    recognition.onerror = (event) => {
      setError(event.error ? `Voice input error: ${event.error}` : "Voice input failed.");
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterimTranscript("");
    };
    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      return;
    }

    setError("");
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    recognitionRef.current.start();
    setListening(true);
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    setError("");
  };

  return (
    <section className="surface-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Voice Brief</p>
          <h2 className="section-title">Real-time voice-to-brief readout</h2>
          <p className="mt-2 text-sm text-muted">
            Speak in full sentences. The console captures transcript input, normalizes it into structured intelligence, and shows the live readout without passing raw transcript into artifacts.
          </p>
        </div>
        <div className="surface-panel-subtle min-w-[220px] text-sm text-muted">
          <p>Support: <span className="text-ink">{supported ? "Browser speech recognition" : "Unavailable"}</span></p>
          <p className="mt-2">Status: <span className="text-ink">{listening ? "Listening" : "Idle"}</span></p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="action-button" disabled={!supported} onClick={toggleListening}>
          {listening ? "Stop Voice Input" : "Start Voice Input"}
        </button>
        <button className="action-button" onClick={clearTranscript}>
          Clear Readout
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-phaseRed">{error}</p> : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="grid gap-3">
          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Live Transcript</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
              <p>{transcript || "Start voice input to capture a live transcript."}</p>
              {interimTranscript ? <p className="text-ink">{interimTranscript}</p> : null}
            </div>
          </div>

        </div>

        <div className="surface-panel-subtle p-4">
          <p className="section-kicker">Structured Readout</p>
          <div className="mt-3 grid gap-3 text-sm text-muted">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">System State</p>
              <p className="mt-1 text-ink">{normalizedVoice.intelligenceSchema?.systemState.statement}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Dominant Path</p>
              <p className="mt-1 text-ink">{normalizedVoice.intelligenceSchema?.dominantPath.statement}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Primary Pressure</p>
              <p className="mt-1 text-ink">{normalizedVoice.intelligenceSchema?.primaryPressure.statement}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Decision Intent</p>
              <p className="mt-1 text-ink">{normalizedVoice.intelligenceSchema?.decisionIntent.headline}</p>
              <ul className="mt-2 space-y-1 pl-4">
                {normalizedVoice.intelligenceSchema?.decisionIntent.actions.slice(0, 3).map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
