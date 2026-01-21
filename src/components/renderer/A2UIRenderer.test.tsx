import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { A2UIRenderer } from "./A2UIRenderer";

describe("A2UIRenderer", () => {
  it("renders a text component", () => {
    const data = {
      type: "text",
      content: "Evidence #1",
      priority: "normal",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText("Evidence #1")).toBeInTheDocument();
  });

  it("renders legacy text components with text field", () => {
    const data = {
      type: "text",
      text: "Legacy note",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText("Legacy note")).toBeInTheDocument();
  });

  it("renders a card component", () => {
    const data = {
      type: "card",
      title: "Suspect Profile",
      status: "active",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText("Suspect Profile")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("renders a nested form layout", () => {
    const data = {
      type: "container",
      style: { padding: "md", gap: "sm" },
      children: [
        { type: "heading", level: 2, text: "Case Intake" },
        {
          type: "row",
          style: { gap: "sm" },
          children: [
            { type: "input", label: "Name", placeholder: "Jane Doe" },
            { type: "button", label: "Submit", variant: "primary" },
          ],
        },
      ],
    };

    render(<A2UIRenderer data={data} />);
    expect(screen.getByText("Case Intake")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("renders a callout component", () => {
    const data = {
      type: "callout",
      content: "Keep eyes on the exits.",
      priority: "high",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText("Keep eyes on the exits.")).toBeInTheDocument();
  });

  it("renders redacted placeholder for unknown type", () => {
    const data = {
      type: "alien_tech",
      content: "???",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText(/REDACTED/)).toBeInTheDocument();
    // Should verify it says "CORRUPTED DATA" or similar?
    // "Graceful Failure: If the AI generates an unknown component type, the renderer must display a 'REDACTED' or 'MISSING FILE' placeholder"
    expect(screen.getByText(/UNKNOWN ARTIFACT/i)).toBeInTheDocument();
  });

  it("renders redacted placeholder for invalid schema", () => {
    const data = {
      type: "card",
      // missing title
      status: "active",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText(/REDACTED/)).toBeInTheDocument();
  });
});
