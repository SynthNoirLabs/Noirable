import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tabs } from "./Tabs";
import { registerComponent, ComponentRenderer } from "../registry";
import type { A2UIComponent, TextComponent } from "@/lib/protocol/schema";

const MockContent: ComponentRenderer = ({ node }) => (
  <div data-testid="content">Content: {(node as TextComponent).content}</div>
);

describe("Tabs", () => {
  it("renders tabs and switches content", () => {
    registerComponent("text", MockContent);

    const node: Extract<A2UIComponent, { type: "tabs" }> = {
      type: "tabs",
      tabs: [
        {
          label: "Tab 1",
          content: { type: "text" as const, content: "1", priority: "normal" } as TextComponent,
        },
        {
          label: "Tab 2",
          content: { type: "text" as const, content: "2", priority: "normal" } as TextComponent,
        },
      ],
    };

    render(<Tabs node={node} />);

    // Check initial state (Tab 1 active)
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Content: 1")).toBeInTheDocument();
    expect(screen.queryByText("Content: 2")).not.toBeInTheDocument();

    // Click Tab 2
    fireEvent.click(screen.getByText("Tab 2"));

    // Check new state
    expect(screen.getByText("Content: 2")).toBeInTheDocument();
    expect(screen.queryByText("Content: 1")).not.toBeInTheDocument();
  });
});
