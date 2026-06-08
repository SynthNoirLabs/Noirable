import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildNoirImagePrompt, buildImageDirection } from "./images";

// --- SDK mocks for the generation-routing tests ---------------------------
// A sentinel the Google provider's image() factory returns, so we can assert
// the Imagen call routes through google.image(id) and NOT a bare string model.
const googleImageModel = { __googleImageModel: true };
const googleImageFactory = vi.fn(() => googleImageModel);

vi.mock("ai", () => ({
  generateImage: vi.fn(async () => ({
    image: { mediaType: "image/png", base64: "QUJD" },
  })),
  generateText: vi.fn(async () => ({
    files: [{ mediaType: "image/png", base64: "QUJD" }],
  })),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => {
    const provider = () => ({ __googleTextModel: true });
    provider.image = googleImageFactory;
    return provider;
  }),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => ({ image: (id: string) => ({ __openaiImageModel: id }) })),
}));

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

describe("generateImageDataUrl — Imagen routing", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, GOOGLE_GENERATIVE_AI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("routes Google Imagen through google.image(id), not a bare string model (the 404 bug)", async () => {
    const { generateImageDataUrl } = await import("./images");
    const { generateImage } = await import("ai");

    const dataUrl = await generateImageDataUrl(
      "a mugshot overlay",
      "nostromo-console",
      null,
      "imagen-4.0-generate-001"
    );

    // Imagen MUST be built via the Google provider's image() factory — passing a
    // bare model-id string only resolves through the AI Gateway and otherwise
    // throws (→ null → image 404). Assert the factory got the model id…
    expect(googleImageFactory).toHaveBeenCalledWith("imagen-4.0-generate-001");
    // …and that generateImage received that model OBJECT, never the raw string.
    const call = (generateImage as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.model).toBe(googleImageModel);
    expect(call.model).not.toBe("imagen-4.0-generate-001");

    // The fix yields a usable data URL (so the route persists + serves it).
    expect(dataUrl).toBe("data:image/png;base64,QUJD");
  });

  it("passes an Imagen-supported aspect ratio via providerOptions.google (not the top-level param)", async () => {
    const { generateImageDataUrl } = await import("./images");
    const { generateImage } = await import("ai");

    await generateImageDataUrl(
      "a wide establishing shot",
      "nostromo-console",
      null,
      "imagen-4.0-generate-001",
      "16:9"
    );

    const call = (generateImage as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // Imagen reads aspectRatio from providerOptions.google, and ignores the
    // top-level aspectRatio/seed (so we don't thread those).
    expect(call.providerOptions?.google?.aspectRatio).toBe("16:9");
    expect(call.aspectRatio).toBeUndefined();
    expect(call.seed).toBeUndefined();
  });

  it("drops an unsupported aspect ratio rather than failing the Imagen call", async () => {
    const { generateImageDataUrl } = await import("./images");
    const { generateImage } = await import("ai");

    await generateImageDataUrl(
      "a panoramic vista",
      "nostromo-console",
      null,
      "imagen-4.0-generate-001",
      "21:9" // valid for Gemini, NOT in the Imagen set
    );

    const call = (generateImage as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.providerOptions).toBeUndefined();
  });
});
