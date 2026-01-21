import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EjectPanel } from "./EjectPanel";
import type { A2UIInput } from "@/lib/protocol/schema";

const mockEvidence: A2UIInput = {
  type: "container",
  style: { padding: "md", gap: "sm" },
  children: [
    { type: "heading", level: 2, text: "Test Case" },
    { type: "text", content: "Evidence content", priority: "normal" },
  ],
};

describe("EjectPanel", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders empty state when no evidence provided", () => {
    render(<EjectPanel evidence={null} />);

    expect(screen.getByText("NO EVIDENCE LOADED")).toBeInTheDocument();
    expect(
      screen.getByText("Generate UI via chat to enable code export"),
    ).toBeInTheDocument();
  });

  it("renders React code tab by default", () => {
    render(<EjectPanel evidence={mockEvidence} />);

    expect(screen.getByRole("button", { name: /react/i })).toHaveClass(
      "text-noir-amber",
    );
    expect(screen.getByText(/function EvidenceComponent/)).toBeInTheDocument();
  });

  it("switches to JSON tab when clicked", () => {
    render(<EjectPanel evidence={mockEvidence} />);

    const jsonTab = screen.getByRole("button", { name: /json/i });
    fireEvent.click(jsonTab);

    expect(jsonTab).toHaveClass("text-noir-amber");
    expect(screen.getByText(/"type": "container"/)).toBeInTheDocument();
  });

  it("shows copy button", () => {
    render(<EjectPanel evidence={mockEvidence} />);

    expect(
      screen.getByRole("button", { name: /copy to clipboard/i }),
    ).toBeInTheDocument();
  });

  it("copies code to clipboard on copy button click", async () => {
    render(<EjectPanel evidence={mockEvidence} />);

    const copyButton = screen.getByRole("button", {
      name: /copy to clipboard/i,
    });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("function EvidenceComponent"),
    );
  });

  it("shows copied state after copying", async () => {
    render(<EjectPanel evidence={mockEvidence} />);

    const copyButton = screen.getByRole("button", {
      name: /copy to clipboard/i,
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<EjectPanel evidence={mockEvidence} onClose={handleClose} />);

    const closeButton = screen.getByRole("button", {
      name: /close eject panel/i,
    });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("displays character count in footer", () => {
    render(<EjectPanel evidence={mockEvidence} />);

    expect(screen.getByText(/chars$/)).toBeInTheDocument();
    expect(screen.getByText("React + Tailwind")).toBeInTheDocument();
  });

  it("updates footer text when switching to JSON tab", () => {
    render(<EjectPanel evidence={mockEvidence} />);

    const jsonTab = screen.getByRole("button", { name: /json/i });
    fireEvent.click(jsonTab);

    expect(screen.getByText("A2UI JSON")).toBeInTheDocument();
  });
});
