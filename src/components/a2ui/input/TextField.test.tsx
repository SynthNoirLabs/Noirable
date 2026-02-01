import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { TextField } from "./TextField";
import { FormProvider } from "@/components/renderer/FormContext";

describe("TextField", () => {
  it("renders with label and inputs text", () => {
    const node = {
      id: "tf-1",
      component: "TextField" as const,
      label: "Username",
      value: { path: "username" },
    };

    render(
      <FormProvider>
        <TextField node={node} />
      </FormProvider>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "testuser" } });
    expect(input).toHaveValue("testuser");
  });

  it("handles password variant", () => {
    const node = {
      id: "tf-pass",
      component: "TextField" as const,
      label: "Password",
      variant: "obscured" as const,
      value: { path: "password" },
    };

    render(
      <FormProvider>
        <TextField node={node} />
      </FormProvider>
    );

    // Password input doesn't have implicit role="textbox" in some queries, search by label
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
  });

  it("validates email", () => {
    const node = {
      id: "tf-email",
      component: "TextField" as const,
      label: "Email",
      value: { path: "email" },
      checks: [{ call: "email", message: "Invalid email" }],
    };

    render(
      <FormProvider>
        <TextField node={node} />
      </FormProvider>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "invalid" } });
    expect(screen.getByText("Invalid email")).toBeDefined();

    fireEvent.change(input, { target: { value: "valid@example.com" } });
    expect(screen.queryByText("Invalid email")).toBeNull();
  });
});
