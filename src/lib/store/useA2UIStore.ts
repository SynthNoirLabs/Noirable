import { create } from "zustand";
import { persist } from "zustand/middleware";
import { A2UIComponent } from "@/lib/protocol/schema";

interface Settings {
  typewriterSpeed: number;
  soundEnabled: boolean;
}

interface Layout {
  showEditor: boolean;
  showSidebar: boolean;
  editorWidth: number;
  sidebarWidth: number;
}

export interface EvidenceEntry {
  id: string;
  createdAt: number;
  label: string;
  status?: string;
  data: A2UIComponent;
}

interface A2UIState {
  evidence: A2UIComponent | null;
  setEvidence: (evidence: A2UIComponent) => void;
  evidenceHistory: EvidenceEntry[];
  activeEvidenceId: string | null;
  addEvidence: (entry: EvidenceEntry) => void;
  setActiveEvidenceId: (id: string | null) => void;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  layout: Layout;
  updateLayout: (layout: Partial<Layout>) => void;
}

export const useA2UIStore = create<A2UIState>()(
  persist(
    (set) => ({
      evidence: null,
      setEvidence: (evidence) => set({ evidence }),
      evidenceHistory: [],
      activeEvidenceId: null,
      addEvidence: (entry) =>
        set((state) => ({
          evidenceHistory: [...state.evidenceHistory, entry],
          activeEvidenceId: entry.id,
        })),
      setActiveEvidenceId: (id) => set({ activeEvidenceId: id }),
      settings: {
        typewriterSpeed: 30,
        soundEnabled: true,
      },
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      layout: {
        showEditor: true,
        showSidebar: true,
        editorWidth: 300,
        sidebarWidth: 360,
      },
      updateLayout: (newLayout) =>
        set((state) => ({ layout: { ...state.layout, ...newLayout } })),
    }),
    {
      name: "a2ui-storage", // unique name
      partialize: (state) => ({
        settings: state.settings,
        layout: state.layout,
      }),
    },
  ),
);
