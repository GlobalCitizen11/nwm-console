const STORAGE_KEY = "nwm-console-voice-profile";

import type { AudioRole } from "../context/audioPreferences";

export type VoiceProfile = "openai-coral" | "openai-shimmer" | "google-us-female" | "google-uk-female";

const preferredVoicePatterns = [
  /samantha/i,
  /ava/i,
  /allison/i,
  /serena/i,
  /karen/i,
  /moira/i,
  /victoria/i,
  /zira/i,
  /jenny/i,
  /aria/i,
  /google us english/i,
  /female/i,
];

const voiceProfilePatterns: Record<VoiceProfile, RegExp[]> = {
  "openai-coral": [/coral/i, /en-us/i, /samantha|ava|allison|victoria|zira|jenny/i],
  "openai-shimmer": [/shimmer/i, /en-gb/i, /serena|kate|susan/i],
  "google-us-female": [/google us english/i, /en-us/i, /samantha|ava|allison|victoria|zira|jenny/i],
  "google-uk-female": [/google uk english female/i, /en-gb/i, /serena|kate|susan/i],
};

export const pickPreferredVoice = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    return null;
  }

  const savedProfile = (window.localStorage.getItem(STORAGE_KEY) as VoiceProfile | null) ?? "google-us-female";
  const profilePatterns = voiceProfilePatterns[savedProfile];
  for (const pattern of profilePatterns) {
    const match = voices.find((voice) => pattern.test(`${voice.name} ${voice.lang}`));
    if (match) {
      return match;
    }
  }

  for (const pattern of preferredVoicePatterns) {
    const match = voices.find((voice) => pattern.test(voice.name));
    if (match) {
      return match;
    }
  }

  return (
    voices.find((voice) => /en-us/i.test(voice.lang) && /natural|enhanced|premium/i.test(voice.name)) ??
    voices.find((voice) => /en-us/i.test(voice.lang)) ??
    voices[0]
  );
};

export const getSavedVoiceProfile = (): VoiceProfile => {
  if (typeof window === "undefined") {
    return "google-us-female";
  }
  const saved = window.localStorage.getItem(STORAGE_KEY) as VoiceProfile | null;
  return saved ?? "google-us-female";
};

export const setSavedVoiceProfile = (profile: VoiceProfile) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, profile);
};

export const getOpenAiVoice = (profile: VoiceProfile) =>
  ({
    "openai-coral": "coral",
    "openai-shimmer": "shimmer",
    "google-us-female": "coral",
    "google-uk-female": "shimmer",
  })[profile];

export const isOpenAiVoiceProfile = (profile: VoiceProfile) =>
  profile === "openai-coral" || profile === "openai-shimmer";

export const configurePreferredVoice = (
  utterance: SpeechSynthesisUtterance,
  role: AudioRole = "Executive",
) => {
  const voice = pickPreferredVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
  }
  const delivery = {
    Executive: { rate: 0.98, pitch: 1.01 },
    Analyst: { rate: 0.94, pitch: 1.03 },
    Sandbox: { rate: 0.95, pitch: 1.02 },
    Oversight: { rate: 0.92, pitch: 1.0 },
  }[role];
  utterance.rate = delivery.rate;
  utterance.pitch = delivery.pitch;
};
