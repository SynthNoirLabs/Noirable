import { create } from "zustand";
import { persist } from "zustand/middleware";
import { A2UIComponent } from "@/lib/protocol/schema";

interface Settings {
  typewriterSpeed: number;
  soundEnabled: boolean;
}

interface A2UIState {
  evidence: A2UIComponent | null;
  setEvidence: (evidence: A2UIComponent) => void;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useA2UIStore = create<A2UIState>()(
  persist(
    (set) => ({
      evidence: null,
      setEvidence: (evidence) => set({ evidence }),
      settings: {
        typewriterSpeed: 30,
        soundEnabled: true,
      },
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
    }),
    {
      name: "a2ui-storage", // unique name
      partialize: (state) => ({ settings: state.settings }), // persist only settings
    },
  ),
);
