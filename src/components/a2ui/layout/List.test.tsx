import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { List } from "./List";
import type { A2UIComponent } from "@/lib/protocol/schema";

describe("List", () => {
  it("renders unordered list by default", () => {
    const node: Extract<A2UIComponent, { type: "list" }> = {
      type: "list",
      items: ["Item 1", "Item 2"],
    };

    render(<List node={node} />);

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(list).toHaveClass("list-disc");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders ordered list when ordered=true", () => {
    const node: Extract<A2UIComponent, { type: "list" }> = {
      type: "list",
      items: ["Item 1"],
      ordered: true,
    };

    render(<List node={node} />);

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(list).toHaveClass("list-decimal");
  });
});
