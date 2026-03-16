import { useEffect, useRef, useState } from "react";
import { useAudioPreferences } from "../context/audioPreferences";
import {
  generateOpenAiNarration,
  generateOpenAiSpeechAudio,
} from "../utils/openaiNarration";
import { configurePreferredVoice, isOpenAiVoiceProfile } from "../utils/speech";

interface SectionAudioControlProps {
  sectionTitle: string;
  worldBoundaryContext: string;
  summary: string;
  currentState: string;
  businessUse: string;
  decisionGuidance?: string;
  rawContext?: string[];
  label?: string;
}

export function SectionAudioControl({
  sectionTitle,
  worldBoundaryContext,
  summary,
  currentState,
  businessUse,
  decisionGuidance,
  rawContext,
  label = "Audio Brief",
}: SectionAudioControlProps) {
  const { role, mode, voiceProfile } = useAudioPreferences();
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && ("speechSynthesis" in window || "Audio" in window));
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrlRef.current) {
        window.URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const buildScript = () => {
    return [
      `Local ${role.toLowerCase()} brief.`,
      `Section: ${sectionTitle}.`,
      `Current state: ${currentState}`,
      `Bounded-world relevance: ${businessUse}`,
      decisionGuidance ? `Human review note: ${decisionGuidance}` : "",
      "This is the deterministic local voice path.",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const speakScript = (script: string) => {
    if (!supported || typeof window === "undefined") {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(script);
    configurePreferredVoice(utterance, role);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const playOpenAiAudio = async (script: string) => {
    if (typeof window === "undefined") {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      window.URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    const blob = await generateOpenAiSpeechAudio(script, voiceProfile, role);
    const url = window.URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audioUrlRef.current = url;

    audio.onended = () => {
      setSpeaking(false);
      if (audioUrlRef.current) {
        window.URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioRef.current = null;
    };
    audio.onerror = () => {
      setSpeaking(false);
      if (audioUrlRef.current) {
        window.URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioRef.current = null;
    };

    setSpeaking(true);
    await audio.play();
  };

  const toggleSpeech = async () => {
    if (!supported || typeof window === "undefined") {
      return;
    }
    const useOpenAiVoice = isOpenAiVoiceProfile(voiceProfile);

    if (speaking) {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        window.URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setSpeaking(false);
      setLoading(false);
      return;
    }

    if (useOpenAiVoice) {
      try {
        setErrorMessage(null);
        setLoading(true);
        const generatedScript = await generateOpenAiNarration({
          sectionTitle,
          role,
          mode,
          worldBoundaryContext,
          summary,
          currentState,
          businessUse,
          decisionGuidance,
          rawContext,
        });
        await playOpenAiAudio(generatedScript || buildScript());
      } catch (error) {
        console.error("OpenAI audio brief failed.", error);
        setErrorMessage(error instanceof Error ? error.message : "OpenAI audio brief failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setErrorMessage(null);
    speakScript(buildScript());
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="rounded-sm border border-edge px-3 py-2 text-xs uppercase tracking-[0.16em] text-ink hover:border-muted disabled:opacity-50"
        onClick={toggleSpeech}
        disabled={!supported}
        title={
          supported
            ? "Play or stop spoken guidance for this section"
            : "Speech synthesis unavailable"
        }
      >
        {speaking ? "Stop Audio" : loading ? "Preparing AI Audio" : label}
      </button>
      {errorMessage ? (
        <p className="max-w-xs text-right text-[11px] leading-5 text-phaseOrange">
          OpenAI audio unavailable. {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
