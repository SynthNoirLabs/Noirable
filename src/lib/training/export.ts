import type { TrainingExample, FineTuningExample } from "./types";

/**
 * System prompt for fine-tuned model (stripped of persona for cleaner training)
 */
const FINE_TUNE_SYSTEM_PROMPT = `You are synthNoirUI, a noir-themed UI generation assistant.

RULES:
1. Output ONLY valid A2UI JSON - no explanations, no markdown
2. Use ONLY these component types: text, card, container, row, column, grid, heading, paragraph, callout, badge, divider, list, table, stat, tabs, image, input, textarea, select, checkbox, button
3. Maintain noir aesthetic: dark themes, amber accents, typewriter fonts, detective terminology
4. Keep responses concise and structured
5. For images, use the "prompt" field with noir-themed descriptions

STYLE GUIDELINES:
- Use "CASE FILE", "DOSSIER", "EVIDENCE" in headings
- Status values: "active", "archived", "missing", "redacted"
- Priority values: "low", "normal", "high", "critical"`;

/**
 * Convert TrainingExample to OpenAI fine-tuning format
 */
export function toFineTuningExample(example: TrainingExample): FineTuningExample {
  return {
    messages: [
      {
        role: "system",
        content: FINE_TUNE_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: example.prompt,
      },
      {
        role: "assistant",
        content: JSON.stringify(example.output),
      },
    ],
  };
}

/**
 * Export training examples to JSONL format for OpenAI fine-tuning
 * @see https://platform.openai.com/docs/guides/fine-tuning/preparing-your-dataset
 */
export function exportToJSONL(examples: TrainingExample[]): string {
  return examples.map((example) => JSON.stringify(toFineTuningExample(example))).join("\n");
}

/**
 * Export training examples to raw JSON format (for backup/analysis)
 */
export function exportToJSON(examples: TrainingExample[]): string {
  return JSON.stringify(examples, null, 2);
}

/**
 * Generate dataset statistics
 */
export interface DatasetStats {
  totalExamples: number;
  byCategory: Record<string, number>;
  byComplexity: Record<string, number>;
  avgComponentTypes: number;
  componentTypeFrequency: Record<string, number>;
  qualityScoreDistribution: Record<number, number>;
  ratedExamples: number;
}

export function computeDatasetStats(examples: TrainingExample[]): DatasetStats {
  const stats: DatasetStats = {
    totalExamples: examples.length,
    byCategory: {},
    byComplexity: {},
    avgComponentTypes: 0,
    componentTypeFrequency: {},
    qualityScoreDistribution: {},
    ratedExamples: 0,
  };

  if (examples.length === 0) return stats;

  let totalComponentTypes = 0;

  for (const example of examples) {
    const { metadata } = example;

    // Category distribution
    stats.byCategory[metadata.category] = (stats.byCategory[metadata.category] || 0) + 1;

    // Complexity distribution
    stats.byComplexity[metadata.complexity] = (stats.byComplexity[metadata.complexity] || 0) + 1;

    // Component type frequency
    for (const type of metadata.componentsUsed) {
      stats.componentTypeFrequency[type] = (stats.componentTypeFrequency[type] || 0) + 1;
    }
    totalComponentTypes += metadata.componentsUsed.length;

    // Quality score distribution
    if (metadata.qualityScore !== undefined) {
      stats.qualityScoreDistribution[metadata.qualityScore] =
        (stats.qualityScoreDistribution[metadata.qualityScore] || 0) + 1;
      stats.ratedExamples++;
    }
  }

  stats.avgComponentTypes = totalComponentTypes / examples.length;

  return stats;
}
