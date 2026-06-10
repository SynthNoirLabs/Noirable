"use client";

import dynamic from "next/dynamic";
import { CrackleAudio } from "@/components/noir/CrackleAudio";
import { CrackleOverlay } from "@/components/noir/CrackleOverlay";
import { EmberOverlay } from "@/components/noir/EmberOverlay";
import { FogOverlay } from "@/components/noir/FogOverlay";
import { NoirMusic } from "@/components/noir/NoirMusic";
import { RainAudio } from "@/components/noir/RainAudio";
import { LightningOverlay } from "@/components/noir/LightningOverlay";
import type { AmbientSettings, AestheticId } from "@/lib/store/useA2UIStore";
import { getAudioPack } from "@/lib/aesthetic/audio-packs";
import { getAtmosphere } from "@/lib/aesthetic/identity";

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

  // The preset's declared signature particle (rain / fog / grain / ember / none)
  // selects WHICH visual overlay is the world's default, so every world no
  // longer rains noir-blue: nostromo gets terminal grain, gothic gets drifting
  // embers, minimal gets nothing. The user's ambient enable toggles still gate
  // each layer (AND), so turning rain off works as before; the particle type
  // just decides what "on" means for this world. Custom profiles inherit their
  // base preset's particle via the resolved aesthetic id.
  const particle = getAtmosphere(aestheticId).particle;
  const showRain = ambient.rainEnabled && particle === "rain";
  // Fog reads as a soft secondary haze; keep it for the fog-y / rainy worlds
  // (its own enable toggle still applies), but not for grain/ember/none worlds.
  const showFog = ambient.fogEnabled && (particle === "rain" || particle === "fog");
  // "grain" reuses the existing CRT/film-grain crackle overlay (nostromo); the
  // user's crackle toggle can also force it on for any world.
  const showGrain = particle === "grain" || ambient.crackleEnabled;
  const showEmber = particle === "ember";

  // This is the shared audio coordinator: the ambient layers and the music bed
  // live here. NoirMusic subscribes to the module-level music-duck channel
  // (@/lib/audio/audioEvents) so ChatSidebar — which plays TTS from a disjoint
  // subtree — can duck the bed under narration without prop-drilling. Custom
  // profiles still resolve their rain/crackle volume overrides via getAudioPack.
  return (
    <>
      <LightningOverlay />
      <RainOverlay enabled={showRain} intensity={ambient.intensity} />
      <FogOverlay enabled={showFog} intensity={ambient.intensity} />
      <EmberOverlay enabled={showEmber} intensity={ambient.intensity} />
      {showGrain && <CrackleOverlay intensity={ambient.intensity} />}
      {ambient.crackleEnabled && (
        <CrackleAudio
          enabled={ambient.crackleEnabled}
          volume={ambient.crackleVolume}
          soundEnabled={soundEnabled}
          src={audioPack.ambient.crackle?.src}
        />
      )}
      {/* The "rain" channel is really each world's ambient AUDIO bed (nostromo's
          ship hum, gothic's atmosphere), so it stays gated on the user's ambient
          toggle — independent of the VISUAL particle type chosen above. */}
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
