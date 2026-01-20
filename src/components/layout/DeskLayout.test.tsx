import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
    expect(layout).toHaveClass("grid-cols-2");
  });

  it("renders noir background layers", () => {
    render(<DeskLayout editor={<div />} preview={<div />} />);
    expect(screen.getByTestId("noir-rain-bg")).toBeInTheDocument();
    expect(screen.getByTestId("noir-case-file")).toBeInTheDocument();
  });
});
