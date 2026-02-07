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
    sfxVolumes: undefined,
    musicVolume: undefined,
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
        ambient: newSettings.ambient
          ? { ...state.settings.ambient, ...newSettings.ambient }
          : state.settings.ambient,
        effectIntensities: newSettings.effectIntensities
          ? { ...state.settings.effectIntensities, ...newSettings.effectIntensities }
          : state.settings.effectIntensities,
        voiceSettings: newSettings.voiceSettings
          ? { ...state.settings.voiceSettings, ...newSettings.voiceSettings }
          : state.settings.voiceSettings,
      },
    })),

  layout: {
    showEditor: true,
    showSidebar: true,
    showEject: false,
    editorWidth: 300,
    sidebarWidth: 360,
  },
  updateLayout: (newLayout) => set((state) => ({ layout: { ...state.layout, ...newLayout } })),
});
