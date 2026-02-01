import { render } from "@testing-library/react";
import { SandpackStyles } from "./SandpackStyles";
import { describe, it, expect, vi } from "vitest";
import { getSandpackCssText } from "@codesandbox/sandpack-react";

vi.mock("next/navigation", () => ({
  useServerInsertedHTML: (callback: () => unknown) => {
    callback();
  },
}));

vi.mock("@codesandbox/sandpack-react", () => ({
  getSandpackCssText: vi.fn(),
}));

describe("SandpackStyles", () => {
  it("calls getSandpackCssText via useServerInsertedHTML", () => {
    render(<SandpackStyles />);
    expect(getSandpackCssText).toHaveBeenCalled();
  });
});
