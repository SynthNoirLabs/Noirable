import type { AestheticId, AudioPack } from "./types";

/**
 * Audio pack configurations for each aesthetic profile.
 * These are duplicated from the server-only registry for client-side use.
 * Client components can safely import from this module without server-only constraints.
 */

const noirAudio: AudioPack = {
  sfx: {
    typewriter: { src: "/assets/noir/typewriter.mp3", volume: 0.6 },
    thunder: { src: "/assets/noir/thunder.mp3", volume: 0.75 },
    phone: { src: "/assets/noir/phone-ring.mp3", volume: 0.7 },
  },
  music: {
    src: "/assets/noir/noir-jazz-loop.mp3",
    volume: 0.22,
  },
  ambient: {
    rain: {
      src: "/assets/noir/rain-loop.wav",
      intensityVolume: {
        low: 0.18,
        medium: 0.26,
        high: 0.34,
      },
    },
    crackle: {
      src: "/assets/noir/vinyl-crackle.wav",
      volume: 0.35,
    },
  },
};

const minimalAudio: AudioPack = {
  sfx: {
    typewriter: { src: "/assets/noir/typewriter.mp3", volume: 0.3 },
    thunder: { src: "/assets/noir/thunder.mp3", volume: 0.38 },
    phone: { src: "/assets/noir/phone-ring.mp3", volume: 0.35 },
  },
  music: {
    src: "/assets/noir/noir-jazz-loop.mp3",
    volume: 0.07,
  },
  ambient: {
    rain: {
      src: "/assets/noir/rain-loop.wav",
      intensityVolume: {
        low: 0.07,
        medium: 0.1,
        high: 0.14,
      },
    },
    crackle: {
      src: "/assets/noir/vinyl-crackle.wav",
      volume: 0.14,
    },
  },
};

/**
 * Registry of audio packs by aesthetic ID.
 */
export const AUDIO_PACKS: Record<AestheticId, AudioPack> = {
  noir: noirAudio,
  minimal: minimalAudio,
};

/**
 * Get the audio pack for a given aesthetic ID.
 * Falls back to noir if the ID is not found.
 *
 * @param aestheticId - The aesthetic ID to retrieve audio for
 * @returns The audio pack configuration
 *
 * @example
 * ```typescript
 * const pack = getAudioPack("noir");
 * console.log(pack.music.volume); // 0.22
 * ```
 */
export function getAudioPack(aestheticId: AestheticId): AudioPack {
  return AUDIO_PACKS[aestheticId] ?? AUDIO_PACKS.noir;
}
