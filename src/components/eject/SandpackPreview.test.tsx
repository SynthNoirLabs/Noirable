import { render, screen } from "@testing-library/react";
import { SandpackPreview } from "./SandpackPreview";
import { describe, it, expect, vi } from "vitest";

vi.mock("@codesandbox/sandpack-react", () => ({
  Sandpack: () => <div data-testid="sandpack" />,
}));

describe("SandpackPreview", () => {
  it("renders 'No evidence' when evidence is null", () => {
    render(<SandpackPreview evidence={null} />);
    expect(screen.getByText("No evidence to preview")).toBeInTheDocument();
  });

  it("renders Sandpack when evidence is provided", () => {
    render(<SandpackPreview evidence={{ type: "text", content: "test", priority: "normal" }} />);
    expect(screen.getByTestId("sandpack")).toBeInTheDocument();
  });
});
