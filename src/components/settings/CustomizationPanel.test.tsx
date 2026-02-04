import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomizationPanel } from "./CustomizationPanel";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("CustomizationPanel", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  it("renders when open", () => {
    render(<CustomizationPanel {...defaultProps} />);
    expect(screen.getByText("Customization")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CustomizationPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Customization")).not.toBeInTheDocument();
  });

  it("renders all tabs", () => {
    render(<CustomizationPanel {...defaultProps} />);
    expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /colors/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /audio/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /voice/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /effects/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /advanced/i })).toBeInTheDocument();
  });

  it("switches tabs on click", () => {
    render(<CustomizationPanel {...defaultProps} />);

    const colorsTab = screen.getByRole("tab", { name: /colors/i });
    fireEvent.click(colorsTab);

    expect(colorsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Color Customization")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<CustomizationPanel {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText("Close panel");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    render(<CustomizationPanel {...defaultProps} onClose={onClose} />);

    // The backdrop is the first motion.div
    const backdrop = document.querySelector(".fixed.inset-0");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it("shows profile tab content by default", () => {
    render(<CustomizationPanel {...defaultProps} />);
    expect(screen.getByText("Profile Management")).toBeInTheDocument();
  });
});
