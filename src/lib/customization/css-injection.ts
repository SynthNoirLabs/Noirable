import type { CustomProfile, ProfileColors, ProfileFonts, FontPreset } from "./types";
import type { CustomProfileId } from "@/lib/aesthetic/types";

const STYLE_ELEMENT_ID = "custom-profile-styles";

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
    if (value && key in COLOR_VAR_MAP) {
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
export function buildProfileCSS(profile: CustomProfile): string {
  const selector = `[data-aesthetic="${profile.id}"]`;
  const colorVars = profile.colors ? buildColorVariables(profile.colors) : "";
  const fontVars = profile.fonts ? buildFontVariables(profile.fonts) : "";

  const allVars = [colorVars, fontVars].filter(Boolean).join("\n  ");

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
 * Inject CSS styles for a custom profile into the document
 */
export function injectProfileStyles(profile: CustomProfile): void {
  if (typeof document === "undefined") return;

  const css = buildProfileCSS(profile);
  if (!css) return;

  const styleElement = getStyleElement();

  // Append this profile's CSS (support multiple profiles)
  const existingCSS = styleElement.textContent || "";
  const profileMarker = `/* profile:${profile.id} */`;

  // Remove existing CSS for this profile if present
  const cleanedCSS = existingCSS
    .split(profileMarker)
    .filter((_, i) => i === 0) // Keep only content before first marker for this profile
    .join("");

  styleElement.textContent = cleanedCSS + profileMarker + "\n" + css + "\n" + profileMarker;
}

/**
 * Remove CSS styles for a specific profile
 */
export function removeProfileStyles(profileId: CustomProfileId): void {
  if (typeof document === "undefined") return;

  const element = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!element) return;

  const existingCSS = element.textContent || "";
  const profileMarker = `/* profile:${profileId} */`;

  // Remove content between markers for this profile
  const parts = existingCSS.split(profileMarker);
  if (parts.length >= 3) {
    // Remove the middle part (the profile CSS)
    element.textContent = parts[0] + parts.slice(2).join(profileMarker);
  }
}

/**
 * Remove all custom profile styles
 */
export function clearAllProfileStyles(): void {
  if (typeof document === "undefined") return;

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
