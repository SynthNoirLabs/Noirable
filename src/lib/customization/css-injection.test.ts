import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildColorVariables,
  buildFontVariables,
  buildProfileCSS,
  injectProfileStyles,
  removeProfileStyles,
  clearAllProfileStyles,
  hasProfileStyles,
} from "./css-injection";
import type { CustomProfile, ProfileColors, ProfileFonts } from "./types";
import type { CustomProfileId } from "@/lib/aesthetic/types";

describe("buildColorVariables", () => {
  it("builds CSS variables from color overrides", () => {
    const colors: ProfileColors = {
      accent: "#ff0000",
      background: "#000000",
    };

    const result = buildColorVariables(colors);
    expect(result).toContain("--aesthetic-accent: #ff0000;");
    expect(result).toContain("--aesthetic-background: #000000;");
  });

  it("returns empty string for empty colors", () => {
    expect(buildColorVariables({})).toBe("");
  });

  it("skips undefined values", () => {
    const colors: ProfileColors = {
      accent: "#ff0000",
      background: undefined,
    };

    const result = buildColorVariables(colors);
    expect(result).toContain("--aesthetic-accent");
    expect(result).not.toContain("--aesthetic-background");
  });
});

describe("buildFontVariables", () => {
  it("builds font variables from presets", () => {
    const fonts: ProfileFonts = {
      body: "serif",
      heading: "mono",
    };

    const result = buildFontVariables(fonts);
    expect(result).toContain("--aesthetic-font-body");
    expect(result).toContain("Georgia");
    expect(result).toContain("--aesthetic-font-heading");
    expect(result).toContain("monospace");
  });

  it("returns empty string for empty fonts", () => {
    expect(buildFontVariables({})).toBe("");
  });
});

describe("buildProfileCSS", () => {
  it("builds complete CSS block for profile", () => {
    const profile: CustomProfile = {
      id: "custom-test-123" as CustomProfileId,
      name: "Test",
      baseAestheticId: "noir",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      colors: { accent: "#ff0000" },
    };

    const css = buildProfileCSS(profile);
    expect(css).toContain('[data-aesthetic="custom-test-123"]');
    expect(css).toContain("--aesthetic-accent: #ff0000;");
  });

  it("returns empty string for profile with no overrides", () => {
    const profile: CustomProfile = {
      id: "custom-test-123" as CustomProfileId,
      name: "Test",
      baseAestheticId: "noir",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(buildProfileCSS(profile)).toBe("");
  });
});

// DOM tests
describe("DOM injection functions", () => {
  beforeEach(() => {
    // Clean up any existing style elements
    document.getElementById("custom-profile-styles")?.remove();
  });

  afterEach(() => {
    clearAllProfileStyles();
  });

  const createTestProfile = (id: string, colors?: ProfileColors): CustomProfile => ({
    id: id as CustomProfileId,
    name: "Test",
    baseAestheticId: "noir",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    colors,
  });

  describe("injectProfileStyles", () => {
    it("creates style element in document head", () => {
      const profile = createTestProfile("custom-test", { accent: "#ff0000" });
      injectProfileStyles(profile);

      const element = document.getElementById("custom-profile-styles");
      expect(element).not.toBeNull();
      expect(element?.tagName).toBe("STYLE");
    });

    it("injects CSS for profile", () => {
      const profile = createTestProfile("custom-test", { accent: "#ff0000" });
      injectProfileStyles(profile);

      const element = document.getElementById("custom-profile-styles");
      expect(element?.textContent).toContain("--aesthetic-accent: #ff0000;");
    });
  });

  describe("removeProfileStyles", () => {
    it("removes CSS for specific profile", () => {
      const profile = createTestProfile("custom-test", { accent: "#ff0000" });
      injectProfileStyles(profile);

      removeProfileStyles("custom-test" as CustomProfileId);

      const element = document.getElementById("custom-profile-styles");
      expect(element?.textContent).not.toContain("--aesthetic-accent");
    });
  });

  describe("hasProfileStyles", () => {
    it("returns true when profile is injected", () => {
      const profile = createTestProfile("custom-test", { accent: "#ff0000" });
      injectProfileStyles(profile);

      expect(hasProfileStyles("custom-test" as CustomProfileId)).toBe(true);
    });

    it("returns false when profile is not injected", () => {
      expect(hasProfileStyles("custom-nonexistent" as CustomProfileId)).toBe(false);
    });
  });

  describe("clearAllProfileStyles", () => {
    it("removes the style element entirely", () => {
      const profile = createTestProfile("custom-test", { accent: "#ff0000" });
      injectProfileStyles(profile);

      clearAllProfileStyles();

      expect(document.getElementById("custom-profile-styles")).toBeNull();
    });
  });
});
