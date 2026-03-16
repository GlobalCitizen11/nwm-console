import { createContext, useContext } from "react";
import type { VoiceProfile } from "../utils/speech";

export type AudioRole = "Executive" | "Analyst" | "Sandbox" | "Oversight";
export type AudioMode = "short" | "detailed";
export type AudioProvider = "local" | "openai";

interface AudioPreferencesValue {
  role: AudioRole;
  mode: AudioMode;
  provider: AudioProvider;
  voiceProfile: VoiceProfile;
}

export const AudioPreferencesContext = createContext<AudioPreferencesValue>({
  role: "Executive",
  mode: "detailed",
  provider: "local",
  voiceProfile: "google-us-female",
});

export function useAudioPreferences() {
  return useContext(AudioPreferencesContext);
}
