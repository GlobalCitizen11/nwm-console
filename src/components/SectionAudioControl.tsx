import { useEffect, useRef, useState } from "react";
import { useAudioPreferences } from "../context/audioPreferences";
import {
  generateOpenAiNarration,
  generateOpenAiSpeechAudio,
} from "../utils/openaiNarration";
import { configurePreferredVoice, isOpenAiVoiceProfile } from "../utils/speech";
import { claimAudioFocus, isSectionAudioBlocked, releaseAudioFocus } from "../utils/audioFocus";

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
  const [pendingTapToPlay, setPendingTapToPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ownerIdRef = useRef(`section-audio-${sectionTitle.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    const ownerId = ownerIdRef.current;
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
      releaseAudioFocus(ownerId);
    };
  }, []);

  const stopPlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
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
    setPendingTapToPlay(false);
    releaseAudioFocus(ownerIdRef.current);
  };

  const buildScript = () => {
    return [
      `Local ${role.toLowerCase()} section brief.`,
      `${sectionTitle}.`,
      summary,
      `Current read: ${currentState}`,
      `Why it matters: ${businessUse}`,
      decisionGuidance ? `Review note: ${decisionGuidance}` : "",
      "This is the deterministic local voice path.",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const speakScript = (script: string) => {
    if (!supported || typeof window === "undefined") {
      return;
    }
    claimAudioFocus(ownerIdRef.current, stopPlayback);
    const utterance = new SpeechSynthesisUtterance(script);
    configurePreferredVoice(utterance, role);
    utterance.onend = () => {
      setSpeaking(false);
      releaseAudioFocus(ownerIdRef.current);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      releaseAudioFocus(ownerIdRef.current);
    };
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const playOpenAiAudio = async (script: string) => {
    if (typeof window === "undefined") {
      return;
    }

    claimAudioFocus(ownerIdRef.current, stopPlayback);
    stopPlayback();
    claimAudioFocus(ownerIdRef.current, stopPlayback);

    const blob = await generateOpenAiSpeechAudio(script, voiceProfile, role);
    const url = window.URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audioUrlRef.current = url;

    audio.onended = () => {
      setSpeaking(false);
      setPendingTapToPlay(false);
      if (audioUrlRef.current) {
        window.URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioRef.current = null;
      releaseAudioFocus(ownerIdRef.current);
    };
    audio.onerror = () => {
      setSpeaking(false);
      setPendingTapToPlay(false);
      if (audioUrlRef.current) {
        window.URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioRef.current = null;
      releaseAudioFocus(ownerIdRef.current);
    };

    try {
      setSpeaking(true);
      setPendingTapToPlay(false);
      await audio.play();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      if (
        errorMessage.includes("not allowed") ||
        errorMessage.includes("user agent") ||
        errorMessage.includes("denied permission")
      ) {
        setSpeaking(false);
        setPendingTapToPlay(true);
        return;
      }

      throw error;
    }
  };

  const playPreparedAudio = async () => {
    if (!audioRef.current) {
      return;
    }

    try {
      claimAudioFocus(ownerIdRef.current, stopPlayback);
      setErrorMessage(null);
      setPendingTapToPlay(false);
      setSpeaking(true);
      await audioRef.current.play();
    } catch (error) {
      setSpeaking(false);
      setPendingTapToPlay(true);
      setErrorMessage(error instanceof Error ? error.message : "Prepared audio could not start.");
    }
  };

  const toggleSpeech = async () => {
    if (!supported || typeof window === "undefined") {
      return;
    }

    if (isSectionAudioBlocked()) {
      setErrorMessage("Walkthrough narration is active. Pause or stop the walkthrough before playing a section brief.");
      return;
    }
    const useOpenAiVoice = isOpenAiVoiceProfile(voiceProfile);

    if (speaking) {
      stopPlayback();
      return;
    }

    if (useOpenAiVoice) {
      try {
        setErrorMessage(null);
        setLoading(true);
        setPendingTapToPlay(false);
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
        {speaking ? "Stop Audio" : loading ? "Preparing Audio" : label}
      </button>
      {pendingTapToPlay ? (
        <button
          className="rounded-sm border border-phaseYellow px-3 py-2 text-xs uppercase tracking-[0.16em] text-phaseYellow hover:border-ink hover:text-ink"
          onClick={playPreparedAudio}
        >
          Tap To Play
        </button>
      ) : null}
      {errorMessage ? (
        <p className="max-w-xs text-right text-[11px] leading-5 text-phaseOrange">
          OpenAI audio unavailable. {errorMessage}
        </p>
      ) : pendingTapToPlay ? (
        <p className="max-w-xs text-right text-[11px] leading-5 text-muted">
          Audio is ready. Tap to play on this device.
        </p>
      ) : null}
    </div>
  );
}
