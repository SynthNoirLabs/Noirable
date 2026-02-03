import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { CheckBox } from "./CheckBox";
import { FormProvider } from "@/components/renderer/FormContext";

describe("CheckBox", () => {
  it("renders with label", () => {
    const node = {
      id: "chk-1",
      component: "CheckBox" as const,
      label: "Accept Terms",
      value: false,
    };

    render(<CheckBox node={node} />);
    expect(screen.getByText("Accept Terms")).toBeDefined();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("updates value via form context", () => {
    const node = {
      id: "chk-1",
      component: "CheckBox" as const,
      label: "Enable",
      value: { path: "isEnabled" },
    };

    const TestWrapper = () => (
      <FormProvider initialValues={{ isEnabled: false }}>
        <CheckBox node={node} />
      </FormProvider>
    );

    render(<TestWrapper />);
    const checkbox = screen.getByRole("checkbox");

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("displays validation error", () => {
    const node = {
      id: "chk-req",
      component: "CheckBox" as const,
      label: "Required",
      value: { path: "req" },
      checks: [{ call: "required", message: "Must be checked" }],
    };

    render(
      <FormProvider>
        <CheckBox node={node} />
      </FormProvider>
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox); // check
    fireEvent.click(checkbox); // uncheck

    expect(screen.getByText("Must be checked")).toBeDefined();
  });
});
