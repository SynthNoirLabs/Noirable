import { describe, it, expect } from "vitest";
import { pickSurpriseProfile, SURPRISE_PROFILE_COUNT } from "./surprise-me";
import { customProfileSchema } from "./types";
import { AESTHETIC_DEFAULT_VOICE_IDS } from "@/lib/aesthetic/voice-defaults";

describe("surprise-me", () => {
  it("exposes at least 3 curated worlds", () => {
    expect(SURPRISE_PROFILE_COUNT).toBeGreaterThanOrEqual(3);
  });

  it("each curated world validates against the customProfile schema", () => {
    const now = Date.now();
    for (let i = 0; i < SURPRISE_PROFILE_COUNT; i++) {
      const seed = pickSurpriseProfile(i);
      const candidate = {
        ...seed,
        id: "custom-test",
        createdAt: now,
        updatedAt: now,
      };
      const result = customProfileSchema.safeParse(candidate);
      expect(result.success).toBe(true);
    }
  });

  it("resolves each world's voice to its base preset default", () => {
    for (let i = 0; i < SURPRISE_PROFILE_COUNT; i++) {
      const seed = pickSurpriseProfile(i);
      expect(seed.voice?.voiceId).toBe(AESTHETIC_DEFAULT_VOICE_IDS[seed.baseAestheticId]);
    }
  });

  it("is deterministic for a given index", () => {
    expect(pickSurpriseProfile(0)).toEqual(pickSurpriseProfile(0));
    expect(pickSurpriseProfile(1).name).not.toBe(pickSurpriseProfile(0).name);
  });

  it("wraps out-of-range and negative indices", () => {
    expect(pickSurpriseProfile(SURPRISE_PROFILE_COUNT).name).toBe(pickSurpriseProfile(0).name);
    expect(pickSurpriseProfile(-1).name).toBe(pickSurpriseProfile(SURPRISE_PROFILE_COUNT - 1).name);
  });

  it("ships a varied set of base presets", () => {
    const bases = new Set(
      Array.from(
        { length: SURPRISE_PROFILE_COUNT },
        (_, i) => pickSurpriseProfile(i).baseAestheticId
      )
    );
    expect(bases.size).toBeGreaterThanOrEqual(3);
  });
});
