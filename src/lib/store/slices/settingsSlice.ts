import type { StateCreator } from "zustand";
import type { Settings, SettingsUpdate, Layout } from "../types";

export interface SettingsSlice {
  settings: Settings;
  updateSettings: (settings: SettingsUpdate) => void;
  layout: Layout;
  updateLayout: (layout: Partial<Layout>) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set) => ({
  settings: {
    typewriterSpeed: 30,
    soundEnabled: true,
    ttsEnabled: true,
    musicEnabled: false,
    modelConfig: { provider: "auto", model: "" },
    ambient: {
      rainEnabled: true,
      rainVolume: 1,
      fogEnabled: true,
      intensity: "medium",
      crackleEnabled: false,
      crackleVolume: 0.35,
    },
    aestheticId: "noir",
    imageModel: undefined,
    sfxVolumes: undefined,
    musicVolume: undefined,
    customMusicUrl: undefined,
    musicProvider: undefined,
    musicPrompt: undefined,
    generatedTracks: undefined,
    generatedTapes: undefined,
    effectIntensities: undefined,
    imageStylePrompt: undefined,
    apiKeys: undefined,
    voiceSettings: undefined,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...newSettings,
        // Nested objects are merged when an object is supplied. Use `in` so an
        // EXPLICIT `undefined` (e.g. "reset to preset default") clears the
        // override instead of being treated as "not provided" and falling back
        // to the old value. ambient is always present, so it's never cleared.
        ambient:
          "ambient" in newSettings && newSettings.ambient
            ? { ...state.settings.ambient, ...newSettings.ambient }
            : state.settings.ambient,
        effectIntensities:
          "effectIntensities" in newSettings
            ? newSettings.effectIntensities
              ? { ...state.settings.effectIntensities, ...newSettings.effectIntensities }
              : undefined
            : state.settings.effectIntensities,
        voiceSettings:
          "voiceSettings" in newSettings
            ? newSettings.voiceSettings
              ? { ...state.settings.voiceSettings, ...newSettings.voiceSettings }
              : undefined
            : state.settings.voiceSettings,
      },
    })),

  layout: {
    showEditor: true,
    showSidebar: true,
    showEject: false,
    showDictaphone: false,
    editorWidth: 300,
    sidebarWidth: 360,
  },
  updateLayout: (newLayout) => set((state) => ({ layout: { ...state.layout, ...newLayout } })),
});
