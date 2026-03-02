import { render, fireEvent } from "@testing-library/react";
import { ResizeHandle } from "./ResizeHandle";
import { describe, it, expect, vi } from "vitest";

describe("ResizeHandle", () => {
  it("renders correctly", () => {
    const { container } = render(
      <ResizeHandle
        position="left"
        size={300}
        min={200}
        max={500}
        defaultSize={300}
        onChange={() => {}}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("role", "separator");
  });

  it("calls onChange with defaultSize on double click", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ResizeHandle
        position="right"
        size={400}
        min={200}
        max={500}
        defaultSize={300}
        onChange={onChange}
      />
    );

    // Check render
    expect(container.firstChild).toBeInTheDocument();

    // Double click
    fireEvent.doubleClick(container.firstChild!);
    expect(onChange).toHaveBeenCalledWith(300);
  });

  it("is focusable via keyboard", () => {
    const { container } = render(
      <ResizeHandle
        position="left"
        size={300}
        min={200}
        max={500}
        defaultSize={300}
        onChange={() => {}}
      />
    );
    expect(container.firstChild).toHaveAttribute("tabIndex", "0");
  });

  describe("keyboard interactions", () => {
    it("adjusts size with arrow keys (position=left)", () => {
      const onChange = vi.fn();
      const { container } = render(
        <ResizeHandle
          position="left"
          size={300}
          min={200}
          max={500}
          defaultSize={300}
          onChange={onChange}
        />
      );
      const handle = container.firstChild!;

      // Position left (Sidebar):
      // ArrowRight -> move separator right -> decrease sidebar width (size)
      fireEvent.keyDown(handle, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith(290);

      onChange.mockClear();
      // ArrowLeft -> move separator left -> increase sidebar width (size)
      fireEvent.keyDown(handle, { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith(310);
    });

    it("adjusts size with arrow keys (position=right)", () => {
      const onChange = vi.fn();
      const { container } = render(
        <ResizeHandle
          position="right"
          size={300}
          min={200}
          max={500}
          defaultSize={300}
          onChange={onChange}
        />
      );
      const handle = container.firstChild!;

      // Position right (Editor):
      // ArrowRight -> move separator right -> increase editor width (size)
      fireEvent.keyDown(handle, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith(310);

      onChange.mockClear();
      // ArrowLeft -> move separator left -> decrease editor width (size)
      fireEvent.keyDown(handle, { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith(290);
    });

    it("handles Home/End keys", () => {
      const onChange = vi.fn();
      const { container, rerender } = render(
        <ResizeHandle
          position="right"
          size={300}
          min={200}
          max={500}
          defaultSize={300}
          onChange={onChange}
        />
      );
      const handle = container.firstChild!;

      // pos="right" (Editor)
      // Home (move far left) -> min size
      fireEvent.keyDown(handle, { key: "Home" });
      expect(onChange).toHaveBeenCalledWith(200); // min

      onChange.mockClear();
      // End (move far right) -> max size
      fireEvent.keyDown(handle, { key: "End" });
      expect(onChange).toHaveBeenCalledWith(500); // max

      // Test pos="left" (Sidebar)
      rerender(
        <ResizeHandle
          position="left"
          size={300}
          min={200}
          max={500}
          defaultSize={300}
          onChange={onChange}
        />
      );

      onChange.mockClear();
      // Home (move far left) -> Sidebar grows -> max size
      fireEvent.keyDown(handle, { key: "Home" });
      expect(onChange).toHaveBeenCalledWith(500); // max

      onChange.mockClear();
      // End (move far right) -> Sidebar shrinks -> min size
      fireEvent.keyDown(handle, { key: "End" });
      expect(onChange).toHaveBeenCalledWith(200); // min
    });

    it("resets to default on Enter", () => {
      const onChange = vi.fn();
      const { container } = render(
        <ResizeHandle
          position="right"
          size={400}
          min={200}
          max={500}
          defaultSize={300}
          onChange={onChange}
        />
      );
      const handle = container.firstChild!;

      fireEvent.keyDown(handle, { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith(300);
    });
  });
});
