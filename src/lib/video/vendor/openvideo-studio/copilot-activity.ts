/*
 * Pictify addition — NOT vendored from openvideodev/react-video-editor.
 *
 * Whether the copilot is mid-run, readable from outside its panel.
 *
 * The rail needs this to show an activity dot on the Say it item while the
 * user is off in another tab. It is a store rather than a prop because the
 * rail renders the panel through a lookup table and has no channel to it, and
 * because the panel must NOT push the user back to itself when a run finishes
 * — the dot is an offer to look, not a demand.
 */
import { create } from "zustand";

interface CopilotActivity {
  busy: boolean;
  setBusy: (busy: boolean) => void;
}

export const useCopilotActivity = create<CopilotActivity>((set) => ({
  busy: false,
  setBusy: (busy) => set({ busy })
}));
