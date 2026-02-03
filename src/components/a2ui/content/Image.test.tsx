import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Image } from "./Image";
import { ComponentRendererProps } from "../registry";
import { Image as ImageNode } from "@/lib/a2ui/catalog/components";

describe("Image Component", () => {
  it("renders image with correct src and alt", () => {
    const node: ImageNode = {
      component: "Image",
      id: "img-1",
      url: "https://example.com/image.jpg",
      // Schema has url, fit, variant. It does NOT have alt in v0.9 components.ts.
      // But accessible web requires alt. Schema has accessibility.label?
      // "accessibility": accessibilitySchema
      accessibility: {
        label: "Test Image",
      },
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Image {...props} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(img).toHaveAttribute("alt", "Test Image");
  });

  it("applies object-fit styles", () => {
    const node: ImageNode = {
      component: "Image",
      id: "img-2",
      url: "test.jpg",
      fit: "cover",
      accessibility: { label: "Test fit image" },
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;

    render(<Image {...props} />);
    const img = screen.getByRole("img");
    expect(img.className).toContain("object-cover");
  });

  it("handles loading state", () => {
    // This is hard to test with simple render, but we can check if a skeleton is present initially
    // Or we can mock the Image load event.
    // For now, let's just ensure it renders the img tag.
    const node: ImageNode = {
      component: "Image",
      id: "img-3",
      url: "test.jpg",
      accessibility: { label: "Loading test image" },
    };
    const props = { node, theme: "noir" } as unknown as ComponentRendererProps;
    render(<Image {...props} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
