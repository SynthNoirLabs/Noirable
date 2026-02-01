import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Modal } from "./Modal";
import { registerComponent, ComponentRenderer } from "../registry";

const MockTrigger: ComponentRenderer = () => <button>Open Modal</button>;
const MockContent: ComponentRenderer = () => <div>Modal Content</div>;

describe("Modal", () => {
  it("renders trigger and opens content on click", () => {
    registerComponent("button", MockTrigger);
    registerComponent("container", MockContent);

    const node = {
      type: "modal" as const,
      trigger: { type: "button" as const, label: "Open" },
      content: { type: "container" as const, children: [] },
    };

    render(<Modal node={node} />);

    // Content should be hidden initially
    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();

    // Click trigger
    fireEvent.click(screen.getByText("Open Modal"));

    // Content should appear
    expect(screen.getByText("Modal Content")).toBeInTheDocument();

    // Close button
    fireEvent.click(screen.getByText("✕"));

    // Content should hide
    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
  });
});
