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

export interface PromptEntry {
  id: string;
  createdAt: number;
  text: string;
  evidenceId?: string;
}

interface UndoState {
  evidence: A2UIInput | null;
  activeEvidenceId: string | null;
}

interface A2UIState {
  // Evidence state
  evidence: A2UIInput | null;
  setEvidence: (evidence: A2UIInput) => void;
  evidenceHistory: EvidenceEntry[];
  activeEvidenceId: string | null;
  addEvidence: (entry: EvidenceEntry) => void;
  setActiveEvidenceId: (id: string | null) => void;
  clearHistory: () => void;
  removeEvidence: (id: string) => void;

  // Undo/Redo
  undoStack: UndoState[];
  redoStack: UndoState[];
  pushUndoState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Prompt history
  promptHistory: PromptEntry[];
  addPrompt: (text: string, evidenceId?: string) => void;
  clearPromptHistory: () => void;

  // Settings & Layout
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  layout: Layout;
  updateLayout: (layout: Partial<Layout>) => void;
}

const MAX_UNDO_STACK = 50;
const MAX_PROMPT_HISTORY = 100;

export const useA2UIStore = create<A2UIState>()(
  persist(
    (set, get) => ({
      // Evidence state
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
      clearHistory: () =>
        set({ evidenceHistory: [], activeEvidenceId: null, evidence: null }),
      removeEvidence: (id) =>
        set((state) => {
          const newHistory = state.evidenceHistory.filter((e) => e.id !== id);
          const newActiveId =
            state.activeEvidenceId === id
              ? (newHistory[newHistory.length - 1]?.id ?? null)
              : state.activeEvidenceId;
          const newEvidence =
            state.activeEvidenceId === id
              ? (newHistory[newHistory.length - 1]?.data ?? null)
              : state.evidence;
          return {
            evidenceHistory: newHistory,
            activeEvidenceId: newActiveId,
            evidence: newEvidence,
          };
        }),

      // Undo/Redo
      undoStack: [],
      redoStack: [],
      pushUndoState: () =>
        set((state) => ({
          undoStack: [
            ...state.undoStack.slice(-MAX_UNDO_STACK + 1),
            {
              evidence: state.evidence,
              activeEvidenceId: state.activeEvidenceId,
            },
          ],
          redoStack: [], // Clear redo on new action
        })),
      undo: () => {
        const state = get();
        if (state.undoStack.length === 0) return;

        const previousState = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);

        set({
          undoStack: newUndoStack,
          redoStack: [
            ...state.redoStack,
            {
              evidence: state.evidence,
              activeEvidenceId: state.activeEvidenceId,
            },
          ],
          evidence: previousState.evidence,
          activeEvidenceId: previousState.activeEvidenceId,
        });
      },
      redo: () => {
        const state = get();
        if (state.redoStack.length === 0) return;

        const nextState = state.redoStack[state.redoStack.length - 1];
        const newRedoStack = state.redoStack.slice(0, -1);

        set({
          redoStack: newRedoStack,
          undoStack: [
            ...state.undoStack,
            {
              evidence: state.evidence,
              activeEvidenceId: state.activeEvidenceId,
            },
          ],
          evidence: nextState.evidence,
          activeEvidenceId: nextState.activeEvidenceId,
        });
      },
      canUndo: () => get().undoStack.length > 0,
      canRedo: () => get().redoStack.length > 0,

      // Prompt history
      promptHistory: [],
      addPrompt: (text, evidenceId) =>
        set((state) => ({
          promptHistory: [
            ...state.promptHistory.slice(-MAX_PROMPT_HISTORY + 1),
            {
              id:
                globalThis.crypto?.randomUUID() ||
                `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              createdAt: Date.now(),
              text,
              evidenceId,
            },
          ],
        })),
      clearPromptHistory: () => set({ promptHistory: [] }),

      // Settings
      settings: {
        typewriterSpeed: 30,
        soundEnabled: true,
        modelConfig: { provider: "auto", model: "" },
      },
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      // Layout
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
      name: "a2ui-storage",
      partialize: (state) => ({
        settings: state.settings,
        layout: state.layout,
        evidence: state.evidence,
        evidenceHistory: state.evidenceHistory,
        activeEvidenceId: state.activeEvidenceId,
        promptHistory: state.promptHistory,
        // Note: undoStack/redoStack intentionally not persisted
      }),
    },
  ),
);
