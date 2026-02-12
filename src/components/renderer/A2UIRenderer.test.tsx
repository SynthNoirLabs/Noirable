import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { A2UIRenderer } from "./A2UIRenderer";

describe("A2UIRenderer", () => {
  it("renders a text component", () => {
    const data = {
      type: "text",
      content: "Evidence #1",
      priority: "normal",
    };
    render(<A2UIRenderer data={data} />);
    // TypewriterText renders duplicate text for accessibility
    expect(screen.getAllByText("Evidence #1")[0]).toBeInTheDocument();
  });

  it("renders legacy text components with text field", () => {
    const data = {
      type: "text",
      text: "Legacy note",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getAllByText("Legacy note")[0]).toBeInTheDocument();
  });

  it("renders a card component", () => {
    const data = {
      type: "card",
      title: "Suspect Profile",
      status: "active",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getAllByText("Suspect Profile")[0]).toBeInTheDocument();
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
    expect(screen.getAllByText("Keep eyes on the exits.")[0]).toBeInTheDocument();
  });

  it("renders list and table components", () => {
    const data = {
      type: "container",
      style: { gap: "sm" },
      children: [
        { type: "list", items: ["Dock gate", "Warehouse"] },
        {
          type: "table",
          columns: ["Field", "Value"],
          rows: [["Status", "Active"]],
        },
      ],
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText("Dock gate")).toBeInTheDocument();
    expect(screen.getByText("Field")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders tabs component", () => {
    const data = {
      type: "tabs",
      tabs: [
        {
          label: "Summary",
          content: { type: "paragraph", text: "Case notes." },
        },
        {
          label: "Leads",
          content: { type: "list", items: ["Call witness"] },
        },
      ],
      activeIndex: 0,
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Case notes.")).toBeInTheDocument();
  });

  it("renders a placeholder for image prompts without src", () => {
    const data = {
      type: "image",
      prompt: "Noir alley under neon rain",
      alt: "Noir alley",
    };
    render(<A2UIRenderer data={data} />);
    expect(screen.getByText(/IMAGE PENDING/i)).toBeInTheDocument();
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

  describe("form interactions", () => {
    it("calls onFormSubmit when submit button is clicked", () => {
      const onSubmit = vi.fn();
      const data = {
        type: "container",
        children: [
          {
            type: "input",
            name: "username",
            label: "Username",
            placeholder: "Enter name",
          },
          {
            type: "button",
            label: "Submit",
            action: "submit",
            variant: "primary",
          },
        ],
      };
      render(<A2UIRenderer data={data} onFormSubmit={onSubmit} />);

      const input = screen.getByLabelText("Username");
      fireEvent.change(input, { target: { value: "detective" } });

      const button = screen.getByText("Submit");
      fireEvent.click(button);

      expect(onSubmit).toHaveBeenCalledWith({ username: "detective" });
    });

    it("tracks checkbox state", () => {
      const onSubmit = vi.fn();
      const data = {
        type: "container",
        children: [
          { type: "checkbox", name: "urgent", label: "Mark as urgent" },
          { type: "button", label: "Submit", action: "submit" },
        ],
      };
      render(<A2UIRenderer data={data} onFormSubmit={onSubmit} />);

      const checkbox = screen.getByLabelText("Mark as urgent");
      fireEvent.click(checkbox);

      const button = screen.getByText("Submit");
      fireEvent.click(button);

      expect(onSubmit).toHaveBeenCalledWith({ urgent: true });
    });

    it("tracks select state", () => {
      const onSubmit = vi.fn();
      const data = {
        type: "container",
        children: [
          {
            type: "select",
            name: "status",
            label: "Status",
            options: ["Open", "Closed", "Pending"],
          },
          { type: "button", label: "Submit", action: "submit" },
        ],
      };
      render(<A2UIRenderer data={data} onFormSubmit={onSubmit} />);

      const select = screen.getByLabelText("Status");
      fireEvent.change(select, { target: { value: "Closed" } });

      const button = screen.getByText("Submit");
      fireEvent.click(button);

      expect(onSubmit).toHaveBeenCalledWith({ status: "Closed" });
    });
  });
});
