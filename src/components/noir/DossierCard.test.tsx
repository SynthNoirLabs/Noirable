import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DossierCard } from "./DossierCard";

describe("DossierCard", () => {
  it("renders title and description", () => {
    render(<DossierCard title="John Doe" description="Suspect" />);
    // Text appears twice due to TypewriterText accessibility pattern
    expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Suspect")[0]).toBeInTheDocument();
  });

  it("has paper texture and shadow", () => {
    const { container } = render(<DossierCard title="Test" />);
    const card = container.firstChild;
    expect(card).toHaveClass("bg-paper");
    expect(card).toHaveClass(
      "shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_0_40px_rgba(112,66,20,0.05)]"
    );
  });

  it("renders status stamp", () => {
    render(<DossierCard title="Test" status="redacted" />);
    expect(screen.getByText("REDACTED")).toBeInTheDocument();
  });
});
