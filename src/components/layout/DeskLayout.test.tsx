import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DeskLayout } from "./DeskLayout";

describe("DeskLayout", () => {
  it("renders editor and preview slots", () => {
    render(<DeskLayout editor={<div>Editor Content</div>} preview={<div>Preview Content</div>} />);
    expect(screen.getByText("Editor Content")).toBeInTheDocument();
    expect(screen.getByText("Preview Content")).toBeInTheDocument();
  });

  it("has split pane structure", () => {
    const { container } = render(<DeskLayout editor={<div />} preview={<div />} />);
    // Check for grid or flex
    const layout = container.firstChild;
    expect(layout).toHaveClass("grid");
    // The main column is minmax(0, 1fr) (not a bare 1fr) so it can shrink below
    // its content width and never overlaps the fixed sidebar.
    expect(layout).toHaveStyle({ gridTemplateColumns: "var(--editor-w) minmax(0, 1fr)" });
  });

  it("uses fixed sidebar with margin when present", () => {
    const { container } = render(
      <DeskLayout editor={<div />} preview={<div />} sidebar={<div />} sidebarWidth={360} />
    );
    const layout = container.firstChild as HTMLElement;
    // Sidebar is now fixed position, grid stays 2-column but reserves space with margin
    expect(layout).toHaveStyle({ gridTemplateColumns: "var(--editor-w) minmax(0, 1fr)" });
    expect(layout).toHaveStyle("margin-right: 360px");
  });

  it("applies CSS variables for resizable widths", () => {
    const { container } = render(
      <DeskLayout
        editor={<div />}
        preview={<div />}
        sidebar={<div />}
        editorWidth={280}
        sidebarWidth={360}
      />
    );
    const layout = container.firstChild as HTMLElement;
    expect(layout).toHaveStyle("--editor-w: 280px");
    expect(layout).toHaveStyle("--sidebar-w: 360px");
  });

  it("hides editor when showEditor is false and shows reopen control", () => {
    render(
      <DeskLayout
        editor={<div>Editor Content</div>}
        preview={<div>Preview Content</div>}
        showEditor={false}
        onToggleEditor={vi.fn()}
      />
    );
    expect(screen.queryByText("Editor Content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show editor/i })).toBeInTheDocument();
  });

  it("renders noir background layers", () => {
    render(<DeskLayout editor={<div />} preview={<div />} />);
    expect(screen.getByTestId("noir-rain-bg")).toBeInTheDocument();
    expect(screen.getByTestId("noir-case-file")).toBeInTheDocument();
  });
});
