import { render, screen } from "@testing-library/react";
import { TrainingDataPanel } from "./TrainingDataPanel";
import { describe, it, expect, vi } from "vitest";

// Mock store
const mockUseA2UIStore = vi.fn();
vi.mock("@/lib/store/useA2UIStore", () => ({
  useA2UIStore: () => mockUseA2UIStore(),
}));

// Mock training lib
vi.mock("@/lib/training", () => ({
  exportToJSONL: vi.fn(() => "jsonl"),
  exportToJSON: vi.fn(() => "json"),
  computeDatasetStats: vi.fn(() => ({
    totalExamples: 10,
    byCategory: { form: 5 },
    byComplexity: {},
    avgComponentTypes: 3,
    componentTypeFrequency: {},
    qualityScoreDistribution: {},
    ratedExamples: 2,
  })),
}));

// Mock URL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

describe("TrainingDataPanel", () => {
  it("renders with empty state", () => {
    mockUseA2UIStore.mockReturnValue({
      trainingExamples: [],
      removeTrainingExample: vi.fn(),
      clearTrainingExamples: vi.fn(),
      rateTrainingExample: vi.fn(),
    });

    render(<TrainingDataPanel onClose={() => {}} />);
    expect(screen.getByText("NO DATA COLLECTED")).toBeInTheDocument();
  });

  it("renders with data", () => {
    mockUseA2UIStore.mockReturnValue({
      trainingExamples: [
        {
          id: "1",
          prompt: "Test prompt",
          output: {},
          metadata: {
            category: "form",
            complexity: "simple",
            componentsUsed: [],
            createdAt: Date.now(),
          },
        },
      ],
      removeTrainingExample: vi.fn(),
      clearTrainingExamples: vi.fn(),
      rateTrainingExample: vi.fn(),
    });

    render(<TrainingDataPanel onClose={() => {}} />);
    // Check prompt is rendered (using text content match for quote)
    expect(screen.getByText((content) => content.includes("Test prompt"))).toBeInTheDocument();
    // Check stats are rendered (from mock)
    expect(screen.getByText("10")).toBeInTheDocument(); // total examples from stats mock
  });
});
