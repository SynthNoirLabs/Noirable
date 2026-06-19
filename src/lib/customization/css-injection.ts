import type { CustomProfile, ProfileColors, ProfileFonts, FontPreset } from "./types";
import type { CustomProfileId } from "@/lib/aesthetic/types";

const STYLE_ELEMENT_ID = "custom-profile-styles";

/**
 * Strict CSS color value pattern.
 * Allows: hex (#rgb, #rrggbb, #rrggbbaa), rgb(), rgba(), hsl(), hsla(), and CSS named colors.
 */
const CSS_COLOR_PATTERN =
  /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.]+%?\s*(,\s*[\d.]+%?\s*){2,3}\)|hsla?\(\s*[\d.]+\s*(,\s*[\d.]+%?\s*){2,3}\)|transparent|currentColor|inherit|[a-zA-Z]{3,20})$/;

function isValidCSSColor(value: string): boolean {
  return CSS_COLOR_PATTERN.test(value.trim());
}

/**
 * Font family mappings for presets
 */
const FONT_FAMILIES: Record<FontPreset, string> = {
  system: "system-ui, -apple-system, sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  typewriter: "'Courier New', Courier, monospace",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
};

/**
 * Map CSS variable name to ProfileColors key
 */
const COLOR_VAR_MAP: Record<keyof ProfileColors, string> = {
  background: "--aesthetic-background",
  surface: "--aesthetic-surface",
  surfaceAlt: "--aesthetic-surface-alt",
  text: "--aesthetic-text",
  textMuted: "--aesthetic-text-muted",
  accent: "--aesthetic-accent",
  accentMuted: "--aesthetic-accent-muted",
  border: "--aesthetic-border",
  error: "--aesthetic-error",
};

/**
 * Build CSS variable declarations from color overrides
 */
export function buildColorVariables(colors: ProfileColors): string {
  const vars: string[] = [];

  for (const [key, value] of Object.entries(colors)) {
    if (value && key in COLOR_VAR_MAP && isValidCSSColor(value)) {
      const varName = COLOR_VAR_MAP[key as keyof ProfileColors];
      vars.push(`${varName}: ${value};`);
    }
  }

  return vars.join("\n  ");
}

/**
 * Build CSS variable declarations from font overrides
 */
export function buildFontVariables(fonts: ProfileFonts): string {
  const vars: string[] = [];

  if (fonts.body) {
    vars.push(`--aesthetic-font-body: ${FONT_FAMILIES[fonts.body]};`);
  }
  if (fonts.heading) {
    vars.push(`--aesthetic-font-heading: ${FONT_FAMILIES[fonts.heading]};`);
  }

  return vars.join("\n  ");
}

/**
 * Build complete CSS for a custom profile
 */
/**
 * Build CSS variable declarations from atmosphere overrides. The overlay
 * components (rain/ember/lightning) read these vars, so a custom world's
 * weather colors apply with zero component changes; the particle TYPE switch
 * happens in NoirEffects via the resolved profile.
 */
export function buildAtmosphereVariables(atmosphere: {
  particleColor?: string;
  lightningColor?: string;
}): string {
  const vars: string[] = [];
  if (atmosphere.particleColor && isValidCSSColor(atmosphere.particleColor)) {
    vars.push(`--aesthetic-particle-color: ${atmosphere.particleColor};`);
  }
  if (atmosphere.lightningColor && isValidCSSColor(atmosphere.lightningColor)) {
    vars.push(`--aesthetic-lightning-color: ${atmosphere.lightningColor};`);
  }
  return vars.join("\n  ");
}

export function buildProfileCSS(profile: CustomProfile): string {
  // Scope overrides to the custom-profile attribute. The element ALSO carries
  // `data-aesthetic="<baseAestheticId>"`, so it inherits the base preset's full
  // variable set (colors, fonts, and the bg/case-file image vars that live only
  // in globals.css); these rules only layer the profile's overrides on top.
  // Injected after globals.css in document order, so equal-specificity wins.
  const selector = `[data-custom-profile="${profile.id}"]`;
  const colorVars = profile.colors ? buildColorVariables(profile.colors) : "";
  const fontVars = profile.fonts ? buildFontVariables(profile.fonts) : "";
  const atmosphereVars = profile.atmosphere ? buildAtmosphereVariables(profile.atmosphere) : "";

  let bgVars = "";
  if (profile.backgroundImageUrl) {
    // Filter out characters that could break CSS rules to prevent exploits
    const sanitizedUrl = profile.backgroundImageUrl.replace(/["'\\;{}()]/g, "");
    bgVars = `--aesthetic-bg-image: url("${sanitizedUrl}");`;
  }

  const allVars = [colorVars, fontVars, atmosphereVars, bgVars].filter(Boolean).join("\n  ");

  if (!allVars) return "";

  return `${selector} {\n  ${allVars}\n}`;
}

/**
 * Get or create the style element for custom profile styles
 */
function getStyleElement(): HTMLStyleElement {
  let element = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;

  if (!element) {
    element = document.createElement("style");
    element.id = STYLE_ELEMENT_ID;
    element.type = "text/css";
    document.head.appendChild(element);
  }

  return element;
}

/**
 * Per-profile CSS registry. The style element's full text is REBUILT from this
 * map on every change — the previous marker-splicing approach silently dropped
 * other profiles' CSS when one profile was re-injected.
 */
const profileCssById = new Map<string, string>();

function rebuildStyleElement(): void {
  const styleElement = getStyleElement();
  styleElement.textContent = Array.from(profileCssById.entries())
    .map(([id, css]) => `/* profile:${id} */\n${css}`)
    .join("\n");
}

/**
 * Inject CSS styles for a custom profile into the document
 */
export function injectProfileStyles(profile: CustomProfile): void {
  if (typeof document === "undefined") return;

  const css = buildProfileCSS(profile);
  if (!css) {
    // A profile with no overrides left should also clear any previous CSS.
    profileCssById.delete(profile.id);
    rebuildStyleElement();
    return;
  }

  profileCssById.set(profile.id, css);
  rebuildStyleElement();
}

/**
 * Remove CSS styles for a specific profile
 */
export function removeProfileStyles(profileId: CustomProfileId): void {
  if (typeof document === "undefined") return;

  profileCssById.delete(profileId);
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    rebuildStyleElement();
  }
}

/**
 * Remove all custom profile styles
 */
export function clearAllProfileStyles(): void {
  if (typeof document === "undefined") return;

  profileCssById.clear();
  const element = document.getElementById(STYLE_ELEMENT_ID);
  if (element) {
    element.remove();
  }
}

/**
 * Check if profile styles are currently injected
 */
export function hasProfileStyles(profileId: CustomProfileId): boolean {
  if (typeof document === "undefined") return false;

  const element = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!element) return false;

  return element.textContent?.includes(`/* profile:${profileId} */`) ?? false;
}
