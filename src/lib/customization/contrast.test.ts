import { describe, it, expect } from "vitest";
import {
  normalizeHex,
  relativeLuminance,
  contrastRatio,
  passesAA,
  nudgeToAA,
  paletteFromAccent,
  AA_NORMAL,
  AA_LARGE,
} from "./contrast";

describe("normalizeHex", () => {
  it("expands 3-digit shorthand", () => {
    expect(normalizeHex("#abc")).toBe("#aabbcc");
  });

  it("lowercases and keeps 6-digit hex", () => {
    expect(normalizeHex("#FFBF00")).toBe("#ffbf00");
  });

  it("strips the alpha channel from 8-digit hex", () => {
    expect(normalizeHex("#ffbf0080")).toBe("#ffbf00");
  });

  it("returns null for non-hex values", () => {
    expect(normalizeHex("rgb(0,0,0)")).toBeNull();
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex("")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("returns 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns 0 for invalid input", () => {
    expect(relativeLuminance("not-a-color")).toBe(0);
  });
});

describe("contrastRatio", () => {
  it("computes the maximal 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("is order-independent", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(contrastRatio("#ffffff", "#000000"), 5);
  });

  it("returns 1 for identical colours", () => {
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5);
  });
});

describe("passesAA", () => {
  it("uses 4.5 for normal text", () => {
    expect(passesAA(AA_NORMAL)).toBe(true);
    expect(passesAA(AA_NORMAL - 0.1)).toBe(false);
  });

  it("uses 3 for large text", () => {
    expect(passesAA(AA_LARGE, true)).toBe(true);
    expect(passesAA(AA_LARGE - 0.1, true)).toBe(false);
  });
});

describe("nudgeToAA", () => {
  it("leaves a passing colour unchanged (but normalized)", () => {
    // White on black already passes.
    expect(nudgeToAA("#fff", "#000000")).toBe("#ffffff");
  });

  it("brightens low-contrast text over a dark background until AA passes", () => {
    const bg = "#1a1a1a";
    const fg = "#333333"; // too close to bg
    expect(passesAA(contrastRatio(fg, bg))).toBe(false);

    const fixed = nudgeToAA(fg, bg);
    expect(passesAA(contrastRatio(fixed, bg))).toBe(true);
  });

  it("darkens low-contrast text over a light background until AA passes", () => {
    const bg = "#f4f4f5";
    const fg = "#cccccc";
    expect(passesAA(contrastRatio(fg, bg))).toBe(false);

    const fixed = nudgeToAA(fg, bg);
    expect(passesAA(contrastRatio(fixed, bg))).toBe(true);
  });

  it("returns the original string for non-hex input", () => {
    expect(nudgeToAA("rgb(0,0,0)", "#ffffff")).toBe("rgb(0,0,0)");
  });
});

describe("paletteFromAccent", () => {
  it("returns all nine colour keys as valid hex", () => {
    const palette = paletteFromAccent("#00ffcc");
    const keys = [
      "background",
      "surface",
      "surfaceAlt",
      "text",
      "textMuted",
      "accent",
      "accentMuted",
      "border",
      "error",
    ] as const;
    for (const key of keys) {
      expect(palette[key]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("preserves the provided accent", () => {
    expect(paletteFromAccent("#00ffcc").accent).toBe("#00ffcc");
  });

  it("produces AA-legible text over the derived background", () => {
    const palette = paletteFromAccent("#ffbf00");
    expect(passesAA(contrastRatio(palette.text, palette.background))).toBe(true);
  });

  it("falls back to a default accent for invalid input", () => {
    expect(paletteFromAccent("garbage").accent).toBe("#ffbf00");
  });
});
