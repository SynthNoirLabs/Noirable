import { generateImage, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { A2UIComponent, A2UIInput } from "@/lib/protocol/schema";
import { getCustomImageStylePrompt } from "@/lib/ai/image-style";
import { saveImageBase64 } from "@/lib/ai/imageStore";
import { getImageGenerationModels, getModelInfo, type ModelInfo } from "@/lib/ai/model-registry";

const NOIR_STYLE_PROMPT =
  "shot as a 1940s detective's evidence photograph, noir cinematic, rain-slicked streets, moody low-key lighting, hard chiaroscuro contrast, heavy film grain, 35mm black-and-white photography, deep shadows, light fog, desaturated palette, no bright saturated color, no text or watermark";

function selectImageModel(): {
  model: ModelInfo;
  provider: "google" | "openai";
} | null {
  const explicitModel = process.env.AI_IMAGE_MODEL;
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

export function buildNoirImagePrompt(prompt: string): string {
  const customStyle = getCustomImageStylePrompt();
  const stylePrompt = customStyle || NOIR_STYLE_PROMPT;

  if (!prompt.trim()) return stylePrompt;
  return `${prompt}. Style: ${stylePrompt}.`;
}

function fallbackSvgDataUrl(message: string) {
  // An in-world "darkroom" placeholder rather than a plain gray box: an
  // evidence photo still developing in the tray. Warm amber compensates for the
  // sepia/grayscale filters the Image renderer applies on top.
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
    ${message}
  </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function generateImageDataUrl(prompt: string) {
  try {
    const selection = selectImageModel();
    if (!selection) return null;

    const { model, provider } = selection;
    const styledPrompt = buildNoirImagePrompt(prompt);
    const method = model.capabilities.imageGenMethod;

    let result;

    if (provider === "google" && method === "generateText") {
      const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      const google = createGoogleGenerativeAI({ apiKey: googleKey! });
      result = await generateText({
        model: google(model.id),
        prompt: styledPrompt,
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
          },
        },
      });
    } else if (provider === "openai" && method === "generateImage") {
      const openaiKey = process.env.OPENAI_API_KEY;
      const openai = createOpenAI({ apiKey: openaiKey });
      result = await generateImage({
        model: openai.image(model.id),
        prompt: styledPrompt,
      });
    } else if (method === "generateImage") {
      result = await generateImage({
        model: model.id,
        prompt: styledPrompt,
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

export async function resolveA2UIImagePrompts(input: unknown): Promise<unknown> {
  if (!input || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return Promise.all(input.map((item) => resolveA2UIImagePrompts(item)));
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
      const generated = await generateImageDataUrl(prompt);
      resolvedSrc = generated ? await persistDataUrl(generated) : null;
    }
    if (!resolvedSrc) {
      resolvedSrc = fallbackSvgDataUrl("IMAGE UNAVAILABLE");
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
      const generated = await generateImageDataUrl(url);
      const resolvedSrc = generated ? await persistDataUrl(generated) : null;
      return {
        ...node,
        url: resolvedSrc || fallbackSvgDataUrl("IMAGE UNAVAILABLE"),
      };
    }
  }

  // Recurse into all properties of the object
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    result[key] = await resolveA2UIImagePrompts(value);
  }
  return result;
}
