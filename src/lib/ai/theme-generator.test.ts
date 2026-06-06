import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { asSchema } from "ai";
import type { ProviderResult } from "@/lib/ai/factory";

// Mock server-only since theme-generator carries it.
vi.mock("server-only", () => ({}));

// The mock provider path never touches the SDK, but generateTheme imports it.
const generateTextMock = vi.fn();
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateText: (...args: unknown[]) => generateTextMock(...args),
  };
});

const mockAuth: ProviderResult = {
  provider: null,
  model: "mock",
  type: "mock",
};

const realAuth: ProviderResult = {
  provider: (() => ({})) as unknown as ProviderResult["provider"],
  model: "claude-sonnet-4-6",
  type: "anthropic",
};

describe("themeGeneratorTool", () => {
  it("defines a tool with name+baseAestheticId required", async () => {
    const { themeGeneratorTool } = await import("./theme-generator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema = asSchema((themeGeneratorTool as any).inputSchema);
    const jsonSchema = (await schema.jsonSchema) as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    expect(jsonSchema.properties).toHaveProperty("name");
    expect(jsonSchema.properties).toHaveProperty("baseAestheticId");
    expect(jsonSchema.properties).toHaveProperty("colors");
    expect(jsonSchema.required).toContain("name");
    expect(jsonSchema.required).toContain("baseAestheticId");
  });

  it("describes the persona as voice-only (app owns UI directives)", async () => {
    const { themeGeneratorTool } = await import("./theme-generator");
    expect(themeGeneratorTool.description).toMatch(/persona/i);
    expect(themeGeneratorTool.description?.toLowerCase()).toContain("ui directives");
  });
});

describe("normalizeGeneratedProfile", () => {
  it("rejects a profile missing required fields", async () => {
    const { normalizeGeneratedProfile } = await import("./theme-generator");
    expect(normalizeGeneratedProfile({ description: "no name" })).toBeNull();
    expect(normalizeGeneratedProfile({ name: "X", baseAestheticId: "bogus" })).toBeNull();
  });

  it("fills an unknown/blank voiceId from the base preset default", async () => {
    const { normalizeGeneratedProfile } = await import("./theme-generator");
    const { AESTHETIC_DEFAULT_VOICE_IDS } = await import("@/lib/aesthetic/voice-defaults");

    const noVoice = normalizeGeneratedProfile({ name: "Test", baseAestheticId: "cyber-fixer" });
    expect(noVoice?.voice?.voiceId).toBe(AESTHETIC_DEFAULT_VOICE_IDS["cyber-fixer"]);

    const blankVoice = normalizeGeneratedProfile({
      name: "Test",
      baseAestheticId: "noir",
      voice: { voiceId: "   ", stability: 0.4 },
    });
    expect(blankVoice?.voice?.voiceId).toBe(AESTHETIC_DEFAULT_VOICE_IDS.noir);
    expect(blankVoice?.voice?.stability).toBe(0.4);
  });

  it("preserves a real voiceId", async () => {
    const { normalizeGeneratedProfile } = await import("./theme-generator");
    const result = normalizeGeneratedProfile({
      name: "Test",
      baseAestheticId: "noir",
      voice: { voiceId: "custom-elevenlabs-id" },
    });
    expect(result?.voice?.voiceId).toBe("custom-elevenlabs-id");
  });
});

describe("generateTheme", () => {
  const originalE2E = process.env.E2E;

  beforeEach(() => {
    generateTextMock.mockReset();
    delete process.env.E2E;
  });

  afterEach(() => {
    if (originalE2E === undefined) delete process.env.E2E;
    else process.env.E2E = originalE2E;
  });

  it("returns a deterministic mock when auth is mock (no provider call)", async () => {
    const { generateTheme } = await import("./theme-generator");
    const profile = await generateTheme(mockAuth, "a neon cyberpunk alley");
    expect(profile.name).toBe("a neon cyberpunk alley");
    expect(profile.baseAestheticId).toBe("cyber-fixer");
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("honors E2E=1 with a real provider", async () => {
    process.env.E2E = "1";
    const { generateTheme } = await import("./theme-generator");
    const profile = await generateTheme(realAuth, "gothic vampire manor");
    expect(profile.baseAestheticId).toBe("gothic-manor");
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("respects a caller-supplied base preset in the mock", async () => {
    const { generateTheme } = await import("./theme-generator");
    const profile = await generateTheme(mockAuth, "anything", { baseAestheticId: "minimal" });
    expect(profile.baseAestheticId).toBe("minimal");
  });

  it("validates a model tool call and resolves the voice", async () => {
    generateTextMock.mockResolvedValue({
      toolCalls: [
        {
          toolName: "theme_generator",
          input: {
            name: "Foundry",
            baseAestheticId: "noir",
            colors: { background: "#000000", text: "#ffffff" },
          },
        },
      ],
    });
    const { generateTheme } = await import("./theme-generator");
    const { AESTHETIC_DEFAULT_VOICE_IDS } = await import("@/lib/aesthetic/voice-defaults");
    const profile = await generateTheme(realAuth, "an industrial foundry");
    expect(generateTextMock).toHaveBeenCalledOnce();
    expect(profile.name).toBe("Foundry");
    expect(profile.voice?.voiceId).toBe(AESTHETIC_DEFAULT_VOICE_IDS.noir);
  });

  it("throws when the model emits an invalid shape", async () => {
    generateTextMock.mockResolvedValue({
      toolCalls: [{ toolName: "theme_generator", input: { description: "no name" } }],
    });
    const { generateTheme } = await import("./theme-generator");
    await expect(generateTheme(realAuth, "broken")).rejects.toThrow(/invalid profile/i);
  });
});
