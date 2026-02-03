import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only since this is a test file
vi.mock("server-only", () => ({}));

describe("personas module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("NOIR_PERSONA", () => {
    it("contains detective persona elements", async () => {
      const { NOIR_PERSONA } = await import("./personas");

      expect(NOIR_PERSONA).toContain("Detective");
      expect(NOIR_PERSONA).toContain("synthNoir City");
      expect(NOIR_PERSONA).toContain("Evidence");
      expect(NOIR_PERSONA).toContain("generate_ui");
    });
  });

  describe("MINIMAL_PERSONA", () => {
    it("is professional and direct", async () => {
      const { MINIMAL_PERSONA } = await import("./personas");

      expect(MINIMAL_PERSONA).toContain("helpful AI assistant");
      expect(MINIMAL_PERSONA).toContain("concise and direct");
      expect(MINIMAL_PERSONA).not.toContain("Detective");
      expect(MINIMAL_PERSONA).not.toContain("noir");
    });

    it("has same core directives as noir", async () => {
      const { MINIMAL_PERSONA } = await import("./personas");

      expect(MINIMAL_PERSONA).toContain("generate_ui");
      expect(MINIMAL_PERSONA).toContain("A2UI Protocol");
      expect(MINIMAL_PERSONA).toContain("container");
    });
  });

  describe("getPersonaPrompt", () => {
    it("returns noir persona for 'noir' ID", async () => {
      const { getPersonaPrompt, NOIR_PERSONA } = await import("./personas");

      const result = getPersonaPrompt("noir");
      expect(result).toBe(NOIR_PERSONA);
    });

    it("returns minimal persona for 'minimal' ID", async () => {
      const { getPersonaPrompt, MINIMAL_PERSONA } = await import("./personas");

      const result = getPersonaPrompt("minimal");
      expect(result).toBe(MINIMAL_PERSONA);
    });

    it("returns noir (default) for undefined ID", async () => {
      const { getPersonaPrompt, NOIR_PERSONA } = await import("./personas");

      const result = getPersonaPrompt(undefined);
      expect(result).toBe(NOIR_PERSONA);
    });

    it("returns noir (default) for invalid ID", async () => {
      const { getPersonaPrompt, NOIR_PERSONA } = await import("./personas");

      // @ts-expect-error - testing invalid input
      const result = getPersonaPrompt("invalid");
      expect(result).toBe(NOIR_PERSONA);
    });
  });

  describe("hasNoirPersona", () => {
    it("returns true for noir", async () => {
      const { hasNoirPersona } = await import("./personas");

      expect(hasNoirPersona("noir")).toBe(true);
    });

    it("returns false for minimal", async () => {
      const { hasNoirPersona } = await import("./personas");

      expect(hasNoirPersona("minimal")).toBe(false);
    });
  });
});
