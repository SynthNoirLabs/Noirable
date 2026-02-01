import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { Slider } from "./Slider";
import { FormProvider } from "@/components/renderer/FormContext";

describe("Slider", () => {
  it("renders with min max and value", () => {
    const node = {
      id: "sl-1",
      component: "Slider" as const,
      label: "Volume",
      min: 0,
      max: 100,
      value: { path: "volume" },
    };

    render(
      <FormProvider>
        <Slider node={node} />
      </FormProvider>
    );

    const input = screen.getByRole("slider");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
  });

  it("updates value", () => {
    const node = {
      id: "sl-1",
      component: "Slider" as const,
      label: "Volume",
      min: 0,
      max: 100,
      value: { path: "volume" },
    };

    render(
      <FormProvider>
        <Slider node={node} />
      </FormProvider>
    );

    const input = screen.getByRole("slider");
    fireEvent.change(input, { target: { value: "50" } });
    expect(input).toHaveValue("50");
    expect(screen.getByText("50")).toBeDefined();
  });
});
