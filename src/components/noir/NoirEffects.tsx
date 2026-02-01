"use client";

import dynamic from "next/dynamic";
import { CrackleAudio } from "@/components/noir/CrackleAudio";
import { CrackleOverlay } from "@/components/noir/CrackleOverlay";
import { FogOverlay } from "@/components/noir/FogOverlay";
import { NoirMusic } from "@/components/noir/NoirMusic";
import { RainAudio } from "@/components/noir/RainAudio";
import type { AmbientSettings } from "@/lib/store/useA2UIStore";

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
}

export function NoirEffects({ ambient, soundEnabled, musicEnabled = false }: NoirEffectsProps) {
  return (
    <>
      <RainOverlay enabled={ambient.rainEnabled} intensity={ambient.intensity} />
      <FogOverlay enabled={ambient.fogEnabled} intensity={ambient.intensity} />
      {ambient.crackleEnabled && (
        <>
          <CrackleOverlay intensity={ambient.intensity} />
          <CrackleAudio
            enabled={ambient.crackleEnabled}
            volume={ambient.crackleVolume}
            soundEnabled={soundEnabled}
          />
        </>
      )}
      <RainAudio
        enabled={ambient.rainEnabled}
        intensity={ambient.intensity}
        volumeScale={ambient.rainVolume}
        soundEnabled={soundEnabled}
      />
      <NoirMusic enabled={musicEnabled} soundEnabled={soundEnabled} />
    </>
  );
}
