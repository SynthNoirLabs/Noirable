import type { StateCreator } from "zustand";
import type { TrainingExample } from "@/lib/training";

const MAX_TRAINING_EXAMPLES = 1000;

export interface TrainingSlice {
  trainingExamples: TrainingExample[];
  addTrainingExample: (example: TrainingExample) => void;
  removeTrainingExample: (id: string) => void;
  clearTrainingExamples: () => void;
  rateTrainingExample: (id: string, score: number) => void;
}

export const createTrainingSlice: StateCreator<TrainingSlice, [], [], TrainingSlice> = (set) => ({
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
});
