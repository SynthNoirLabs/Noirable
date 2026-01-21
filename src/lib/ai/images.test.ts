import { describe, it, expect } from "vitest";
import { buildNoirImagePrompt } from "./images";

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
    expect(prompt).toMatch(/neon/i);
  });
});
