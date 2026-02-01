import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./index";
import React from "react";

// Create localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

// Test component to consume context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">
        Toggle
      </button>
    </div>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    // Mock localStorage using global assignment
    global.localStorage = localStorageMock as Storage;
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("should provide default theme (noir)", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value").textContent).toBe("noir");
  });

  it("should toggle theme", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const btn = screen.getByTestId("toggle-btn");
    fireEvent.click(btn);

    expect(screen.getByTestId("theme-value").textContent).toBe("standard");

    fireEvent.click(btn);
    expect(screen.getByTestId("theme-value").textContent).toBe("noir");
  });

  it("should persist theme to localStorage", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const btn = screen.getByTestId("toggle-btn");
    fireEvent.click(btn);

    expect(localStorage.getItem("a2ui-theme")).toBe("standard");
  });

  it("should load theme from localStorage", () => {
    localStorage.setItem("a2ui-theme", "standard");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-value").textContent).toBe("standard");
  });

  it("should inject CSS variables", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check if style tag exists
    const styleTag = document.querySelector("style");
    expect(styleTag).toBeTruthy();
    expect(styleTag?.textContent).toContain("--a2ui-background");
  });
});
