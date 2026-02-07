import type { A2UIInput } from "@/lib/protocol/schema";
import type { AIProviderType } from "@/lib/ai/model-registry";
import type { TrainingExample } from "@/lib/training";
import type { AestheticId } from "@/lib/aesthetic/types";

export type { AIProviderType };
export type { AestheticId } from "@/lib/aesthetic/types";

export interface ModelConfig {
  provider: AIProviderType;
  model: string;
}

export type AmbientIntensity = "low" | "medium" | "high";

export interface AmbientSettings {
  rainEnabled: boolean;
  /** 0..1 volume scale for rain audio (intensity still applies). */
  rainVolume: number;
  fogEnabled: boolean;
  intensity: AmbientIntensity;
  crackleEnabled: boolean;
  crackleVolume: number;
}

export interface Settings {
  typewriterSpeed: number;
  soundEnabled: boolean;
  ttsEnabled?: boolean;
  musicEnabled?: boolean;
  modelConfig: ModelConfig;
  ambient: AmbientSettings;
  /** Use A2UI v0.9 protocol instead of legacy */
  useA2UIv09?: boolean;
  /** Active aesthetic profile ID */
  aestheticId?: AestheticId;
  /** Per-SFX volume overrides (0-1) */
  sfxVolumes?: Record<"typewriter" | "thunder" | "phone", number>;
  /** Music volume (0-1) */
  musicVolume?: number;
  /** Visual effect intensities (0-1) */
  effectIntensities?: {
    rain?: number;
    fog?: number;
    crackle?: number;
  };
  /** Custom image generation style prompt */
  imageStylePrompt?: string;
  /** API keys stored locally */
  apiKeys?: {
    elevenlabs?: string;
    openai?: string;
  };
  /** Voice settings for TTS */
  voiceSettings?:
    | {
        voiceId?: string;
        stability?: number;
        similarityBoost?: number;
        style?: number;
        speed?: number;
      }
    | undefined;
}

export type SettingsUpdate = Partial<
  Omit<Settings, "ambient" | "effectIntensities" | "voiceSettings">
> & {
  ambient?: Partial<AmbientSettings>;
  effectIntensities?: Partial<Settings["effectIntensities"]>;
  voiceSettings?: Partial<Settings["voiceSettings"]>;
};

export interface Layout {
  showEditor: boolean;
  showSidebar: boolean;
  showEject: boolean;
  editorWidth: number;
  sidebarWidth: number;
}

export interface EvidenceEntry {
  id: string;
  createdAt: number;
  label: string;
  status?: string;
  data: A2UIInput;
}

export interface PromptEntry {
  id: string;
  createdAt: number;
  text: string;
  evidenceId?: string;
}

// Re-export TrainingExample for convenience
export type { TrainingExample } from "@/lib/training";
