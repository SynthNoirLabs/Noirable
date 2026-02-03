import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only since this is a test file
vi.mock("server-only", () => ({}));

describe("System Prompt", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports a prompt string", async () => {
    const { SYSTEM_PROMPT } = await import("./prompts");
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("contains noir persona keywords", async () => {
    const { SYSTEM_PROMPT } = await import("./prompts");
    expect(SYSTEM_PROMPT).toMatch(/rain-slicked/i);
    expect(SYSTEM_PROMPT).toMatch(/monologue/i);
    expect(SYSTEM_PROMPT).toMatch(/generate_ui/i);
  });

  it("mentions component trees and layout primitives", async () => {
    const { SYSTEM_PROMPT } = await import("./prompts");
    expect(SYSTEM_PROMPT).toMatch(/root component/i);
    expect(SYSTEM_PROMPT).toMatch(/container/i);
    expect(SYSTEM_PROMPT).toMatch(/row/i);
    expect(SYSTEM_PROMPT).toMatch(/column/i);
    expect(SYSTEM_PROMPT).toMatch(/grid/i);
  });

  it("adds current evidence when provided", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const evidence = { type: "text", content: "Evidence #1" };
    const prompt = buildSystemPrompt(evidence);
    expect(prompt).toMatch(/Current Evidence/i);
    expect(prompt).toMatch(/Evidence #1/);
  });

  it("uses minified JSON for evidence", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const evidence = { type: "text", content: "Evidence #1" };
    const prompt = buildSystemPrompt(evidence);
    expect(prompt).toContain('{"type":"text","content":"Evidence #1"}');
    expect(prompt).not.toContain('{\n  "type": "text"');
  });

  it("includes precedence instructions", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const evidence = { type: "text" };
    const prompt = buildSystemPrompt(evidence);
    expect(prompt).toMatch(/LIVE state/i);
    expect(prompt).toMatch(/Ignore contradictory state/i);
  });
});

describe("buildSystemPrompt with aestheticId", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("uses noir persona by default", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Detective");
    expect(prompt).toContain("synthNoir City");
  });

  it("uses noir persona when aestheticId is 'noir'", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const prompt = buildSystemPrompt(undefined, "noir");
    expect(prompt).toContain("Detective");
    expect(prompt).toContain("rain-slicked");
  });

  it("uses minimal persona when aestheticId is 'minimal'", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const prompt = buildSystemPrompt(undefined, "minimal");
    expect(prompt).toContain("helpful AI assistant");
    expect(prompt).not.toContain("Detective");
    expect(prompt).not.toContain("synthNoir");
  });

  it("combines minimal persona with evidence", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const evidence = { type: "card", title: "Test Card" };
    const prompt = buildSystemPrompt(evidence, "minimal");

    // Has minimal persona
    expect(prompt).toContain("helpful AI assistant");
    expect(prompt).not.toContain("Detective");

    // Has evidence
    expect(prompt).toContain("Current Evidence");
    expect(prompt).toContain("Test Card");
  });

  it("falls back to noir for undefined aestheticId", async () => {
    const { buildSystemPrompt } = await import("./prompts");
    const prompt = buildSystemPrompt(undefined, undefined);
    expect(prompt).toContain("Detective");
  });
});
