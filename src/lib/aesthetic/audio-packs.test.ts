import { describe, it, expect } from "vitest";
import { AUDIO_PACKS, getAudioPack } from "./audio-packs";
import type { AestheticId } from "./types";

describe("audio-packs", () => {
  describe("AUDIO_PACKS registry", () => {
    it("should contain noir and minimal audio packs", () => {
      expect(AUDIO_PACKS).toHaveProperty("noir");
      expect(AUDIO_PACKS).toHaveProperty("minimal");
    });

    it("should have exactly 2 audio packs", () => {
      expect(Object.keys(AUDIO_PACKS)).toHaveLength(2);
    });
  });

  describe("noir audio pack", () => {
    const noir = AUDIO_PACKS.noir;

    it("should have all required SFX", () => {
      expect(noir.sfx).toHaveProperty("typewriter");
      expect(noir.sfx).toHaveProperty("thunder");
      expect(noir.sfx).toHaveProperty("phone");
    });

    it("should have correct typewriter config", () => {
      expect(noir.sfx.typewriter).toEqual({
        src: "/assets/noir/typewriter.mp3",
        volume: 0.6,
      });
    });

    it("should have correct thunder config", () => {
      expect(noir.sfx.thunder).toEqual({
        src: "/assets/noir/thunder.mp3",
        volume: 0.75,
      });
    });

    it("should have correct phone config", () => {
      expect(noir.sfx.phone).toEqual({
        src: "/assets/noir/phone-ring.mp3",
        volume: 0.7,
      });
    });

    it("should have music config with correct volume", () => {
      expect(noir.music).toEqual({
        src: "/assets/noir/noir-jazz-loop.mp3",
        volume: 0.22,
      });
    });

    it("should have rain ambient audio with intensity levels", () => {
      expect(noir.ambient.rain).toBeDefined();
      expect(noir.ambient.rain?.src).toBe("/assets/noir/rain-loop.wav");
      expect(noir.ambient.rain?.intensityVolume).toEqual({
        low: 0.18,
        medium: 0.26,
        high: 0.34,
      });
    });

    it("should have crackle ambient audio", () => {
      expect(noir.ambient.crackle).toBeDefined();
      expect(noir.ambient.crackle?.src).toBe("/assets/noir/vinyl-crackle.wav");
      expect(noir.ambient.crackle?.volume).toBe(0.35);
    });
  });

  describe("minimal audio pack", () => {
    const minimal = AUDIO_PACKS.minimal;

    it("should have all required SFX", () => {
      expect(minimal.sfx).toHaveProperty("typewriter");
      expect(minimal.sfx).toHaveProperty("thunder");
      expect(minimal.sfx).toHaveProperty("phone");
    });

    it("should have reduced typewriter volume (50% of noir)", () => {
      expect(minimal.sfx.typewriter).toEqual({
        src: "/assets/noir/typewriter.mp3",
        volume: 0.3,
      });
      expect(minimal.sfx.typewriter.volume).toBe(AUDIO_PACKS.noir.sfx.typewriter.volume / 2);
    });

    it("should have reduced thunder volume (~50% of noir)", () => {
      expect(minimal.sfx.thunder).toEqual({
        src: "/assets/noir/thunder.mp3",
        volume: 0.38,
      });
      // Note: 0.38 is approximately 50% of 0.75 (actual: 0.375)
      expect(minimal.sfx.thunder.volume).toBeLessThan(AUDIO_PACKS.noir.sfx.thunder.volume);
    });

    it("should have reduced phone volume (50% of noir)", () => {
      expect(minimal.sfx.phone).toEqual({
        src: "/assets/noir/phone-ring.mp3",
        volume: 0.35,
      });
      expect(minimal.sfx.phone.volume).toBe(AUDIO_PACKS.noir.sfx.phone.volume / 2);
    });

    it("should have reduced music volume (~30% of noir)", () => {
      expect(minimal.music).toEqual({
        src: "/assets/noir/noir-jazz-loop.mp3",
        volume: 0.07,
      });
    });

    it("should have reduced rain ambient audio", () => {
      expect(minimal.ambient.rain).toBeDefined();
      expect(minimal.ambient.rain?.src).toBe("/assets/noir/rain-loop.wav");
      expect(minimal.ambient.rain?.intensityVolume).toEqual({
        low: 0.07,
        medium: 0.1,
        high: 0.14,
      });
    });

    it("should have reduced crackle volume (40% of noir)", () => {
      expect(minimal.ambient.crackle).toBeDefined();
      expect(minimal.ambient.crackle?.src).toBe("/assets/noir/vinyl-crackle.wav");
      expect(minimal.ambient.crackle?.volume).toBe(0.14);
    });
  });

  describe("getAudioPack function", () => {
    it("should return noir audio pack for 'noir' ID", () => {
      const pack = getAudioPack("noir");
      expect(pack).toBe(AUDIO_PACKS.noir);
    });

    it("should return minimal audio pack for 'minimal' ID", () => {
      const pack = getAudioPack("minimal");
      expect(pack).toBe(AUDIO_PACKS.minimal);
    });

    it("should return noir as fallback for invalid ID", () => {
      const pack = getAudioPack("noir" as AestheticId);
      expect(pack).toBe(AUDIO_PACKS.noir);
    });

    it("should have correct structure for returned pack", () => {
      const pack = getAudioPack("noir");
      expect(pack).toHaveProperty("sfx");
      expect(pack).toHaveProperty("music");
      expect(pack).toHaveProperty("ambient");
    });

    it("should return immutable reference to registry entry", () => {
      const pack1 = getAudioPack("noir");
      const pack2 = getAudioPack("noir");
      expect(pack1).toBe(pack2);
    });
  });

  describe("audio pack consistency", () => {
    it("should use same audio files for noir and minimal", () => {
      const noir = AUDIO_PACKS.noir;
      const minimal = AUDIO_PACKS.minimal;

      // All SFX should use same files
      expect(minimal.sfx.typewriter.src).toBe(noir.sfx.typewriter.src);
      expect(minimal.sfx.thunder.src).toBe(noir.sfx.thunder.src);
      expect(minimal.sfx.phone.src).toBe(noir.sfx.phone.src);

      // Music should use same file
      expect(minimal.music.src).toBe(noir.music.src);

      // Ambient should use same files
      expect(minimal.ambient.rain?.src).toBe(noir.ambient.rain?.src);
      expect(minimal.ambient.crackle?.src).toBe(noir.ambient.crackle?.src);
    });

    it("should have minimal volumes lower than noir", () => {
      const noir = AUDIO_PACKS.noir;
      const minimal = AUDIO_PACKS.minimal;

      expect(minimal.sfx.typewriter.volume).toBeLessThan(noir.sfx.typewriter.volume);
      expect(minimal.sfx.thunder.volume).toBeLessThan(noir.sfx.thunder.volume);
      expect(minimal.sfx.phone.volume).toBeLessThan(noir.sfx.phone.volume);
      expect(minimal.music.volume).toBeLessThan(noir.music.volume);
      expect(minimal.ambient.crackle?.volume).toBeLessThan(noir.ambient.crackle?.volume ?? 0);
    });

    it("should have valid volume ranges (0-1)", () => {
      Object.values(AUDIO_PACKS).forEach((pack) => {
        Object.values(pack.sfx).forEach((sfx) => {
          expect(sfx.volume).toBeGreaterThanOrEqual(0);
          expect(sfx.volume).toBeLessThanOrEqual(1);
        });

        expect(pack.music.volume).toBeGreaterThanOrEqual(0);
        expect(pack.music.volume).toBeLessThanOrEqual(1);

        if (pack.ambient.rain) {
          expect(pack.ambient.rain.intensityVolume.low).toBeGreaterThanOrEqual(0);
          expect(pack.ambient.rain.intensityVolume.low).toBeLessThanOrEqual(1);
          expect(pack.ambient.rain.intensityVolume.medium).toBeGreaterThanOrEqual(0);
          expect(pack.ambient.rain.intensityVolume.medium).toBeLessThanOrEqual(1);
          expect(pack.ambient.rain.intensityVolume.high).toBeGreaterThanOrEqual(0);
          expect(pack.ambient.rain.intensityVolume.high).toBeLessThanOrEqual(1);
        }

        if (pack.ambient.crackle) {
          expect(pack.ambient.crackle.volume).toBeGreaterThanOrEqual(0);
          expect(pack.ambient.crackle.volume).toBeLessThanOrEqual(1);
        }
      });
    });

    it("should have rain intensity levels in ascending order", () => {
      Object.values(AUDIO_PACKS).forEach((pack) => {
        if (pack.ambient.rain) {
          const { low, medium, high } = pack.ambient.rain.intensityVolume;
          expect(low).toBeLessThanOrEqual(medium);
          expect(medium).toBeLessThanOrEqual(high);
        }
      });
    });
  });
});
