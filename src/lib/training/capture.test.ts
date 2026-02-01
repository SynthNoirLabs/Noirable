import { describe, it, expect } from "vitest";
import { createTrainingExample, shouldCapture } from "./capture";
import type { A2UIInput } from "@/lib/protocol/schema";

describe("createTrainingExample", () => {
  it("creates example with correct structure", () => {
    const prompt = "Create a button";
    const output: A2UIInput = { type: "button", label: "Click me" };

    const result = createTrainingExample(prompt, output);

    expect(result).toHaveProperty("id");
    expect(result.prompt).toBe(prompt);
    expect(result.output).toEqual(output);
    expect(result.metadata).toBeDefined();
  });

  it("generates unique IDs", () => {
    const prompt = "Create a button";
    const output: A2UIInput = { type: "button", label: "Click me" };

    const result1 = createTrainingExample(prompt, output);
    const result2 = createTrainingExample(prompt, output);

    expect(result1.id).not.toBe(result2.id);
  });

  it("infers category from output", () => {
    const prompt = "Create a form";
    const output: A2UIInput = {
      type: "container",
      children: [
        { type: "input", label: "Name", placeholder: "..." },
        { type: "button", label: "Submit" },
      ],
    };

    const result = createTrainingExample(prompt, output);
    expect(result.metadata.category).toBe("form");
  });

  it("infers complexity from output", () => {
    const prompt = "Simple text";
    const output: A2UIInput = {
      type: "text",
      content: "Hello",
      priority: "normal",
    };

    const result = createTrainingExample(prompt, output);
    expect(result.metadata.complexity).toBe("simple");
  });

  it("extracts component types used", () => {
    const prompt = "Create a card with text";
    const output: A2UIInput = {
      type: "container",
      children: [
        { type: "card", title: "Title" },
        { type: "text", content: "Content", priority: "normal" },
      ],
    };

    const result = createTrainingExample(prompt, output);
    expect(result.metadata.componentsUsed).toContain("container");
    expect(result.metadata.componentsUsed).toContain("card");
    expect(result.metadata.componentsUsed).toContain("text");
  });

  it("sets createdAt timestamp", () => {
    const before = Date.now();
    const result = createTrainingExample("test", {
      type: "button",
      label: "Test",
    });
    const after = Date.now();

    expect(result.metadata.createdAt).toBeGreaterThanOrEqual(before);
    expect(result.metadata.createdAt).toBeLessThanOrEqual(after);
  });
});

describe("shouldCapture", () => {
  it("returns false for empty prompt", () => {
    const output: A2UIInput = { type: "button", label: "Test" };
    expect(shouldCapture("", output)).toBe(false);
  });

  it("returns false for short prompt", () => {
    const output: A2UIInput = { type: "button", label: "Test" };
    expect(shouldCapture("hi", output)).toBe(false);
  });

  it("returns false for simple text-only output", () => {
    const output: A2UIInput = {
      type: "text",
      content: "Hello",
      priority: "normal",
    };
    expect(shouldCapture("Create a greeting", output)).toBe(false);
  });

  it("returns true for meaningful output", () => {
    const output: A2UIInput = {
      type: "container",
      children: [
        { type: "heading", text: "Title", level: 1 },
        { type: "paragraph", text: "Content" },
      ],
    };
    expect(shouldCapture("Create a page header", output)).toBe(true);
  });

  it("returns true for button output", () => {
    const output: A2UIInput = { type: "button", label: "Submit" };
    expect(shouldCapture("Create a submit button", output)).toBe(true);
  });

  it("returns true for card output", () => {
    const output: A2UIInput = { type: "card", title: "My Card" };
    expect(shouldCapture("Create a card component", output)).toBe(true);
  });

  it("returns true for form components", () => {
    const output: A2UIInput = {
      type: "input",
      label: "Email",
      placeholder: "...",
    };
    expect(shouldCapture("Create an email input", output)).toBe(true);
  });
});
