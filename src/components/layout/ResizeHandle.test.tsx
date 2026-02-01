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
});
