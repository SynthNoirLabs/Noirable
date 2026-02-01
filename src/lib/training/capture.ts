import type { A2UIInput } from "@/lib/protocol/schema";
import type { TrainingExample } from "./types";
import { extractComponentTypes, inferCategory, inferComplexity } from "./inference";

/**
 * Generate a unique ID for training examples
 */
function generateId(): string {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a training example from a successful generation
 * @param prompt - The user's original prompt
 * @param output - The validated A2UI output
 * @returns TrainingExample ready for storage
 */
export function createTrainingExample(prompt: string, output: A2UIInput): TrainingExample {
  return {
    id: generateId(),
    prompt,
    output,
    metadata: {
      category: inferCategory(output),
      complexity: inferComplexity(output),
      componentsUsed: extractComponentTypes(output),
      createdAt: Date.now(),
    },
  };
}

/**
 * Validate if a prompt/output pair is worth capturing
 * Filters out trivial or low-quality examples
 */
export function shouldCapture(prompt: string, output: A2UIInput): boolean {
  // Prompt must have meaningful content
  if (!prompt || prompt.trim().length < 5) {
    return false;
  }

  // Count components
  const components = extractComponentTypes(output);

  // Skip single-component trivial outputs (unless they have rich content)
  if (components.length === 1 && components[0] === "text") {
    return false;
  }

  return true;
}
