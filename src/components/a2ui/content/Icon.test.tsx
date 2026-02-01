import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "./Icon";
import { ComponentRendererProps } from "../registry";
import { Icon as IconNode } from "@/lib/a2ui/catalog/components";

describe("Icon Component", () => {
  it("renders known icon", () => {
    const node: IconNode = {
      component: "Icon",
      id: "icon-1",
      name: "search",
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Icon {...props} />);
    // Lucide icons usually render an svg with specific class
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains("lucide-search")).toBeTruthy();
  });

  it("renders fallback for unknown icon", () => {
    const node: IconNode = {
      component: "Icon",
      id: "icon-2",
      name: "unknownIconName123" as unknown as string,
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Icon {...props} />);
    const svg = document.querySelector("svg");
    // Should render something (fallback icon)
    expect(svg).toBeInTheDocument();
  });

  it("applies styling", () => {
    const node: Record<string, unknown> = {
      component: "Icon",
      id: "icon-3",
      name: "home",
      style: {
        className: "text-red-500",
      },
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Icon {...props} />);
    const svg = document.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("text-red-500");
  });
});
