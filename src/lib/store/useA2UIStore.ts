import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
import { A2UIInput } from "@/lib/protocol/schema";
import { AIProviderType, AVAILABLE_MODELS } from "@/lib/ai/models";
import type { TrainingExample } from "@/lib/training";

export type { AIProviderType };
export { AVAILABLE_MODELS };

export interface ModelConfig {
  provider: AIProviderType;
  model: string;
}

export type AmbientIntensity = "low" | "medium" | "high";

export interface AmbientSettings {
  rainEnabled: boolean;
  /** 0..1 volume scale for rain audio (intensity still applies). */
  rainVolume: number;
  fogEnabled: boolean;
  intensity: AmbientIntensity;
  crackleEnabled: boolean;
  crackleVolume: number;
}

export interface Settings {
  typewriterSpeed: number;
  soundEnabled: boolean;
  ttsEnabled?: boolean;
  musicEnabled?: boolean;
  modelConfig: ModelConfig;
  ambient: AmbientSettings;
}

export type SettingsUpdate = Partial<Omit<Settings, "ambient">> & {
  ambient?: Partial<AmbientSettings>;
};

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

// Re-export TrainingExample for convenience
export type { TrainingExample } from "@/lib/training";

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

  // Training data collection
  trainingExamples: TrainingExample[];
  addTrainingExample: (example: TrainingExample) => void;
  removeTrainingExample: (id: string) => void;
  clearTrainingExamples: () => void;
  rateTrainingExample: (id: string, score: number) => void;

  // Settings & Layout
  settings: Settings;
  updateSettings: (settings: SettingsUpdate) => void;
  layout: Layout;
  updateLayout: (layout: Partial<Layout>) => void;
}

const MAX_UNDO_STACK = 50;
const MAX_EVIDENCE_HISTORY = 200;
const MAX_PROMPT_HISTORY = 100;
const MAX_TRAINING_EXAMPLES = 1000;
const STORAGE_DEBOUNCE_MS = 300;

function createDebouncedStorage<S>(storage: PersistStorage<S>, delayMs: number): PersistStorage<S> {
  const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    getItem: storage.getItem,
    removeItem: (name) => {
      const timeout = timeouts.get(name);
      if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(name);
      }
      return storage.removeItem(name);
    },
    setItem: (name, value) => {
      const timeout = timeouts.get(name);
      if (timeout) {
        clearTimeout(timeout);
      }
      const handle = setTimeout(() => {
        storage.setItem(name, value);
        timeouts.delete(name);
      }, delayMs);
      timeouts.set(name, handle);
    },
  };
}

type PersistedState = {
  settings: Settings;
  layout: Layout;
  evidence: A2UIInput | null;
  evidenceHistory: EvidenceEntry[];
  activeEvidenceId: string | null;
  promptHistory: PromptEntry[];
  trainingExamples: TrainingExample[];
};

const baseStorage = createJSONStorage<PersistedState>(() => localStorage);
const storage = baseStorage ? createDebouncedStorage(baseStorage, STORAGE_DEBOUNCE_MS) : undefined;

export const useA2UIStore = create<A2UIState>()(
  persist(
    (set, get) => ({
      // Evidence state
      evidence: null,
      setEvidence: (evidence) => set({ evidence }),
      evidenceHistory: [],
      activeEvidenceId: null,
      addEvidence: (entry) =>
        set((state) => {
          const nextHistory = [...state.evidenceHistory, entry];
          const trimmedHistory =
            nextHistory.length > MAX_EVIDENCE_HISTORY
              ? nextHistory.slice(-MAX_EVIDENCE_HISTORY)
              : nextHistory;
          return {
            evidenceHistory: trimmedHistory,
            activeEvidenceId: entry.id,
          };
        }),
      setActiveEvidenceId: (id) => set({ activeEvidenceId: id }),
      clearHistory: () => set({ evidenceHistory: [], activeEvidenceId: null, evidence: null }),
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

      // Training data collection
      trainingExamples: [],
      addTrainingExample: (example) =>
        set((state) => ({
          trainingExamples: [...state.trainingExamples.slice(-MAX_TRAINING_EXAMPLES + 1), example],
        })),
      removeTrainingExample: (id) =>
        set((state) => ({
          trainingExamples: state.trainingExamples.filter((e) => e.id !== id),
        })),
      clearTrainingExamples: () => set({ trainingExamples: [] }),
      rateTrainingExample: (id, score) =>
        set((state) => ({
          trainingExamples: state.trainingExamples.map((e) =>
            e.id === id ? { ...e, metadata: { ...e.metadata, qualityScore: score } } : e
          ),
        })),

      // Settings
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
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            ambient: newSettings.ambient
              ? { ...state.settings.ambient, ...newSettings.ambient }
              : state.settings.ambient,
          },
        })),

      // Layout
      layout: {
        showEditor: true,
        showSidebar: true,
        showEject: false,
        editorWidth: 300,
        sidebarWidth: 360,
      },
      updateLayout: (newLayout) => set((state) => ({ layout: { ...state.layout, ...newLayout } })),
    }),
    {
      name: "a2ui-storage",
      ...(storage ? { storage } : {}),
      partialize: (state) => ({
        settings: state.settings,
        layout: state.layout,
        evidence: state.evidence,
        evidenceHistory: state.evidenceHistory.slice(-MAX_EVIDENCE_HISTORY),
        activeEvidenceId: state.activeEvidenceId,
        promptHistory: state.promptHistory.slice(-MAX_PROMPT_HISTORY),
        trainingExamples: state.trainingExamples.slice(-MAX_TRAINING_EXAMPLES),
        // Note: undoStack/redoStack intentionally not persisted
      }),
    }
  )
);
