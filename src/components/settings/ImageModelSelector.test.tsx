import { render, screen, fireEvent } from "@testing-library/react";
import { ImageModelSelector } from "./ImageModelSelector";
import { describe, it, expect, vi } from "vitest";

// Mock lucide icons
vi.mock("lucide-react", () => ({
  ChevronDown: () => <span data-testid="icon-chevron" />,
  Check: () => <span data-testid="icon-check" />,
  Image: () => <span data-testid="icon-image" />,
}));

describe("ImageModelSelector", () => {
  it("renders with Auto-Detect as default", () => {
    render(<ImageModelSelector imageModel={undefined} onImageModelChange={() => {}} />);
    expect(screen.getByText("Auto-Detect")).toBeInTheDocument();
  });

  it("renders with active model name when specified", () => {
    render(<ImageModelSelector imageModel="gemini-3-pro-image" onImageModelChange={() => {}} />);
    expect(screen.getByText("Gemini 3 Pro Image (Nano Banana Pro)")).toBeInTheDocument();
  });

  it("calls onImageModelChange when a model is selected", () => {
    const onChange = vi.fn();
    render(<ImageModelSelector imageModel={undefined} onImageModelChange={onChange} />);

    // Open dropdown
    fireEvent.click(screen.getByText("Auto-Detect"));

    // Select Gemini 3.1 Flash Image (Nano Banana 2)
    const option = screen.getByText(/Gemini 3.1 Flash/i);
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("gemini-3.1-flash-image");
  });
});
