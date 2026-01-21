import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT, buildSystemPrompt } from "./prompts";

describe("System Prompt", () => {
  it("exports a prompt string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("contains noir persona keywords", () => {
    expect(SYSTEM_PROMPT).toMatch(/rain-slicked/i);
    expect(SYSTEM_PROMPT).toMatch(/monologue/i);
    expect(SYSTEM_PROMPT).toMatch(/generate_ui/i);
  });

  it("mentions component trees and layout primitives", () => {
    expect(SYSTEM_PROMPT).toMatch(/root component/i);
    expect(SYSTEM_PROMPT).toMatch(/container/i);
    expect(SYSTEM_PROMPT).toMatch(/row/i);
    expect(SYSTEM_PROMPT).toMatch(/column/i);
    expect(SYSTEM_PROMPT).toMatch(/grid/i);
  });

  it("adds current evidence when provided", () => {
    const evidence = { type: "text", content: "Evidence #1" };
    const prompt = buildSystemPrompt(evidence);
    expect(prompt).toMatch(/Current Evidence/i);
    expect(prompt).toMatch(/Evidence #1/);
  });
});
