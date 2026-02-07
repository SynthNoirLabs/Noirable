import { create } from "zustand";
import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
import type { A2UIInput } from "@/lib/protocol/schema";
import { AVAILABLE_MODELS } from "@/lib/ai/model-registry";
import type { TrainingExample } from "@/lib/training";
import { encryptValue, decryptValue } from "@/lib/customization/crypto";

import { createEvidenceSlice, type EvidenceSlice } from "./slices/evidenceSlice";
import { createPromptSlice, type PromptSlice } from "./slices/promptSlice";
import { createTrainingSlice, type TrainingSlice } from "./slices/trainingSlice";
import { createSettingsSlice, type SettingsSlice } from "./slices/settingsSlice";
import type { Settings, EvidenceEntry, PromptEntry, Layout } from "./types";

// Re-export all public types for backward compatibility
export type {
  AIProviderType,
  AestheticId,
  ModelConfig,
  AmbientIntensity,
  AmbientSettings,
  Settings,
  SettingsUpdate,
  EvidenceEntry,
  PromptEntry,
  Layout,
  TrainingExample,
} from "./types";
export { AVAILABLE_MODELS };

export type A2UIState = EvidenceSlice & PromptSlice & TrainingSlice & SettingsSlice;

const STORAGE_DEBOUNCE_MS = 300;
const MAX_EVIDENCE_HISTORY = 200;
const MAX_PROMPT_HISTORY = 100;
const MAX_TRAINING_EXAMPLES = 1000;

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

/**
 * Wraps a PersistStorage to encrypt/decrypt the `settings.apiKeys` field.
 * Other fields pass through unchanged.
 */
function createEncryptedApiKeyStorage(
  inner: PersistStorage<PersistedState>
): PersistStorage<PersistedState> {
  return {
    getItem: async (name) => {
      const stored = await inner.getItem(name);
      if (!stored?.state?.settings?.apiKeys) return stored;

      const keys = stored.state.settings.apiKeys;
      const decrypted: Record<string, string | undefined> = {};

      for (const [k, v] of Object.entries(keys)) {
        if (v) {
          const plain = await decryptValue(v);
          if (plain !== null) {
            decrypted[k] = plain;
          }
          // If decryption fails (key rotated), drop the value
        }
      }

      return {
        ...stored,
        state: {
          ...stored.state,
          settings: {
            ...stored.state.settings,
            apiKeys:
              Object.keys(decrypted).length > 0 ? (decrypted as Settings["apiKeys"]) : undefined,
          },
        },
      };
    },

    setItem: async (name, value) => {
      const apiKeys = value.state?.settings?.apiKeys;
      if (!apiKeys) {
        return inner.setItem(name, value);
      }

      const encrypted: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(apiKeys)) {
        if (v) {
          encrypted[k] = await encryptValue(v);
        }
      }

      const updated = {
        ...value,
        state: {
          ...value.state,
          settings: {
            ...value.state.settings,
            apiKeys: encrypted as Settings["apiKeys"],
          },
        },
      };

      return inner.setItem(name, updated);
    },

    removeItem: (name) => inner.removeItem(name),
  };
}

const rawStorage = createJSONStorage<PersistedState>(() => localStorage);
const encryptedStorage = rawStorage ? createEncryptedApiKeyStorage(rawStorage) : undefined;
const storage = encryptedStorage
  ? createDebouncedStorage(encryptedStorage, STORAGE_DEBOUNCE_MS)
  : undefined;

export const useA2UIStore = create<A2UIState>()(
  persist(
    (...a) => ({
      ...createEvidenceSlice(...a),
      ...createPromptSlice(...a),
      ...createTrainingSlice(...a),
      ...createSettingsSlice(...a),
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
