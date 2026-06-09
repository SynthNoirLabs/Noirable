import crypto from "node:crypto";
import { generateImage, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { getCustomImageStylePrompt } from "@/lib/ai/image-style";
import { saveImageBase64, savePendingImageMetadata } from "@/lib/ai/imageStore";
import { getImageGenerationModels, getModelInfo, type ModelInfo } from "@/lib/ai/model-registry";
import { getAestheticProfile } from "@/lib/aesthetic/registry";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";
import { getAestheticCopy, getCompositionSeed, getImageSpec } from "@/lib/aesthetic/identity";
import type { AestheticId, ImageStyleSpec } from "@/lib/aesthetic/types";

const NOIR_STYLE_PROMPT =
  "shot as a 1940s detective's evidence photograph, noir cinematic, rain-slicked streets, moody low-key lighting, hard chiaroscuro contrast, heavy film grain, 35mm black-and-white photography, deep shadows, light fog, desaturated palette, no bright saturated color, no text or watermark";

/**
 * Per-board coherence: image direction threaded alongside the styled prompt.
 * `sessionSeed` keeps a board's images on the same motif/seed family while
 * `imageIndex` rotates the motif so cards in one board vary without drifting.
 */
export interface ImageDirection {
  /** Ordered positive prompt assembled from the spec (or flat fallback). */
  prompt: string;
  /** True-negative prompt (empty string when the spec carries no negatives). */
  negativePrompt: string;
  /** `{width}:{height}` aspect ratio, when a spec/board requests one. */
  aspectRatio?: string;
  /** Deterministic seed (sessionSeed + imageIndex) for reproducible variety. */
  seed?: number;
}

function selectImageModel(
  imageModel?: string,
  aestheticId?: string
): {
  model: ModelInfo;
  provider: "google" | "openai";
} | null {
  const explicitModel = imageModel || process.env.AI_IMAGE_MODEL;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  if (explicitModel) {
    const modelInfo = getModelInfo(explicitModel);
    if (modelInfo?.capabilities.imageGen) {
      return {
        model: modelInfo,
        provider: modelInfo.provider as "google" | "openai",
      };
    }
  }

  // Prefer the active aesthetic's declared imageModel before the env/key chain,
  // so a preset can pin its own generator (Bet 7). Only honored if it can
  // actually generate images AND the key for its provider is configured —
  // otherwise a preset pinned to (say) an OpenAI model on a Google-only
  // deployment would hard-fail instead of falling through to an available one.
  const presetModel = aestheticId ? getAestheticDefinition(aestheticId).imageModel : undefined;
  if (presetModel) {
    const modelInfo = getModelInfo(presetModel);
    const provider = modelInfo?.provider as "google" | "openai" | undefined;
    const providerKeyAvailable =
      provider === "google"
        ? Boolean(googleKey)
        : provider === "openai"
          ? Boolean(openaiKey || gatewayKey)
          : false;
    if (modelInfo?.capabilities.imageGen && providerKeyAvailable) {
      return { model: modelInfo, provider: provider as "google" | "openai" };
    }
  }

  const imageModels = getImageGenerationModels();

  if (googleKey) {
    const googleModels = imageModels.filter((m) => m.provider === "google");
    const preferred =
      googleModels.find((m) => m.id === "gemini-3-pro-image") ||
      googleModels.find((m) => m.id === "gemini-3.1-flash-image") ||
      googleModels[0];
    if (preferred) {
      return { model: preferred, provider: "google" };
    }
  }

  if (openaiKey || gatewayKey) {
    const openaiModels = imageModels.filter((m) => m.provider === "openai");
    const preferred =
      openaiModels.find((m) => m.id === "gpt-image-1.5") ||
      openaiModels.find((m) => m.id === "dall-e-3") ||
      openaiModels[0];
    if (preferred) {
      return { model: preferred, provider: "openai" };
    }
  }

  return null;
}

/**
 * Assemble an ORDERED positive prompt from the structured spec: subject first,
 * then medium → lighting → palette → lens → framing, then a single rotating
 * motif selected by index so cards in one board vary coherently rather than
 * randomly. The pieces are comma-joined to read as one directed shot.
 */
function assembleSpecPrompt(prompt: string, spec: ImageStyleSpec, imageIndex = 0): string {
  const motif =
    spec.motifs.length > 0
      ? spec.motifs[((imageIndex % spec.motifs.length) + spec.motifs.length) % spec.motifs.length]
      : "";

  const parts = [
    prompt.trim(),
    spec.medium,
    spec.lighting,
    spec.palette,
    spec.lens,
    spec.framing,
    motif,
  ].filter((part) => part && part.trim().length > 0);

  return parts.join(", ");
}

/**
 * Build the separate negative-prompt string from the spec's true-negatives.
 */
function assembleNegativePrompt(spec: ImageStyleSpec): string {
  return spec.negative.join(", ");
}

export function buildNoirImagePrompt(
  prompt: string,
  aestheticId?: string,
  customImageStylePrompt?: string | null,
  imageIndex?: number
): string {
  // Custom profiles only carry a flat override; honor it directly so they keep
  // working through the back-compat path.
  const customStyle = customImageStylePrompt ?? getCustomImageStylePrompt();
  if (customStyle) {
    if (!prompt.trim()) return customStyle;
    return `${prompt}. Style: ${customStyle}.`;
  }

  // Prefer the structured per-preset spec (ordered positive + rotating motif).
  // Built-in ids resolve a real spec; custom/unknown ids fall back to noir's.
  const spec = getImageSpec(aestheticId as AestheticId | undefined);
  if (spec) {
    return assembleSpecPrompt(prompt, spec, imageIndex);
  }

  // Fall back to the flat imageStylePrompt joining so nothing regresses.
  let stylePrompt = NOIR_STYLE_PROMPT;
  if (aestheticId) {
    const profile = getAestheticProfile(aestheticId as AestheticId);
    if (profile?.imageStylePrompt) {
      stylePrompt = profile.imageStylePrompt;
    }
  }

  if (!prompt.trim()) return stylePrompt;
  return `${prompt}. Style: ${stylePrompt}.`;
}

/**
 * Resolve the full image direction (positive + negative prompt, optional aspect
 * ratio + deterministic seed) for one generation. Prefers the structured spec
 * and only emits a negative prompt when the spec carries one; custom profiles
 * (flat override) get a positive-only direction. The seed is derived from the
 * board's `sessionSeed` plus the per-card `imageIndex` so a board stays in one
 * coherent family while individual cards still differ.
 */
export function buildImageDirection(opts: {
  prompt: string;
  aestheticId?: string;
  customImageStylePrompt?: string | null;
  aspectRatio?: string;
  sessionSeed?: number;
  imageIndex?: number;
}): ImageDirection {
  const { prompt, aestheticId, customImageStylePrompt, aspectRatio, sessionSeed, imageIndex } =
    opts;

  const positivePrompt = buildNoirImagePrompt(
    prompt,
    aestheticId,
    customImageStylePrompt,
    imageIndex
  );

  // Negatives only exist on the structured spec; the flat custom override has
  // none, so a custom profile gets a positive-only direction.
  const customStyle = customImageStylePrompt ?? getCustomImageStylePrompt();
  const spec = customStyle ? null : getImageSpec(aestheticId as AestheticId | undefined);
  const negativePrompt = spec ? assembleNegativePrompt(spec) : "";

  const seed =
    typeof sessionSeed === "number"
      ? sessionSeed + (typeof imageIndex === "number" ? imageIndex : 0)
      : undefined;

  return { prompt: positivePrompt, negativePrompt, aspectRatio, seed };
}

function fallbackSvgDataUrl(message: string, aestheticId?: string) {
  // An in-world "darkroom" placeholder rather than a plain gray box: an
  // evidence photo still developing in the tray. Warm amber compensates for the
  // sepia/grayscale filters the Image renderer applies on top. Non-noir presets
  // borrow their own pending copy as the secondary line so the placeholder
  // speaks in-world (e.g. "SIGNAL LOST" / "PORTRAIT UNDEVELOPED"); noir keeps
  // the default message so existing snapshots/tests don't move.
  const secondary =
    aestheticId && aestheticId !== "noir"
      ? getAestheticCopy(aestheticId as AestheticId).imagePending
      : message;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="320" viewBox="0 0 512 320">
  <rect width="512" height="320" fill="#0a0a0a"/>
  <rect x="18" y="18" width="476" height="284" fill="#141210" stroke="#3a3424" stroke-width="2"/>
  <rect x="18" y="18" width="476" height="284" fill="none" stroke="#3a3424" stroke-width="1" stroke-dasharray="2 6" opacity="0.5"/>
  <circle cx="256" cy="132" r="34" fill="none" stroke="#cbb957" stroke-width="1.5" opacity="0.5"/>
  <circle cx="256" cy="132" r="20" fill="none" stroke="#cbb957" stroke-width="1" opacity="0.3"/>
  <text x="50%" y="205" dominant-baseline="middle" text-anchor="middle" fill="#cbb957" font-family="monospace" font-size="15" letter-spacing="4" opacity="0.85">
    DARKROOM // DEVELOPING
  </text>
  <text x="50%" y="232" dominant-baseline="middle" text-anchor="middle" fill="#8a8170" font-family="monospace" font-size="11" letter-spacing="2">
    ${secondary}
  </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Aspect ratios the Google Gemini `generateText` imageConfig accepts. */
const GOOGLE_IMAGE_CONFIG_ASPECTS = new Set([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
]);

/**
 * Aspect ratios Google Imagen accepts via providerOptions.google.aspectRatio
 * (a narrower set than the Gemini generateText imageConfig above). Anything
 * outside this set is dropped so the call doesn't fail on an unsupported ratio.
 */
const IMAGEN_ASPECTS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

export async function generateImageDataUrl(
  prompt: string,
  aestheticId?: string,
  customImageStylePrompt?: string | null,
  imageModel?: string,
  aspectRatio?: string,
  sessionSeed?: number,
  imageIndex?: number
) {
  try {
    const selection = selectImageModel(imageModel, aestheticId);
    if (!selection) {
      console.warn("[AI Image Gen] No image generation model selected or available.");
      return null;
    }

    const { model, provider } = selection;
    const direction = buildImageDirection({
      prompt,
      aestheticId,
      customImageStylePrompt,
      aspectRatio,
      sessionSeed,
      imageIndex,
    });
    const styledPrompt = direction.prompt;

    console.log(
      `[AI Image Gen] Requesting image generation:\n` +
        `  - Model: ${model.id} (${model.name})\n` +
        `  - Provider: ${provider}\n` +
        `  - Method: ${model.capabilities.imageGenMethod}\n` +
        `  - Aspect: ${direction.aspectRatio ?? "default"}, Seed: ${direction.seed ?? "default"}\n` +
        `  - Prompt: "${styledPrompt}"\n` +
        `  - Negative: "${direction.negativePrompt}"`
    );
    const method = model.capabilities.imageGenMethod;

    let result;

    if (provider === "google" && method === "generateText") {
      const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      const google = createGoogleGenerativeAI({ apiKey: googleKey! });
      // Gemini's generateText image path takes responseModalities + an optional
      // imageConfig.aspectRatio. It exposes NO structured negativePrompt/seed
      // field (see GoogleGenerativeAIProviderOptions in @ai-sdk/google), so the
      // negatives are folded into the prompt as a prose directive and the seed
      // is left to the provider default. Guarded so the existing call is intact.
      const googleOptions: {
        responseModalities: ["IMAGE"];
        imageConfig?: { aspectRatio: string };
      } = { responseModalities: ["IMAGE"] };
      if (direction.aspectRatio && GOOGLE_IMAGE_CONFIG_ASPECTS.has(direction.aspectRatio)) {
        googleOptions.imageConfig = { aspectRatio: direction.aspectRatio };
      }
      const geminiPrompt = direction.negativePrompt
        ? `${styledPrompt}. Avoid: ${direction.negativePrompt}.`
        : styledPrompt;
      result = await generateText({
        model: google(model.id),
        prompt: geminiPrompt,
        providerOptions: {
          google: googleOptions,
        },
      });
    } else if (provider === "google" && method === "generateImage") {
      // Google Imagen (e.g. imagen-4.0-generate-001). It MUST go through the
      // Google provider's image() factory — passing a bare model-id string to
      // generateImage only resolves via the AI Gateway, so without a gateway key
      // it throws and the image 404s. Imagen takes its aspect ratio through
      // providerOptions.google.aspectRatio (a restricted set), NOT the top-level
      // aspectRatio/seed params (which it ignores), and exposes no seed /
      // negativePrompt in the current ai-sdk surface — negatives stay in-prompt.
      const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      const google = createGoogleGenerativeAI({ apiKey: googleKey! });
      const imagenPrompt = direction.negativePrompt
        ? `${styledPrompt}. Avoid: ${direction.negativePrompt}.`
        : styledPrompt;
      const imagenProviderOptions =
        direction.aspectRatio && IMAGEN_ASPECTS.has(direction.aspectRatio)
          ? { google: { aspectRatio: direction.aspectRatio } }
          : undefined;
      result = await generateImage({
        model: google.image(model.id),
        prompt: imagenPrompt,
        ...(imagenProviderOptions ? { providerOptions: imagenProviderOptions } : {}),
      });
    } else if (provider === "openai" && method === "generateImage") {
      const openaiKey = process.env.OPENAI_API_KEY;
      const openai = createOpenAI({ apiKey: openaiKey });
      // OpenAI image models support top-level aspectRatio + seed but have no
      // negativePrompt; only thread what's supported, each guarded optionally.
      result = await generateImage({
        model: openai.image(model.id),
        prompt: styledPrompt,
        ...(direction.aspectRatio
          ? { aspectRatio: direction.aspectRatio as `${number}:${number}` }
          : {}),
        ...(typeof direction.seed === "number" ? { seed: direction.seed } : {}),
      });
    } else if (method === "generateImage") {
      // Generic image path for any other provider reachable via the AI Gateway
      // (string model id). generateImage forwards top-level aspectRatio/seed when
      // the provider supports them; otherwise they fall back to defaults.
      result = await generateImage({
        model: model.id,
        prompt: styledPrompt,
        ...(direction.aspectRatio
          ? { aspectRatio: direction.aspectRatio as `${number}:${number}` }
          : {}),
        ...(typeof direction.seed === "number" ? { seed: direction.seed } : {}),
      });
    } else {
      return null;
    }

    const file = "image" in result ? result.image : result.files?.[0];
    if (!file) return null;
    return `data:${file.mediaType};base64,${file.base64}`;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

async function persistDataUrl(dataUrl: string) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  const saved = await saveImageBase64(parsed);
  return saved?.url ?? null;
}

/**
 * Per-board generation context. `sessionSeed` is derived once from the preset's
 * composition seed so every deferred image in one board shares a coherent seed
 * family, while `next()` hands out a monotonically increasing per-image index
 * that rotates the spec motif and offsets the seed for intra-board variety.
 */
interface ResolveContext {
  aestheticId?: string;
  customImageStylePrompt?: string | null;
  imageModel?: string;
  sessionSeed: number;
  next: () => number;
}

async function resolveNode(input: unknown, ctx: ResolveContext): Promise<unknown> {
  if (!input || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return Promise.all(input.map((item) => resolveNode(item, ctx)));
  }

  const node = input as Record<string, unknown>;

  // Legacy image resolution
  if (node.type === "image") {
    const prompt = typeof node.prompt === "string" ? node.prompt : "";
    let resolvedSrc = typeof node.src === "string" ? node.src : null;
    if (resolvedSrc?.startsWith("data:")) {
      resolvedSrc = await persistDataUrl(resolvedSrc);
    }
    if (!resolvedSrc && prompt) {
      const id = crypto.randomUUID();
      await savePendingImageMetadata(id, {
        prompt,
        aestheticId: ctx.aestheticId,
        customImageStylePrompt: ctx.customImageStylePrompt,
        imageModel: ctx.imageModel,
        sessionSeed: ctx.sessionSeed,
        imageIndex: ctx.next(),
      });
      resolvedSrc = `/api/images/${id}.jpg`;
    }
    if (!resolvedSrc) {
      resolvedSrc = fallbackSvgDataUrl("IMAGE UNAVAILABLE", ctx.aestheticId);
    }

    return {
      ...node,
      type: "image",
      src: resolvedSrc,
      alt: typeof node.alt === "string" ? node.alt : prompt || "Generated image",
    };
  }

  // Catalog Image resolution (if the url is a prompt instead of a URL)
  if (node.component === "Image" && typeof node.url === "string") {
    const url = node.url.trim();
    const isUrl =
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/api/images/") ||
      url.startsWith("data:");
    if (!isUrl && url.length > 0) {
      const id = crypto.randomUUID();
      await savePendingImageMetadata(id, {
        prompt: url,
        aestheticId: ctx.aestheticId,
        customImageStylePrompt: ctx.customImageStylePrompt,
        imageModel: ctx.imageModel,
        sessionSeed: ctx.sessionSeed,
        imageIndex: ctx.next(),
      });
      return {
        ...node,
        url: `/api/images/${id}.jpg`,
      };
    }
  }

  // Recurse into all properties of the object
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    result[key] = await resolveNode(value, ctx);
  }
  return result;
}

export async function resolveA2UIImagePrompts(
  input: unknown,
  aestheticId?: string,
  customImageStylePrompt?: string | null,
  imageModel?: string
): Promise<unknown> {
  // One board = one session seed (the preset's composition seed). Each image
  // node consumes the next index so motifs rotate and seeds offset coherently.
  let imageCounter = 0;
  const ctx: ResolveContext = {
    aestheticId,
    customImageStylePrompt,
    imageModel,
    sessionSeed: getCompositionSeed(aestheticId as AestheticId | undefined),
    next: () => imageCounter++,
  };
  return resolveNode(input, ctx);
}
