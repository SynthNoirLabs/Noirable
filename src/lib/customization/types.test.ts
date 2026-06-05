import { describe, it, expect } from "vitest";
import {
  customProfileSchema,
  exportedSettingsSchema,
  profileColorsSchema,
  profileVoiceSchema,
  profileAudioSchema,
  validateCustomProfile,
  validateExportedSettings,
  type CustomProfile,
} from "./types";

describe("customProfileSchema", () => {
  it("validates a complete custom profile", () => {
    const profile: CustomProfile = {
      id: "custom-abc123",
      name: "My Custom Theme",
      baseAestheticId: "noir",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      colors: { accent: "#ff0000" },
      systemPrompt: "You are a cybernetic detective.",
    };
    expect(customProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("validates backgroundImageUrl if provided", () => {
    const profile: CustomProfile = {
      id: "custom-abc123",
      name: "My Custom Theme",
      baseAestheticId: "noir",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      backgroundImageUrl: "/api/uploads/xyz.png",
    };
    expect(customProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("rejects invalid profile ID", () => {
    const profile = {
      id: "invalid-id", // doesn't start with "custom-"
      name: "Test",
      baseAestheticId: "noir",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(customProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("rejects empty name", () => {
    const profile = {
      id: "custom-abc",
      name: "",
      baseAestheticId: "noir",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(customProfileSchema.safeParse(profile).success).toBe(false);
  });
});

describe("profileColorsSchema", () => {
  it("allows partial color overrides", () => {
    const colors = { accent: "#ff0000", background: "#000000" };
    expect(profileColorsSchema.safeParse(colors).success).toBe(true);
  });

  it("allows empty object", () => {
    expect(profileColorsSchema.safeParse({}).success).toBe(true);
  });
});

describe("profileAudioSchema", () => {
  it("allows relative path for customMusicUrl and customRainUrl", () => {
    const audio = {
      customMusicUrl: "/api/uploads/song.mp3",
      customRainUrl: "/api/uploads/rain.mp3",
    };
    expect(profileAudioSchema.safeParse(audio).success).toBe(true);
  });

  it("allows full URL for customMusicUrl and customRainUrl", () => {
    const audio = {
      customMusicUrl: "https://example.com/song.mp3",
      customRainUrl: "https://example.com/rain.mp3",
    };
    expect(profileAudioSchema.safeParse(audio).success).toBe(true);
  });

  it("rejects unsafe URL schemes for custom audio URLs", () => {
    expect(profileAudioSchema.safeParse({ customMusicUrl: "javascript:alert(1)" }).success).toBe(
      false
    );
    expect(
      profileAudioSchema.safeParse({ customMusicUrl: "data:audio/mp3;base64,AAAA" }).success
    ).toBe(false);
    // protocol-relative is rejected to avoid surprising cross-origin fetches
    expect(profileAudioSchema.safeParse({ customRainUrl: "//evil.example/x.mp3" }).success).toBe(
      false
    );
  });
});

describe("profileVoiceSchema", () => {
  it("validates voice settings within bounds", () => {
    const voice = { stability: 0.5, speed: 1.0 };
    expect(profileVoiceSchema.safeParse(voice).success).toBe(true);
  });

  it("clamps speed out of bounds so older exports still import", () => {
    // max is 1.2 — older builds allowed up to 2; clamp instead of reject.
    const high = profileVoiceSchema.safeParse({ speed: 1.5 });
    expect(high.success).toBe(true);
    expect(high.success && high.data.speed).toBe(1.2);

    // min is 0.7 — older builds allowed down to 0.5.
    const low = profileVoiceSchema.safeParse({ speed: 0.5 });
    expect(low.success).toBe(true);
    expect(low.success && low.data.speed).toBe(0.7);
  });
});

describe("exportedSettingsSchema", () => {
  it("validates export format", () => {
    const exported = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [],
    };
    expect(exportedSettingsSchema.safeParse(exported).success).toBe(true);
  });

  it("rejects wrong schema version", () => {
    const exported = {
      schemaVersion: 2,
      exportedAt: Date.now(),
      profiles: [],
    };
    expect(exportedSettingsSchema.safeParse(exported).success).toBe(false);
  });
});

describe("validateCustomProfile", () => {
  it("returns profile when valid", () => {
    const profile = {
      id: "custom-test",
      name: "Test",
      baseAestheticId: "noir",
      createdAt: 123,
      updatedAt: 123,
    };
    expect(validateCustomProfile(profile)).toEqual(profile);
  });

  it("returns null when invalid", () => {
    expect(validateCustomProfile({ invalid: true })).toBeNull();
  });
});

describe("validateExportedSettings", () => {
  it("returns settings when valid", () => {
    const settings = {
      schemaVersion: 1,
      exportedAt: 123,
      profiles: [],
    };
    expect(validateExportedSettings(settings)).toEqual(settings);
  });

  it("returns null when invalid", () => {
    expect(validateExportedSettings({ invalid: true })).toBeNull();
  });
});
