import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NoirErrorBoundary } from "./NoirErrorBoundary";

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test render error");
  }
  return <div>Child content</div>;
}

describe("NoirErrorBoundary", () => {
  // Suppress React error boundary console.error noise in tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when there is no error", () => {
    render(
      <NoirErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </NoirErrorBoundary>
    );
    expect(screen.getByText("Child content")).toBeDefined();
  });

  it("catches errors and renders default fallback UI", () => {
    render(
      <NoirErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </NoirErrorBoundary>
    );
    expect(screen.getByText("Rendering Error")).toBeDefined();
    expect(screen.getByText("Test render error")).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });

  it("renders custom fallback when provided", () => {
    render(
      <NoirErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingChild shouldThrow={true} />
      </NoirErrorBoundary>
    );
    expect(screen.getByText("Custom fallback")).toBeDefined();
  });

  it("calls onError callback when an error is caught", () => {
    const onError = vi.fn();
    render(
      <NoirErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow={true} />
      </NoirErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("Test render error");
  });

  it("resets error state when retry button is clicked", () => {
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error("Temporary error");
      }
      return <div>Recovered content</div>;
    }

    render(
      <NoirErrorBoundary>
        <ConditionalThrow />
      </NoirErrorBoundary>
    );

    expect(screen.getByText("Rendering Error")).toBeDefined();

    // Fix the error before retrying
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(screen.getByText("Recovered content")).toBeDefined();
  });
});
