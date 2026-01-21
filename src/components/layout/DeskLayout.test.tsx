import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DeskLayout } from "./DeskLayout";

describe("DeskLayout", () => {
  it("renders editor and preview slots", () => {
    render(
      <DeskLayout
        editor={<div>Editor Content</div>}
        preview={<div>Preview Content</div>}
      />,
    );
    expect(screen.getByText("Editor Content")).toBeInTheDocument();
    expect(screen.getByText("Preview Content")).toBeInTheDocument();
  });

  it("has split pane structure", () => {
    const { container } = render(
      <DeskLayout editor={<div />} preview={<div />} />,
    );
    // Check for grid or flex
    const layout = container.firstChild;
    expect(layout).toHaveClass("grid");
    expect(layout).toHaveClass("grid-cols-[clamp(280px,28vw,360px)_1fr]");
  });

  it("uses widened sidebar width when present", () => {
    const { container } = render(
      <DeskLayout editor={<div />} preview={<div />} sidebar={<div />} />,
    );
    const layout = container.firstChild;
    expect(layout).toHaveClass(
      "grid-cols-[clamp(280px,28vw,360px)_1fr_clamp(320px,24vw,420px)]",
    );
  });

  it("hides editor when showEditor is false and shows reopen control", () => {
    render(
      <DeskLayout
        editor={<div>Editor Content</div>}
        preview={<div>Preview Content</div>}
        showEditor={false}
        onToggleEditor={vi.fn()}
      />,
    );
    expect(screen.queryByText("Editor Content")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show editor/i }),
    ).toBeInTheDocument();
  });

  it("renders noir background layers", () => {
    render(<DeskLayout editor={<div />} preview={<div />} />);
    expect(screen.getByTestId("noir-rain-bg")).toBeInTheDocument();
    expect(screen.getByTestId("noir-case-file")).toBeInTheDocument();
  });
});
