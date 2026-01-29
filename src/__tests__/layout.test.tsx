import RootLayout from "@/app/layout";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock fonts
vi.mock("next/font/google", () => ({
  Inter: vi.fn().mockReturnValue({ variable: "font-sans-mock" }),
  Special_Elite: vi.fn().mockReturnValue({ variable: "font-typewriter-mock" }),
  Geist: vi.fn().mockReturnValue({ variable: "geist-sans" }),
  Geist_Mono: vi.fn().mockReturnValue({ variable: "geist-mono" }),
}));

// Mock Sandpack styles component (uses stitches which fails in test env)
vi.mock("@/components/eject/SandpackStyles", () => ({
  SandpackStyles: () => null,
}));

describe("RootLayout", () => {
  it("uses the correct Noir fonts", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = RootLayout({ children: <div /> }) as any;
    // Result is <html ...><head>...</head><body className="...">...</body></html>
    // With head added, children is now an array
    const children = result.props.children;
    const body = Array.isArray(children)
      ? children.find((c: { type?: string }) => c && c.type === "body")
      : children;

    // Expect Noir fonts
    expect(body.props.className).toContain("font-sans-mock");
    expect(body.props.className).toContain("font-typewriter-mock");

    // Expect NO Geist
    expect(body.props.className).not.toContain("geist-sans");
  });
});
