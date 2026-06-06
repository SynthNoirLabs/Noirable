import type { ProfileColors } from "./types";

/**
 * Dependency-free WCAG colour helpers for the Customization Lab. Everything
 * here operates on six-digit hex strings (`#rrggbb`); callers normalize via
 * `normalizeHex` before reaching the public helpers. We keep the maths inline
 * (no chroma/tinycolor) so the profile editors stay free of runtime deps.
 */

/** WCAG AA minimum contrast for normal-size body text. */
export const AA_NORMAL = 4.5;
/** WCAG AA minimum contrast for large (>=18pt / 14pt bold) text. */
export const AA_LARGE = 3;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

/**
 * Coerce a CSS hex string into a canonical lowercase `#rrggbb`. Expands the
 * 3-digit shorthand (`#abc` -> `#aabbcc`) and drops any alpha. Returns null for
 * anything that isn't a hex colour so callers can skip non-hex overrides (the
 * color editor only ever emits hex, but imported profiles may carry rgb()/hsl).
 */
export function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim().toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(trimmed);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  }
  const long = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(trimmed);
  if (long) {
    return `#${long[1]}`;
  }
  return null;
}

function hexToRgb(hex: string): Rgb {
  // Assumes a normalized `#rrggbb`.
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];

  return {
    r: (rn + m) * 255,
    g: (gn + m) * 255,
    b: (bn + m) * 255,
  };
}

/**
 * Relative luminance per the WCAG 2.1 definition (sRGB linearization). Returns
 * 0-1; black is 0, white is 1.
 */
export function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex);
  if (!normalized) return 0;
  const { r, g, b } = hexToRgb(normalized);
  const linearize = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG contrast ratio between two colours (1:1 .. 21:1). Order-independent.
 */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Whether a contrast ratio clears the WCAG AA bar (4.5:1 normal, 3:1 large).
 */
export function passesAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? AA_LARGE : AA_NORMAL);
}

/**
 * Nudge a foreground colour until it clears AA against the given background,
 * preserving its hue/saturation and only stepping lightness. Picks the
 * direction (lighten vs darken) by which side of the background luminance the
 * colour sits on, so light-on-dark and dark-on-light both stay legible. Returns
 * the original colour unchanged if it already passes or if it isn't hex.
 */
export function nudgeToAA(fg: string, bg: string, largeText = false): string {
  const normalizedFg = normalizeHex(fg);
  if (!normalizedFg) return fg;
  if (passesAA(contrastRatio(normalizedFg, bg), largeText)) return normalizedFg;

  const hsl = rgbToHsl(hexToRgb(normalizedFg));
  // Push away from the background's luminance: brighten when the bg is dark,
  // darken when the bg is light.
  const direction = relativeLuminance(bg) < 0.5 ? 1 : -1;

  let { l } = hsl;
  // 200 single-percent steps is enough to traverse the full lightness range.
  for (let i = 0; i < 200; i += 1) {
    l = Math.min(1, Math.max(0, l + direction * 0.005));
    const candidate = rgbToHex(hslToRgb({ ...hsl, l }));
    if (passesAA(contrastRatio(candidate, bg), largeText)) {
      return candidate;
    }
    if (l <= 0 || l >= 1) break;
  }

  // Couldn't satisfy AA by lightness alone (very low-contrast hue pair); fall
  // back to the pure extreme that maximizes contrast.
  return direction === 1 ? "#ffffff" : "#000000";
}

/**
 * Derive a coherent profile palette from a single accent colour. Builds a dark
 * (or light, mirroring the accent's own lightness) background scale plus a
 * legible text pair and a hue-matched border, so "Generate from accent" yields
 * something usable rather than nine random swatches. The accent is kept as-is;
 * accentMuted is a slightly desaturated/darkened sibling.
 */
export function paletteFromAccent(accentHex: string): Required<ProfileColors> {
  const normalized = normalizeHex(accentHex) ?? "#ffbf00";
  const accentHsl = rgbToHsl(hexToRgb(normalized));

  // Anchor the scene to a near-black background tinted toward the accent hue.
  const isLightAccent = accentHsl.l > 0.6;
  const bgL = isLightAccent ? 0.04 : 0.06;
  const tintedBg = (l: number, s = 0.18): string => rgbToHex(hslToRgb({ h: accentHsl.h, s, l }));

  const background = tintedBg(bgL);
  const surface = tintedBg(bgL + 0.05);
  const surfaceAlt = tintedBg(bgL + 0.1);
  const border = tintedBg(bgL + 0.12, 0.22);

  // Text is a high-lightness neutral; nudge to guarantee AA over the surface.
  const baseText = tintedBg(0.9, 0.06);
  const text = nudgeToAA(baseText, background);
  const textMuted = tintedBg(0.62, 0.08);

  const accent = normalized;
  const accentMuted = rgbToHex(
    hslToRgb({
      h: accentHsl.h,
      s: Math.max(0, accentHsl.s - 0.2),
      l: Math.max(0, accentHsl.l - 0.18),
    })
  );

  // Error stays a recognizable red but borrows a hint of the accent's tone.
  const error = rgbToHex(hslToRgb({ h: 0, s: 0.7, l: 0.42 }));

  return {
    background,
    surface,
    surfaceAlt,
    text,
    textMuted,
    accent,
    accentMuted,
    border,
    error,
  };
}
