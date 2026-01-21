import { create } from "zustand";
import { persist } from "zustand/middleware";
import { A2UIInput } from "@/lib/protocol/schema";
import { AIProviderType, AVAILABLE_MODELS } from "@/lib/ai/models";

export type { AIProviderType };
export { AVAILABLE_MODELS };

export interface ModelConfig {
  provider: AIProviderType;
  model: string;
}

interface Settings {
  typewriterSpeed: number;
  soundEnabled: boolean;
  modelConfig: ModelConfig;
}

interface Layout {
  showEditor: boolean;
  showSidebar: boolean;
  showEject: boolean;
  editorWidth: number;
  sidebarWidth: number;
}

export interface EvidenceEntry {
  id: string;
  createdAt: number;
  label: string;
  status?: string;
  data: A2UIInput;
}

interface A2UIState {
  evidence: A2UIInput | null;
  setEvidence: (evidence: A2UIInput) => void;
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
        modelConfig: { provider: "auto", model: "" },
      },
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      layout: {
        showEditor: true,
        showSidebar: true,
        showEject: false,
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
