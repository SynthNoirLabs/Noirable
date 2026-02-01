import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { DateTimeInput } from "./DateTimeInput";
import { FormProvider } from "@/components/renderer/FormContext";

describe("DateTimeInput", () => {
  it("renders date input by default", () => {
    const node = {
      id: "dt-1",
      component: "DateTimeInput" as const,
      value: { path: "date" },
      enableDate: true,
    };

    render(
      <FormProvider>
        <DateTimeInput node={node} />
      </FormProvider>
    );

    const input = screen.getByLabelText("Date/Time"); // Label is hardcoded in component for now
    expect(input).toHaveAttribute("type", "date");
  });

  it("renders time input", () => {
    const node = {
      id: "dt-time",
      component: "DateTimeInput" as const,
      value: { path: "time" },
      enableTime: true,
      enableDate: false,
    };

    render(
      <FormProvider>
        <DateTimeInput node={node} />
      </FormProvider>
    );

    const input = screen.getByLabelText("Date/Time");
    expect(input).toHaveAttribute("type", "time");
  });

  it("updates value", () => {
    const node = {
      id: "dt-val",
      component: "DateTimeInput" as const,
      value: { path: "date" },
      enableDate: true,
    };

    render(
      <FormProvider>
        <DateTimeInput node={node} />
      </FormProvider>
    );

    const input = screen.getByLabelText("Date/Time");
    fireEvent.change(input, { target: { value: "2023-01-01" } });
    expect(input).toHaveValue("2023-01-01");
  });
});
