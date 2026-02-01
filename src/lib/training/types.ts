import type { A2UIInput } from "@/lib/protocol/schema";

export type TrainingCategory = "form" | "dashboard" | "card" | "layout" | "data" | "mixed";
export type TrainingComplexity = "simple" | "moderate" | "complex";

export interface TrainingExampleMetadata {
  category: TrainingCategory;
  complexity: TrainingComplexity;
  componentsUsed: string[];
  createdAt: number;
  qualityScore?: number; // 1-5 human rating (optional)
}

export interface TrainingExample {
  id: string;
  prompt: string;
  output: A2UIInput;
  metadata: TrainingExampleMetadata;
}

/**
 * JSONL format for OpenAI fine-tuning
 * @see https://platform.openai.com/docs/guides/fine-tuning
 */
export interface FineTuningMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface FineTuningExample {
  messages: FineTuningMessage[];
}
