import { describe, it, expect } from "vitest";
import { buildNoirImagePrompt, buildImageDirection } from "./images";

describe("buildNoirImagePrompt", () => {
  it("adds noir style guidance to prompts", () => {
    const prompt = buildNoirImagePrompt("A detective in a dim office");
    expect(prompt).toMatch(/detective/i);
    expect(prompt).toMatch(/noir/i);
    expect(prompt).toMatch(/film grain/i);
  });

  it("returns style prompt when input is empty", () => {
    const prompt = buildNoirImagePrompt(" ");
    expect(prompt).toMatch(/noir/i);
    expect(prompt).toMatch(/film grain/i);
  });

  it("leads with the subject and folds in the structured spec for built-in presets", () => {
    const prompt = buildNoirImagePrompt("A witness statement", "noir");
    expect(prompt.startsWith("A witness statement,")).toBe(true);
    // Ordered medium → … → motif assembly, not the flat ". Style: X." join.
    expect(prompt).not.toMatch(/Style:/);
  });

  it("rotates the motif by image index", () => {
    const first = buildNoirImagePrompt("subject", "noir", null, 0);
    const second = buildNoirImagePrompt("subject", "noir", null, 1);
    expect(first).not.toBe(second);
  });

  it("honors a flat custom override over the structured spec", () => {
    const prompt = buildNoirImagePrompt("subject", "noir", "watercolor wash, soft pastel");
    expect(prompt).toBe("subject. Style: watercolor wash, soft pastel.");
  });
});

describe("buildImageDirection", () => {
  it("derives a negative prompt from the spec's true negatives", () => {
    const direction = buildImageDirection({ prompt: "subject", aestheticId: "noir" });
    expect(direction.negativePrompt).toMatch(/watermark/);
    expect(direction.negativePrompt).toMatch(/text/);
  });

  it("emits no negative prompt for a flat custom override", () => {
    const direction = buildImageDirection({
      prompt: "subject",
      aestheticId: "noir",
      customImageStylePrompt: "oil painting",
    });
    expect(direction.negativePrompt).toBe("");
  });

  it("offsets the seed by image index for per-board coherence", () => {
    const direction = buildImageDirection({
      prompt: "subject",
      aestheticId: "noir",
      sessionSeed: 100,
      imageIndex: 3,
    });
    expect(direction.seed).toBe(103);
  });

  it("leaves the seed undefined when no session seed is supplied", () => {
    const direction = buildImageDirection({ prompt: "subject", aestheticId: "noir" });
    expect(direction.seed).toBeUndefined();
  });
});
