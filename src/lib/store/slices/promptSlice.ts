import type { StateCreator } from "zustand";
import type { PromptEntry } from "../types";

export type { PromptEntry } from "../types";

const MAX_PROMPT_HISTORY = 100;

export interface PromptSlice {
  promptHistory: PromptEntry[];
  addPrompt: (text: string, evidenceId?: string) => void;
  clearPromptHistory: () => void;
}

export const createPromptSlice: StateCreator<PromptSlice, [], [], PromptSlice> = (set) => ({
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
});
