import { z } from "zod";
import type { CustomProfileId } from "@/lib/aesthetic/types";

// Profile color overrides (all optional, fall back to base aesthetic)
export const profileColorsSchema = z.object({
  background: z.string().optional(),
  surface: z.string().optional(),
  surfaceAlt: z.string().optional(),
  text: z.string().optional(),
  textMuted: z.string().optional(),
  accent: z.string().optional(),
  accentMuted: z.string().optional(),
  border: z.string().optional(),
  error: z.string().optional(),
});
export type ProfileColors = z.infer<typeof profileColorsSchema>;

// Font preset names
export const fontPresetSchema = z.enum(["system", "serif", "typewriter", "mono"]);
export type FontPreset = z.infer<typeof fontPresetSchema>;

// Profile fonts
export const profileFontsSchema = z.object({
  body: fontPresetSchema.optional(),
  heading: fontPresetSchema.optional(),
});
export type ProfileFonts = z.infer<typeof profileFontsSchema>;

// Per-SFX volume overrides (0-1)
export const sfxVolumesSchema = z.record(
  z.enum(["typewriter", "thunder", "phone"]),
  z.number().min(0).max(1)
);
export type SfxVolumes = z.infer<typeof sfxVolumesSchema>;

// Profile audio configuration
export const profileAudioSchema = z.object({
  sfxVolumes: sfxVolumesSchema.optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  ambientRainVolume: z.number().min(0).max(1).optional(),
  ambientCrackleVolume: z.number().min(0).max(1).optional(),
  // Custom audio URLs (optional overrides)
  customMusicUrl: z.string().url().optional(),
  customRainUrl: z.string().url().optional(),
});
export type ProfileAudio = z.infer<typeof profileAudioSchema>;

// Voice settings
export const profileVoiceSchema = z.object({
  voiceId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  speed: z.number().min(0.5).max(2).optional(),
});
export type ProfileVoice = z.infer<typeof profileVoiceSchema>;

// Visual effect intensities (0-1, continuous)
export const profileEffectsSchema = z.object({
  rain: z.number().min(0).max(1).optional(),
  fog: z.number().min(0).max(1).optional(),
  crackle: z.number().min(0).max(1).optional(),
  typewriterSpeed: z.number().min(0).max(100).optional(), // ms per char
});
export type ProfileEffects = z.infer<typeof profileEffectsSchema>;

// Complete custom profile
export const customProfileSchema = z.object({
  id: z.custom<CustomProfileId>((val) => typeof val === "string" && val.startsWith("custom-")),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  baseAestheticId: z.enum(["noir", "minimal"]), // Which built-in to extend
  createdAt: z.number(),
  updatedAt: z.number(),
  // Customization overrides
  colors: profileColorsSchema.optional(),
  fonts: profileFontsSchema.optional(),
  audio: profileAudioSchema.optional(),
  voice: profileVoiceSchema.optional(),
  effects: profileEffectsSchema.optional(),
  imageStylePrompt: z.string().max(500).optional(),
});
export type CustomProfile = z.infer<typeof customProfileSchema>;

// Export format with schema version
export const exportedSettingsSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.number(),
  profiles: z.array(customProfileSchema),
  activeProfileId: z.string().optional(),
});
export type ExportedSettings = z.infer<typeof exportedSettingsSchema>;

// Validation helpers
export function validateCustomProfile(data: unknown): CustomProfile | null {
  const result = customProfileSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function validateExportedSettings(data: unknown): ExportedSettings | null {
  const result = exportedSettingsSchema.safeParse(data);
  return result.success ? result.data : null;
}
