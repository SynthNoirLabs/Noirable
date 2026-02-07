import type { StateCreator } from "zustand";
import type { A2UIInput } from "@/lib/protocol/schema";
import type { EvidenceEntry } from "../types";
import {
  putEvidence,
  deleteEvidence as deleteEvidenceFromDB,
  clearEvidence as clearEvidenceDB,
  getAllEvidence,
} from "@/lib/storage/indexeddb";

export type { EvidenceEntry } from "../types";

interface UndoState {
  evidence: A2UIInput | null;
  activeEvidenceId: string | null;
}

const MAX_UNDO_STACK = 50;
const MAX_EVIDENCE_HISTORY = 200;

export interface EvidenceSlice {
  // Evidence state
  evidence: A2UIInput | null;
  setEvidence: (evidence: A2UIInput) => void;
  evidenceHistory: EvidenceEntry[];
  activeEvidenceId: string | null;
  addEvidence: (entry: EvidenceEntry) => void;
  setActiveEvidenceId: (id: string | null) => void;
  clearHistory: () => void;
  removeEvidence: (id: string) => void;
  hydrateFromDB: () => Promise<void>;

  // Undo/Redo
  undoStack: UndoState[];
  redoStack: UndoState[];
  pushUndoState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const createEvidenceSlice: StateCreator<EvidenceSlice, [], [], EvidenceSlice> = (
  set,
  get
) => ({
  // Evidence state
  evidence: null,
  setEvidence: (evidence) => set({ evidence }),
  evidenceHistory: [],
  activeEvidenceId: null,
  addEvidence: (entry) => {
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
    });
    // Fire-and-forget persist to IndexedDB
    putEvidence(entry).catch(() => {});
  },
  setActiveEvidenceId: (id) => set({ activeEvidenceId: id }),
  clearHistory: () => {
    set({ evidenceHistory: [], activeEvidenceId: null, evidence: null });
    clearEvidenceDB().catch(() => {});
  },
  removeEvidence: (id) => {
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
    });
    deleteEvidenceFromDB(id).catch(() => {});
  },
  hydrateFromDB: async () => {
    const entries = await getAllEvidence();
    if (entries.length > 0) {
      set((state) => {
        // Merge: DB entries that aren't already in memory
        const existingIds = new Set(state.evidenceHistory.map((e) => e.id));
        const newEntries = entries.filter((e) => !existingIds.has(e.id));
        if (newEntries.length === 0) return state;
        const merged = [...state.evidenceHistory, ...newEntries].slice(-MAX_EVIDENCE_HISTORY);
        return { evidenceHistory: merged };
      });
    }
  },

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
});
