import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Text } from "./Text";
import { ComponentRendererProps } from "../registry";
import { Text as TextNode } from "@/lib/a2ui/catalog/components";

describe("Text Component", () => {
  it("renders body text by default", () => {
    const node: TextNode = {
      component: "Text",
      id: "test-1",
      text: "Hello World",
      variant: "body",
    };
    // Mock the props to match the expected signature
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Text {...props} />);
    const el = screen.getByText("Hello World");
    expect(el.tagName).toBe("P");
    expect(el.className).toContain("font-mono");
  });

  it("renders headings correctly", () => {
    const node: TextNode = {
      component: "Text",
      id: "test-2",
      text: "Heading 1",
      variant: "h1",
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Text {...props} />);
    const el = screen.getByText("Heading 1");
    expect(el.tagName).toBe("H1");
    expect(el.className).toContain("font-typewriter");
    expect(el.className).toContain("text-3xl");
  });

  it("renders caption correctly", () => {
    const node: TextNode = {
      component: "Text",
      id: "test-3",
      text: "Caption Text",
      variant: "caption",
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Text {...props} />);
    const el = screen.getByText("Caption Text");
    expect(el.tagName).toBe("SPAN"); // or P with small text
    expect(el.className).toContain("text-xs");
  });

  it("applies styles from node.style", () => {
    // We need to extend the type because standard TextNode doesn't have style in the catalog yet
    // But we agreed to support it
    const node: Record<string, unknown> = {
      component: "Text",
      id: "test-4",
      text: "Styled Text",
      variant: "body",
      style: {
        padding: "md",
        className: "custom-class",
      },
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Text {...props} />);
    const el = screen.getByText("Styled Text");
    expect(el.className).toContain("p-4");
    expect(el.className).toContain("custom-class");
  });
});
