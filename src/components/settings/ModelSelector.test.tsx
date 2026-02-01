import { render, screen, fireEvent } from "@testing-library/react";
import { ModelSelector } from "./ModelSelector";
import { describe, it, expect, vi } from "vitest";

// Mock lucide icons
vi.mock("lucide-react", () => ({
  ChevronDown: () => <span data-testid="icon-chevron" />,
  Check: () => <span data-testid="icon-check" />,
  Server: () => <span data-testid="icon-server" />,
  Cpu: () => <span data-testid="icon-cpu" />,
}));

describe("ModelSelector", () => {
  it("renders current provider", () => {
    render(
      <ModelSelector
        modelConfig={{ provider: "openai", model: "gpt-4" }}
        onConfigChange={() => {}}
      />
    );
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
  });

  it("calls onConfigChange when provider changes", () => {
    const onChange = vi.fn();
    render(
      <ModelSelector modelConfig={{ provider: "auto", model: "" }} onConfigChange={onChange} />
    );

    // Open provider dropdown
    fireEvent.click(screen.getByText("Auto-Detect"));

    // Select Anthropic
    fireEvent.click(screen.getByText("Anthropic"));

    expect(onChange).toHaveBeenCalled();
    // Check first arg of call
    const callArg = onChange.mock.calls[0][0];
    expect(callArg.provider).toBe("anthropic");
  });
});
