import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Column } from "./Column";
import { registerComponent, ComponentRenderer } from "../registry";
import type { A2UIComponent, TextComponent } from "@/lib/protocol/schema";

const MockChild: ComponentRenderer = ({ node }) => <div data-testid="child">{node.type}</div>;

describe("Column", () => {
  it("renders children with flex-col class", () => {
    registerComponent("text", MockChild);

    const node: Extract<A2UIComponent, { type: "column" }> = {
      type: "column",
      children: [{ type: "text", content: "Item 1", priority: "normal" } as TextComponent],
    };

    render(<Column node={node} />);

    const children = screen.getAllByTestId("child");
    const col = children[0].parentElement;
    expect(col).toHaveClass("flex");
    expect(col).toHaveClass("flex-col");
  });

  it("applies alignment style", () => {
    const node: Extract<A2UIComponent, { type: "column" }> = {
      type: "column",
      style: { align: "center" },
      children: [],
    };

    const { container } = render(<Column node={node} />);
    expect(container.firstChild).toHaveClass("items-center");
  });
});
