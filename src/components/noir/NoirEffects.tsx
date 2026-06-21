"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CrackleAudio } from "@/components/noir/CrackleAudio";
import { CrackleOverlay } from "@/components/noir/CrackleOverlay";
import { EmberOverlay } from "@/components/noir/EmberOverlay";
import { FogOverlay } from "@/components/noir/FogOverlay";
import { NoirMusic } from "@/components/noir/NoirMusic";
import { LiveScore } from "@/components/noir/LiveScore";
import { RainAudio } from "@/components/noir/RainAudio";
import { LightningOverlay } from "@/components/noir/LightningOverlay";
import type { AmbientSettings, AestheticId } from "@/lib/store/useA2UIStore";
import { getAudioPack } from "@/lib/aesthetic/audio-packs";
import { getAtmosphere } from "@/lib/aesthetic/identity";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";

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
  /** Living score (Lyria RealTime) instead of the looped track. */
  liveScoreEnabled?: boolean;
  musicVolume?: number;
  customMusicUrl?: string;
  /** Aesthetic profile ID for audio configuration */
  aestheticId?: AestheticId;
}

export function NoirEffects({
  ambient,
  soundEnabled,
  musicEnabled = false,
  liveScoreEnabled = false,
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
  // A custom/AI-generated world may override its WEATHER (particle type +
  // secondary fog); the colors ride the injected --aesthetic-* CSS vars. Falls
  // back to the base preset's atmosphere block.
  const customAtmosphere = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return (
      state.customProfiles.find((p) => p.id === state.activeCustomProfileId)?.atmosphere ?? null
    );
  });
  const baseAtmosphere = getAtmosphere(aestheticId);
  const atmosphere = {
    ...baseAtmosphere,
    ...(customAtmosphere?.particle ? { particle: customAtmosphere.particle } : {}),
    ...(typeof customAtmosphere?.fog === "boolean" ? { fog: customAtmosphere.fog } : {}),
  };
  const particle = atmosphere.particle;

  // Weather HANDOFF: when the world (and so the particle type) changes, the
  // outgoing overlay keeps falling for ~1.6s inside a fading wrapper while the
  // new one fades in underneath — rain hands off to embers instead of cutting.
  // The particle COLORS tween simultaneously via the registered
  // --aesthetic-particle-color transition in globals.css.
  const [handoffParticle, setHandoffParticle] = useState<typeof particle | null>(null);
  const [lastParticle, setLastParticle] = useState(particle);
  if (particle !== lastParticle) {
    setLastParticle(particle);
    setHandoffParticle(lastParticle);
  }
  useEffect(() => {
    if (!handoffParticle) return;
    const timer = setTimeout(() => setHandoffParticle(null), 1700);
    return () => clearTimeout(timer);
  }, [handoffParticle]);

  const showRain = ambient.rainEnabled && particle === "rain";
  // Fog is a declared SECONDARY layer (atmosphere.fog) so a world can have
  // embers AND fog (gothic) instead of one-or-the-other; worlds whose dominant
  // particle IS fog get it too. The user's fog toggle still gates it.
  const showFog = ambient.fogEnabled && (particle === "fog" || atmosphere.fog === true);
  // "grain" reuses the existing CRT/film-grain crackle overlay (nostromo); the
  // user's crackle toggle can also force it on for any world.
  const showGrain = particle === "grain" || ambient.crackleEnabled;
  const showEmber = particle === "ember";

  // Living score: when the Lyria RealTime stream is actually RUNNING it
  // replaces the looped bed; when the websocket/key is unavailable the loop
  // keeps playing as the fallback.
  const [liveScoreRunning, setLiveScoreRunning] = useState(false);

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
      {/* The outgoing world's weather, fading out during the handoff. */}
      {handoffParticle && handoffParticle !== particle && (
        <div className="atmosphere-handoff-out" aria-hidden="true">
          {handoffParticle === "rain" && ambient.rainEnabled && (
            <RainOverlay enabled intensity={ambient.intensity} />
          )}
          {handoffParticle === "ember" && <EmberOverlay enabled intensity={ambient.intensity} />}
          {handoffParticle === "grain" && <CrackleOverlay intensity={ambient.intensity} />}
        </div>
      )}
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
      <LiveScore
        enabled={musicEnabled && liveScoreEnabled}
        soundEnabled={soundEnabled}
        volume={musicVolume ?? audioPack.music.volume}
        aestheticId={aestheticId}
        onRunningChange={setLiveScoreRunning}
      />
      <NoirMusic
        enabled={musicEnabled && !liveScoreRunning}
        soundEnabled={soundEnabled}
        volume={musicVolume}
        musicConfig={audioPack.music}
        customMusicUrl={customMusicUrl}
      />
    </>
  );
}
