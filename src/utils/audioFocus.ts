type StopPlayback = () => void;

interface AudioFocusState {
  ownerId: string | null;
  stopPlayback: StopPlayback | null;
  sectionAudioBlocked: boolean;
}

const state: AudioFocusState = {
  ownerId: null,
  stopPlayback: null,
  sectionAudioBlocked: false,
};

export const claimAudioFocus = (ownerId: string, stopPlayback: StopPlayback) => {
  if (state.ownerId && state.ownerId !== ownerId && state.stopPlayback) {
    state.stopPlayback();
  }

  state.ownerId = ownerId;
  state.stopPlayback = stopPlayback;
};

export const releaseAudioFocus = (ownerId: string) => {
  if (state.ownerId !== ownerId) {
    return;
  }

  state.ownerId = null;
  state.stopPlayback = null;
};

export const stopActiveAudio = () => {
  if (state.stopPlayback) {
    state.stopPlayback();
  }
};

export const blockSectionAudio = () => {
  state.sectionAudioBlocked = true;
};

export const unblockSectionAudio = () => {
  state.sectionAudioBlocked = false;
};

export const isSectionAudioBlocked = () => state.sectionAudioBlocked;
