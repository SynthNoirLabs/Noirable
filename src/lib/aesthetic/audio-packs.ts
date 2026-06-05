import { isBuiltInAestheticId } from "./types";
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

const cyberFixerAudio: AudioPack = {
  sfx: {
    typewriter: { src: "/assets/cyber-fixer/typewriter.mp3", volume: 0.7 },
    thunder: { src: "/assets/cyber-fixer/thunder.mp3", volume: 0.8 },
    phone: { src: "/assets/cyber-fixer/phone.mp3", volume: 0.75 },
  },
  music: {
    src: "/assets/noir/noir-jazz-loop.mp3",
    volume: 0.25,
  },
  ambient: {
    rain: {
      src: "/assets/cyber-fixer/rain.mp3",
      intensityVolume: {
        low: 0.2,
        medium: 0.3,
        high: 0.4,
      },
    },
    crackle: {
      src: "/assets/cyber-fixer/crackle.mp3",
      volume: 0.4,
    },
  },
};

const nostromoConsoleAudio: AudioPack = {
  sfx: {
    typewriter: { src: "/assets/nostromo-console/typewriter.mp3", volume: 0.5 },
    thunder: { src: "/assets/nostromo-console/thunder.mp3", volume: 0.3 },
    phone: { src: "/assets/nostromo-console/phone.mp3", volume: 0.5 },
  },
  music: {
    src: "/assets/noir/noir-jazz-loop.mp3",
    volume: 0.1,
  },
  ambient: {
    rain: {
      src: "/assets/nostromo-console/rain.mp3",
      intensityVolume: {
        low: 0.05,
        medium: 0.08,
        high: 0.12,
      },
    },
    crackle: {
      src: "/assets/nostromo-console/crackle.mp3",
      volume: 0.6,
    },
  },
};

const gothicManorAudio: AudioPack = {
  sfx: {
    typewriter: { src: "/assets/gothic-manor/typewriter.mp3", volume: 0.55 },
    thunder: { src: "/assets/gothic-manor/thunder.mp3", volume: 0.95 },
    phone: { src: "/assets/gothic-manor/phone.mp3", volume: 0.6 },
  },
  music: {
    src: "/assets/noir/noir-jazz-loop.mp3",
    volume: 0.15,
  },
  ambient: {
    rain: {
      src: "/assets/gothic-manor/rain.mp3",
      intensityVolume: {
        low: 0.22,
        medium: 0.32,
        high: 0.42,
      },
    },
    crackle: {
      src: "/assets/gothic-manor/crackle.mp3",
      volume: 0.3,
    },
  },
};

/**
 * Registry of audio packs by aesthetic ID.
 */
export const AUDIO_PACKS: Record<AestheticId, AudioPack> = {
  noir: noirAudio,
  minimal: minimalAudio,
  "cyber-fixer": cyberFixerAudio,
  "nostromo-console": nostromoConsoleAudio,
  "gothic-manor": gothicManorAudio,
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

export function getAudioPackSafe(id: AestheticId): AudioPack | null {
  if (isBuiltInAestheticId(id)) {
    return getAudioPack(id);
  }

  return null;
}
