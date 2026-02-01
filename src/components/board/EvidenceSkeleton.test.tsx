import { render, screen } from "@testing-library/react";
import { EvidenceSkeleton } from "./EvidenceSkeleton";
import { describe, it, expect } from "vitest";

describe("EvidenceSkeleton", () => {
  it("renders loading state correctly", () => {
    render(<EvidenceSkeleton />);
    expect(screen.getByText("Generating...")).toBeInTheDocument();
    expect(screen.getByText("Compiling evidence")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<EvidenceSkeleton className="test-class" />);
    expect(container.firstChild).toHaveClass("test-class");
  });
});
