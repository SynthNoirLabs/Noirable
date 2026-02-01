import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { ChoicePicker } from "./ChoicePicker";
import { FormProvider } from "@/components/renderer/FormContext";

describe("ChoicePicker", () => {
  it("renders options", () => {
    const node = {
      id: "cp-1",
      component: "ChoicePicker" as const,
      label: "Choose",
      options: [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
      ],
      value: { path: "choice" },
    };

    render(
      <FormProvider>
        <ChoicePicker node={node} />
      </FormProvider>
    );

    const select = screen.getByRole("combobox");
    expect(screen.getByText("Option A")).toBeDefined();
    expect(screen.getByText("Option B")).toBeDefined();
  });

  it("updates value on selection", () => {
    const node = {
      id: "cp-1",
      component: "ChoicePicker" as const,
      label: "Choose",
      options: [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
      ],
      value: { path: "choice" },
    };

    render(
      <FormProvider>
        <ChoicePicker node={node} />
      </FormProvider>
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "b" } });
    expect(select).toHaveValue("b");
  });
});
