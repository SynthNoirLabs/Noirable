import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { Button } from "./Button";
import { FormProvider } from "@/components/renderer/FormContext";

describe("Button", () => {
  it("renders with label (child id)", () => {
    const node = {
      id: "btn-1",
      component: "Button" as const,
      child: "Click Me", // Simulating child ID as text for now
      action: { event: { name: "test-event" } },
    };

    render(<Button node={node} />);
    expect(screen.getByText("Click Me")).toBeDefined();
  });

  it("handles click events", () => {
    const node = {
      id: "btn-1",
      component: "Button" as const,
      child: "Action",
      action: { event: { name: "test-event" } },
    };

    render(<Button node={node} />);

    // Verify click doesn't throw and button is interactive
    const button = screen.getByText("Action");
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it("triggers form submit when action is submit", () => {
    const node = {
      id: "btn-submit",
      component: "Button" as const,
      child: "Submit",
      action: { event: { name: "submit" } },
    };

    const onSubmit = vi.fn();

    render(
      <FormProvider onSubmit={onSubmit}>
        <Button node={node} />
      </FormProvider>
    );

    fireEvent.click(screen.getByText("Submit"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
