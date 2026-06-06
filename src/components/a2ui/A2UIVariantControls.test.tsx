import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { A2UIVariantControls } from "./A2UIVariantControls";

function setup(overrides: Partial<React.ComponentProps<typeof A2UIVariantControls>> = {}) {
  const props = {
    variants: 0,
    activeIndex: 0,
    isGenerating: false,
    canIterate: true,
    onGenerateVariants: vi.fn(),
    onSelectVariant: vi.fn(),
    onIterate: vi.fn(),
    ...overrides,
  };
  render(<A2UIVariantControls {...props} />);
  return props;
}

describe("A2UIVariantControls", () => {
  it("renders the generate + iteration actions", () => {
    setup();
    expect(screen.getByLabelText("Generate three takes")).toBeInTheDocument();
    expect(screen.getByText("Make it fancier")).toBeInTheDocument();
    expect(screen.getByText("Simplify")).toBeInTheDocument();
    expect(screen.getByText("Different angle")).toBeInTheDocument();
  });

  it("hides the Take picker until variants are captured", () => {
    setup({ variants: 0 });
    expect(screen.queryByTestId("a2ui-take-picker")).not.toBeInTheDocument();
  });

  it("renders one Take button per captured variant and marks the active one", () => {
    setup({ variants: 3, activeIndex: 1 });
    const picker = screen.getByTestId("a2ui-take-picker");
    expect(picker).toBeInTheDocument();
    expect(screen.getByText("Take 1")).toBeInTheDocument();
    expect(screen.getByText("Take 2")).toBeInTheDocument();
    expect(screen.getByText("Take 3")).toBeInTheDocument();
    expect(screen.getByText("Take 2")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Take 1")).toHaveAttribute("aria-pressed", "false");
  });

  it("fires onGenerateVariants when the gated button is clicked", () => {
    const props = setup();
    fireEvent.click(screen.getByLabelText("Generate three takes"));
    expect(props.onGenerateVariants).toHaveBeenCalledTimes(1);
  });

  it("fires onSelectVariant with the take index", () => {
    const props = setup({ variants: 2, activeIndex: 0 });
    fireEvent.click(screen.getByText("Take 2"));
    expect(props.onSelectVariant).toHaveBeenCalledWith(1);
  });

  it("fires onIterate with the canned instruction for each action", () => {
    const onIterate = vi.fn();
    setup({ onIterate });
    fireEvent.click(screen.getByText("Make it fancier"));
    fireEvent.click(screen.getByText("Simplify"));
    fireEvent.click(screen.getByText("Different angle"));
    expect(onIterate).toHaveBeenCalledTimes(3);
    expect(onIterate.mock.calls[0][0]).toMatch(/richer/i);
    expect(onIterate.mock.calls[1][0]).toMatch(/simpler/i);
    expect(onIterate.mock.calls[2][0]).toMatch(/different layout/i);
  });

  it("disables actions and shows a developing label while generating", () => {
    setup({ canIterate: false, isGenerating: true });
    expect(screen.getByLabelText("Generate three takes")).toBeDisabled();
    expect(screen.getByText("Make it fancier")).toBeDisabled();
    expect(screen.getByText("Developing…")).toBeInTheDocument();
  });

  it("locks the Take picker while a stream is in flight (no clear()-races)", () => {
    const props = setup({ variants: 3, activeIndex: 0, isStreaming: true });
    const take2 = screen.getByText("Take 2");
    expect(take2).toBeDisabled();
    fireEvent.click(take2);
    expect(props.onSelectVariant).not.toHaveBeenCalled();
  });
});
