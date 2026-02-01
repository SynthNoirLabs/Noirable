import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Row } from "./Row";
import { registerComponent } from "../registry";
import { ComponentRenderer } from "../registry";
import type { A2UIComponent, TextComponent } from "@/lib/protocol/schema";

// Mock child component
const MockChild: ComponentRenderer = ({ node }) => <div data-testid="child">{node.type}</div>;

describe("Row", () => {
  it("renders children with flex-row class", () => {
    registerComponent("text", MockChild);

    const node: Extract<A2UIComponent, { type: "row" }> = {
      type: "row",
      children: [
        { type: "text", content: "Item 1", priority: "normal" } as TextComponent,
        { type: "text", content: "Item 2", priority: "normal" } as TextComponent,
      ],
    };

    render(<Row node={node} />);

    // Check for flex row class
    // Note: The outer div has the class.
    // We can query by role or generic container if not easy to find.
    // But since Row returns a div, we can assume it's the first child.

    const children = screen.getAllByTestId("child");
    expect(children).toHaveLength(2);

    const row = children[0].parentElement;
    expect(row).toHaveClass("flex");
    expect(row).toHaveClass("flex-row");
  });

  it("applies gap style", () => {
    const node: Extract<A2UIComponent, { type: "row" }> = {
      type: "row",
      style: { gap: "md" },
      children: [],
    };

    const { container } = render(<Row node={node} />);
    expect(container.firstChild).toHaveClass("gap-4");
  });
});
