import type { ReactNode } from "react";
import { AudioPreferencesContext, type AudioMode, type AudioProvider, type AudioRole } from "../context/audioPreferences";
import type { VoiceProfile } from "../utils/speech";

export function AudioPreferencesProvider({
  role,
  mode,
  provider,
  voiceProfile,
  children,
}: {
  role: AudioRole;
  mode: AudioMode;
  provider: AudioProvider;
  voiceProfile: VoiceProfile;
  children: ReactNode;
}) {
  return (
    <AudioPreferencesContext.Provider value={{ role, mode, provider, voiceProfile }}>
      {children}
    </AudioPreferencesContext.Provider>
  );
}
