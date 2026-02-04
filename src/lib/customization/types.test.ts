import { describe, it, expect } from "vitest";
import {
  customProfileSchema,
  exportedSettingsSchema,
  profileColorsSchema,
  profileVoiceSchema,
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

describe("profileVoiceSchema", () => {
  it("validates voice settings within bounds", () => {
    const voice = { stability: 0.5, speed: 1.5 };
    expect(profileVoiceSchema.safeParse(voice).success).toBe(true);
  });

  it("rejects speed out of bounds", () => {
    const voice = { speed: 3.0 }; // max is 2.0
    expect(profileVoiceSchema.safeParse(voice).success).toBe(false);
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
