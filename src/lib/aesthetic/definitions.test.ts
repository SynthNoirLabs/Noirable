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
        "loadingImageLabel",
        "loadingStatus",
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

  it("globals.css [data-aesthetic] vars stay in parity with each def", () => {
    // The per-preset palette is mirrored in BOTH definitions.ts (the source of
    // truth) and the hand-maintained [data-aesthetic="…"] blocks in globals.css.
    // Until those blocks are code-generated, this asserts EVERY mirrored var
    // matches the def so a color/scalar change in one can't silently drift from
    // the other (previously only --aesthetic-accent was guarded).
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    // Map each `--aesthetic-*` CSS var to the def value it must equal. Colors are
    // compared case-insensitively; scalars are compared as numbers.
    const colorVar = (cssVar: string, value: string) => ({
      cssVar,
      expected: value.toLowerCase(),
      kind: "color" as const,
    });
    const numberVar = (cssVar: string, value: number) => ({
      cssVar,
      expected: String(value),
      kind: "number" as const,
    });

    for (const id of IDS) {
      const def = AESTHETIC_DEFINITIONS[id];
      const c = def.theme.colors;
      const a = def.identity.atmosphere;

      // Match the [data-aesthetic="id"] block (the first/colors block; the regex
      // is non-greedy so it stops at the first closing brace).
      const blockRe = new RegExp(`\\[data-aesthetic="${id}"\\]\\s*\\{([^}]*)\\}`);
      const match = css.match(blockRe);
      expect(match, `no [data-aesthetic="${id}"] block in globals.css`).toBeTruthy();
      const block = match![1];

      const expectations = [
        colorVar("--aesthetic-background", c.background),
        colorVar("--aesthetic-surface", c.surface),
        colorVar("--aesthetic-surface-alt", c.surfaceAlt),
        colorVar("--aesthetic-text", c.text),
        colorVar("--aesthetic-text-muted", c.textMuted),
        colorVar("--aesthetic-accent", c.accent),
        colorVar("--aesthetic-accent-muted", c.accentMuted),
        colorVar("--aesthetic-border", c.border),
        colorVar("--aesthetic-error", c.error),
        colorVar("--aesthetic-particle-color", a.particleColor),
        colorVar("--aesthetic-lightning-color", a.lightningColor),
        colorVar("--aesthetic-vignette-color", a.vignetteColor),
        numberVar("--aesthetic-vignette-intensity", a.vignetteIntensity),
        numberVar("--aesthetic-lightning-frequency", a.lightningFrequency),
        numberVar("--aesthetic-glow-strength", def.identity.glowStrength),
      ];

      for (const { cssVar, expected, kind } of expectations) {
        // Escape the var name for the regex; capture up to the `;`.
        const re = new RegExp(`${cssVar.replace(/[-]/g, "\\-")}:\\s*([^;]+);`);
        const m = block.match(re);
        expect(m, `${id}: missing ${cssVar} in globals.css block`).toBeTruthy();
        const actual = m![1].trim();
        if (kind === "color") {
          expect(actual.toLowerCase(), `${id}: ${cssVar} drift`).toBe(expected);
        } else {
          expect(Number(actual), `${id}: ${cssVar} drift`).toBe(Number(expected));
        }
      }
    }
  });
});
