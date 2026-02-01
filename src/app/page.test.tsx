import { render, screen } from "@testing-library/react";
import Page from "./page";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/layout/DetectiveWorkspace", () => ({
  DetectiveWorkspace: () => <div data-testid="workspace" />,
}));

describe("Page", () => {
  it("renders DetectiveWorkspace", () => {
    render(<Page />);
    expect(screen.getByTestId("workspace")).toBeInTheDocument();
  });
});
