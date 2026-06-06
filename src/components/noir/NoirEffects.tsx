"use client";

import dynamic from "next/dynamic";
import { CrackleAudio } from "@/components/noir/CrackleAudio";
import { CrackleOverlay } from "@/components/noir/CrackleOverlay";
import { FogOverlay } from "@/components/noir/FogOverlay";
import { NoirMusic } from "@/components/noir/NoirMusic";
import { RainAudio } from "@/components/noir/RainAudio";
import { LightningOverlay } from "@/components/noir/LightningOverlay";
import type { AmbientSettings, AestheticId } from "@/lib/store/useA2UIStore";
import { getAudioPack } from "@/lib/aesthetic/audio-packs";

const RainOverlay = dynamic(
  async () => {
    const mod = await import("@/components/noir/RainOverlay");
    return mod.RainOverlay;
  },
  { ssr: false }
);

interface NoirEffectsProps {
  ambient: AmbientSettings;
  soundEnabled: boolean;
  musicEnabled?: boolean;
  musicVolume?: number;
  customMusicUrl?: string;
  /** Aesthetic profile ID for audio configuration */
  aestheticId?: AestheticId;
}

export function NoirEffects({
  ambient,
  soundEnabled,
  musicEnabled = false,
  musicVolume,
  customMusicUrl,
  aestheticId = "noir",
}: NoirEffectsProps) {
  // Get audio pack configuration for the current aesthetic
  const audioPack = getAudioPack(aestheticId);
  // This is the shared audio coordinator: the ambient layers and the music bed
  // live here. NoirMusic subscribes to the module-level music-duck channel
  // (@/lib/audio/audioEvents) so ChatSidebar — which plays TTS from a disjoint
  // subtree — can duck the bed under narration without prop-drilling. Custom
  // profiles still resolve their rain/crackle volume overrides via getAudioPack.
  return (
    <>
      <LightningOverlay />
      <RainOverlay enabled={ambient.rainEnabled} intensity={ambient.intensity} />
      <FogOverlay enabled={ambient.fogEnabled} intensity={ambient.intensity} />
      {ambient.crackleEnabled && (
        <>
          <CrackleOverlay intensity={ambient.intensity} />
          <CrackleAudio
            enabled={ambient.crackleEnabled}
            volume={ambient.crackleVolume}
            soundEnabled={soundEnabled}
            src={audioPack.ambient.crackle?.src}
          />
        </>
      )}
      <RainAudio
        enabled={ambient.rainEnabled}
        intensity={ambient.intensity}
        volumeScale={ambient.rainVolume}
        soundEnabled={soundEnabled}
        src={audioPack.ambient.rain?.src}
      />
      <NoirMusic
        enabled={musicEnabled}
        soundEnabled={soundEnabled}
        volume={musicVolume}
        musicConfig={audioPack.music}
        customMusicUrl={customMusicUrl}
      />
    </>
  );
}
