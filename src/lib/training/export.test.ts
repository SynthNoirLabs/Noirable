import { describe, it, expect } from "vitest";
import { toFineTuningExample, exportToJSONL, exportToJSON, computeDatasetStats } from "./export";
import type { TrainingExample } from "./types";

const mockExample: TrainingExample = {
  id: "test-1",
  prompt: "Create a login form",
  output: {
    type: "container",
    children: [
      { type: "input", label: "Email", placeholder: "Enter email" },
      { type: "input", label: "Password", placeholder: "Enter password" },
      { type: "button", label: "Login" },
    ],
  },
  metadata: {
    category: "form",
    complexity: "moderate",
    componentsUsed: ["container", "input", "button"],
    createdAt: 1706500000000,
    qualityScore: 4,
  },
};

const mockExample2: TrainingExample = {
  id: "test-2",
  prompt: "Show a stats dashboard",
  output: {
    type: "grid",
    columns: "2",
    children: [
      { type: "stat", label: "Users", value: "1000" },
      { type: "stat", label: "Revenue", value: "$50K" },
    ],
  },
  metadata: {
    category: "dashboard",
    complexity: "simple",
    componentsUsed: ["grid", "stat"],
    createdAt: 1706500001000,
  },
};

describe("toFineTuningExample", () => {
  it("converts TrainingExample to OpenAI format", () => {
    const result = toFineTuningExample(mockExample);

    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].role).toBe("system");
    expect(result.messages[1].role).toBe("user");
    expect(result.messages[2].role).toBe("assistant");
  });

  it("includes user prompt correctly", () => {
    const result = toFineTuningExample(mockExample);
    expect(result.messages[1].content).toBe("Create a login form");
  });

  it("stringifies output as assistant message", () => {
    const result = toFineTuningExample(mockExample);
    const assistantContent = result.messages[2].content;

    expect(() => JSON.parse(assistantContent)).not.toThrow();
    expect(JSON.parse(assistantContent)).toEqual(mockExample.output);
  });

  it("includes system prompt with A2UI rules", () => {
    const result = toFineTuningExample(mockExample);
    const systemContent = result.messages[0].content;

    expect(systemContent).toContain("synthNoirUI");
    expect(systemContent).toContain("A2UI JSON");
    expect(systemContent).toContain("component types");
  });
});

describe("exportToJSONL", () => {
  it("exports single example as JSONL line", () => {
    const result = exportToJSONL([mockExample]);
    const lines = result.split("\n");

    expect(lines).toHaveLength(1);
    expect(() => JSON.parse(lines[0])).not.toThrow();
  });

  it("exports multiple examples as separate lines", () => {
    const result = exportToJSONL([mockExample, mockExample2]);
    const lines = result.split("\n");

    expect(lines).toHaveLength(2);
    lines.forEach((line) => {
      expect(() => JSON.parse(line)).not.toThrow();
    });
  });

  it("exports empty array as empty string", () => {
    const result = exportToJSONL([]);
    expect(result).toBe("");
  });

  it("each line is valid OpenAI format", () => {
    const result = exportToJSONL([mockExample, mockExample2]);
    const lines = result.split("\n");

    lines.forEach((line) => {
      const parsed = JSON.parse(line);
      expect(parsed).toHaveProperty("messages");
      expect(parsed.messages).toHaveLength(3);
    });
  });
});

describe("exportToJSON", () => {
  it("exports array as formatted JSON", () => {
    const result = exportToJSON([mockExample]);

    expect(() => JSON.parse(result)).not.toThrow();
    expect(JSON.parse(result)).toEqual([mockExample]);
  });

  it("preserves all metadata", () => {
    const result = exportToJSON([mockExample]);
    const parsed = JSON.parse(result);

    expect(parsed[0].metadata.qualityScore).toBe(4);
    expect(parsed[0].metadata.category).toBe("form");
  });
});

describe("computeDatasetStats", () => {
  it("returns zeroed stats for empty array", () => {
    const stats = computeDatasetStats([]);

    expect(stats.totalExamples).toBe(0);
    expect(stats.avgComponentTypes).toBe(0);
    expect(stats.ratedExamples).toBe(0);
  });

  it("computes total examples", () => {
    const stats = computeDatasetStats([mockExample, mockExample2]);
    expect(stats.totalExamples).toBe(2);
  });

  it("computes category distribution", () => {
    const stats = computeDatasetStats([mockExample, mockExample2]);

    expect(stats.byCategory).toEqual({
      form: 1,
      dashboard: 1,
    });
  });

  it("computes complexity distribution", () => {
    const stats = computeDatasetStats([mockExample, mockExample2]);

    expect(stats.byComplexity).toEqual({
      moderate: 1,
      simple: 1,
    });
  });

  it("computes average component types", () => {
    const stats = computeDatasetStats([mockExample, mockExample2]);
    // mockExample has 3 types, mockExample2 has 2 types = avg 2.5
    expect(stats.avgComponentTypes).toBe(2.5);
  });

  it("computes component type frequency", () => {
    const stats = computeDatasetStats([mockExample, mockExample2]);

    expect(stats.componentTypeFrequency).toEqual({
      container: 1,
      input: 1,
      button: 1,
      grid: 1,
      stat: 1,
    });
  });

  it("computes quality score distribution", () => {
    const stats = computeDatasetStats([mockExample, mockExample2]);

    expect(stats.qualityScoreDistribution).toEqual({ 4: 1 });
    expect(stats.ratedExamples).toBe(1);
  });
});
