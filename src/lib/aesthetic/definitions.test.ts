import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { AESTHETIC_DEFINITIONS, getAestheticDefinition } from "./definitions";
import type { BuiltInAestheticId } from "./types";

const IDS: BuiltInAestheticId[] = [
  "noir",
  "minimal",
  "cyber-fixer",
  "nostromo-console",
  "gothic-manor",
];

describe("AESTHETIC_DEFINITIONS", () => {
  it("has an entry for every built-in id", () => {
    expect(Object.keys(AESTHETIC_DEFINITIONS).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)("%s definition is complete", (id) => {
    const def = AESTHETIC_DEFINITIONS[id];
    expect(def.id).toBe(id);
    expect(def.name).toBeTruthy();
    expect(def.description).toBeTruthy();
    expect(def.voiceId).toMatch(/^[A-Za-z0-9]+$/);
    expect(def.imageStylePrompt.length).toBeGreaterThan(20);

    // Theme: all 9 color tokens present
    const colorKeys = Object.keys(def.theme.colors);
    expect(colorKeys).toEqual(
      expect.arrayContaining([
        "background",
        "surface",
        "surfaceAlt",
        "text",
        "textMuted",
        "accent",
        "accentMuted",
        "border",
        "error",
      ])
    );

    // Audio
    expect(def.audio.sfx.typewriter.src).toContain(".mp3");
    expect(def.audio.sfx.thunder.src).toBeTruthy();
    expect(def.audio.sfx.phone.src).toBeTruthy();
    expect(def.audio.music.src).toBeTruthy();
    expect(def.audio.ambient.rain?.src).toBeTruthy();

    // Identity layer
    const { identity } = def;
    expect(typeof identity.glowStrength).toBe("number");
    const vd = identity.voiceDirection;
    expect(vd.stability).toBeGreaterThanOrEqual(0);
    expect(vd.stability).toBeLessThanOrEqual(1);
    expect(vd.style).toBeGreaterThanOrEqual(0);
    expect(vd.style).toBeLessThanOrEqual(1);
    expect(vd.speed).toBeGreaterThanOrEqual(0.7);
    expect(vd.speed).toBeLessThanOrEqual(1.2);
    expect(identity.musicStylePrompt.length).toBeGreaterThan(10);
    expect(identity.musicPresets.length).toBeGreaterThanOrEqual(1);
    expect(identity.samplePrompts.length).toBeGreaterThanOrEqual(1);
    expect(identity.voicePreviewLine).toBeTruthy();
    expect(identity.layoutDoctrine).toContain("LAYOUT DOCTRINE");

    // Copy: every chrome string present
    const copyKeys = Object.keys(identity.copy);
    expect(copyKeys).toEqual(
      expect.arrayContaining([
        "editorTitle",
        "workspaceTitle",
        "imagePending",
        "audioPending",
        "videoPending",
        "dictaphoneTitle",
        "dictaphoneItemLabel",
        "dictaphoneDeleteLabel",
        "dictaphoneEmptyHint",
      ])
    );

    // Bigger-bets identity layer: style tokens, effects, atmosphere, motion.
    expect(identity.styleTokens.radius).toBeTruthy();
    expect(["sharp", "soft", "beveled", "double"]).toContain(identity.styleTokens.borderStyle);
    expect(["uppercase", "titlecase", "normal"]).toContain(identity.styleTokens.headerCase);
    expect(["paper", "parchment", "hologram", "wireframe", "flat"]).toContain(
      identity.effects.card
    );
    expect(["wax", "digital", "blood", "none"]).toContain(identity.effects.stamp);
    expect(["scanlines", "phosphor", "none"]).toContain(identity.effects.screen);
    expect(identity.effects.bloom).toBeGreaterThanOrEqual(0);
    expect(["rain", "fog", "grain", "ember", "none"]).toContain(identity.atmosphere.particle);
    expect(identity.atmosphere.vignetteIntensity).toBeGreaterThanOrEqual(0);
    expect(identity.atmosphere.vignetteIntensity).toBeLessThanOrEqual(1);
    expect(identity.atmosphere.lightningFrequency).toBeGreaterThanOrEqual(0);
    expect(["cinematic", "crisp", "glitch", "terminal", "candle"]).toContain(
      identity.motion.entrance
    );
    expect(identity.motion.durationMs).toBeGreaterThan(0);
    expect(["darkroom", "crisp", "scanline", "raster", "candle"]).toContain(
      identity.motion.imageReveal
    );

    // Structured image spec is complete and has rotating motifs.
    expect(identity.imageSpec.medium.length).toBeGreaterThan(5);
    expect(identity.imageSpec.negative.length).toBeGreaterThanOrEqual(1);
    expect(identity.imageSpec.motifs.length).toBeGreaterThanOrEqual(2);

    // Composition seed + audio event map present.
    expect(typeof identity.compositionSeed).toBe("number");
    expect(typeof identity.audioEvents).toBe("object");
  });

  it("keeps noir copy/voice byte-identical to its historical values", () => {
    const noir = AESTHETIC_DEFINITIONS.noir;
    expect(noir.theme.colors.accent).toBe("#ffbf00");
    expect(noir.voiceId).toBe("r5wMVcYycQezNCms1jJb");
    expect(noir.identity.copy.editorTitle).toBe("CASE FILE // JSON DATA");
    expect(noir.identity.copy.workspaceTitle).toBe("Evidence Board");
    expect(noir.identity.copy.imagePending).toBe("IMAGE PENDING");
    expect(noir.identity.copy.dictaphoneTitle).toBe("Dictaphone Logs");
    expect(noir.identity.voicePreviewLine).toBe(
      "The rain never stops in this town. Neither does the code."
    );
  });

  it("getAestheticDefinition falls back to noir for custom/unknown ids", () => {
    expect(getAestheticDefinition("custom-abc").id).toBe("noir");
    expect(getAestheticDefinition(undefined).id).toBe("noir");
    expect(getAestheticDefinition("cyber-fixer").id).toBe("cyber-fixer");
  });

  it("every referenced audio asset exists under public/", () => {
    const publicDir = join(process.cwd(), "public");
    for (const id of IDS) {
      const def = AESTHETIC_DEFINITIONS[id];
      const srcs = [
        def.audio.sfx.typewriter.src,
        def.audio.sfx.thunder.src,
        def.audio.sfx.phone.src,
        def.audio.music.src,
        def.audio.ambient.rain?.src,
        def.audio.ambient.crackle?.src,
      ].filter((s): s is string => Boolean(s));
      for (const src of srcs) {
        const path = join(publicDir, src);
        expect(existsSync(path), `${id}: missing asset ${src}`).toBe(true);
      }
    }
  });

  it("globals.css --aesthetic-accent matches each def's accent color", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    for (const id of IDS) {
      const def = AESTHETIC_DEFINITIONS[id];
      // Find the [data-aesthetic="id"] block and check its accent var.
      const blockRe = new RegExp(`\\[data-aesthetic="${id}"\\]\\s*\\{([^}]*)\\}`);
      const match = css.match(blockRe);
      expect(match, `no [data-aesthetic="${id}"] block in globals.css`).toBeTruthy();
      const block = match![1];
      const accentRe = /--aesthetic-accent:\s*([^;]+);/;
      const accentMatch = block.match(accentRe);
      expect(accentMatch, `${id}: no --aesthetic-accent`).toBeTruthy();
      expect(accentMatch![1].trim().toLowerCase()).toBe(def.theme.colors.accent.toLowerCase());
    }
  });
});
