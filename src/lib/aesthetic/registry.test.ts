import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only since this is a test file
vi.mock("server-only", () => ({}));

describe("AESTHETIC_REGISTRY", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports noir and minimal profiles", async () => {
    const { AESTHETIC_REGISTRY } = await import("./registry");
    expect(Object.keys(AESTHETIC_REGISTRY)).toEqual(["noir", "minimal"]);
  });

  it("noir profile has all required fields", async () => {
    const { AESTHETIC_REGISTRY } = await import("./registry");
    const noir = AESTHETIC_REGISTRY.noir;

    expect(noir.id).toBe("noir");
    expect(noir.name).toBe("Noir Detective");
    expect(noir.description).toContain("detective");

    // Theme
    expect(noir.theme.colors.background).toBe("#0f0f0f");
    expect(noir.theme.colors.accent).toBe("#ffbf00");
    expect(noir.theme.fonts.body).toContain("typewriter");

    // Audio
    expect(noir.audio.sfx.typewriter.src).toContain("typewriter.mp3");
    expect(noir.audio.music.src).toContain("noir-jazz-loop.mp3");
    expect(noir.audio.ambient.rain?.src).toContain("rain-loop.wav");

    // Persona
    expect(noir.persona.systemPrompt).toContain("Detective");
  });

  it("minimal profile has all required fields", async () => {
    const { AESTHETIC_REGISTRY } = await import("./registry");
    const minimal = AESTHETIC_REGISTRY.minimal;

    expect(minimal.id).toBe("minimal");
    expect(minimal.name).toBe("Minimal");

    // Theme - light colors
    expect(minimal.theme.colors.background).toBe("#ffffff");
    expect(minimal.theme.colors.text).toBe("#18181b");

    // Audio - reduced volumes compared to noir
    expect(minimal.audio.music.volume).toBeLessThan(AESTHETIC_REGISTRY.noir.audio.music.volume);

    // Persona - no detective theme
    expect(minimal.persona.systemPrompt).not.toContain("Detective");
  });
});

describe("getAestheticProfile", () => {
  it("returns profile for valid ID", async () => {
    const { getAestheticProfile } = await import("./registry");

    const noir = getAestheticProfile("noir");
    expect(noir?.id).toBe("noir");

    const minimal = getAestheticProfile("minimal");
    expect(minimal?.id).toBe("minimal");
  });

  it("returns undefined for invalid ID", async () => {
    const { getAestheticProfile } = await import("./registry");
    // @ts-expect-error - testing invalid input
    const result = getAestheticProfile("invalid");
    expect(result).toBeUndefined();
  });
});

describe("getAestheticProfileOrDefault", () => {
  it("returns requested profile when valid", async () => {
    const { getAestheticProfileOrDefault } = await import("./registry");

    const minimal = getAestheticProfileOrDefault("minimal");
    expect(minimal.id).toBe("minimal");
  });

  it("returns noir (default) when ID is undefined", async () => {
    const { getAestheticProfileOrDefault } = await import("./registry");

    const result = getAestheticProfileOrDefault(undefined);
    expect(result.id).toBe("noir");
  });

  it("returns noir (default) for invalid ID", async () => {
    const { getAestheticProfileOrDefault } = await import("./registry");

    // @ts-expect-error - testing invalid input
    const result = getAestheticProfileOrDefault("invalid");
    expect(result.id).toBe("noir");
  });
});

describe("getAvailableAesthetics", () => {
  it("returns all aesthetic IDs", async () => {
    const { getAvailableAesthetics } = await import("./registry");

    const ids = getAvailableAesthetics();
    expect(ids).toContain("noir");
    expect(ids).toContain("minimal");
    expect(ids).toHaveLength(2);
  });
});

describe("getAllAestheticProfiles", () => {
  it("returns all profiles as array", async () => {
    const { getAllAestheticProfiles } = await import("./registry");

    const profiles = getAllAestheticProfiles();
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.id)).toContain("noir");
    expect(profiles.map((p) => p.id)).toContain("minimal");
  });
});

describe("isValidAestheticId", () => {
  it("returns true for valid IDs", async () => {
    const { isValidAestheticId } = await import("./registry");

    expect(isValidAestheticId("noir")).toBe(true);
    expect(isValidAestheticId("minimal")).toBe(true);
  });

  it("returns false for invalid IDs", async () => {
    const { isValidAestheticId } = await import("./registry");

    expect(isValidAestheticId("invalid")).toBe(false);
    expect(isValidAestheticId("")).toBe(false);
  });
});
