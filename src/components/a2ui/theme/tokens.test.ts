import { describe, it, expect } from "vitest";
import { noirTokens, standardTokens } from "./tokens";

describe("Theme Tokens", () => {
  it("should have consistent structure between themes", () => {
    const noirKeys = Object.keys(noirTokens.colors).sort();
    const standardKeys = Object.keys(standardTokens.colors).sort();

    expect(noirKeys).toEqual(standardKeys);
  });

  it("should define required semantic colors", () => {
    const requiredColors = ["background", "surface", "text", "muted", "accent", "border"];

    requiredColors.forEach((color) => {
      expect(noirTokens.colors).toHaveProperty(color);
      expect(standardTokens.colors).toHaveProperty(color);
    });
  });

  it("should define required fonts", () => {
    expect(noirTokens.fonts).toHaveProperty("body");
    expect(noirTokens.fonts).toHaveProperty("mono");
    expect(standardTokens.fonts).toHaveProperty("body");
    expect(standardTokens.fonts).toHaveProperty("mono");
  });
});
