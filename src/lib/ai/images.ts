import { generateImage, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { A2UIComponent, A2UIInput } from "@/lib/protocol/schema";
import { saveImageBase64 } from "@/lib/ai/imageStore";
import { getImageGenerationModels, getModelInfo, type ModelInfo } from "@/lib/ai/model-registry";

const NOIR_STYLE_PROMPT =
  "noir cinematic, rain-slicked streets, moody low-key lighting, high contrast, film grain, 35mm photography, neon glow, deep shadows, light fog, desaturated palette";

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
      googleModels.find((m) => m.id === "gemini-3-pro-image-preview") ||
      googleModels.find((m) => m.id === "gemini-2.5-flash-image") ||
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

export function buildNoirImagePrompt(prompt: string) {
  if (!prompt.trim()) return NOIR_STYLE_PROMPT;
  return `${prompt}. Style: ${NOIR_STYLE_PROMPT}.`;
}

function fallbackSvgDataUrl(message: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="320" viewBox="0 0 512 320">
  <rect width="512" height="320" fill="#0f0f0f"/>
  <rect x="24" y="24" width="464" height="272" fill="#1a1a1a" stroke="#2a2a2a" stroke-width="2"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e0e0e0" font-family="monospace" font-size="14">
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

export async function resolveA2UIImagePrompts(input: A2UIInput): Promise<A2UIComponent> {
  if (!input || typeof input !== "object") {
    return input as A2UIComponent;
  }

  const node = input as A2UIInput;

  switch (node.type) {
    case "container":
    case "row":
    case "column":
    case "grid": {
      const children = await Promise.all(
        node.children.map((child) => resolveA2UIImagePrompts(child))
      );
      return { ...node, children } as A2UIComponent;
    }
    case "tabs": {
      const tabs = await Promise.all(
        node.tabs.map(async (tab) => ({
          ...tab,
          content: await resolveA2UIImagePrompts(tab.content),
        }))
      );
      return { ...node, tabs } as A2UIComponent;
    }
    case "image": {
      const { prompt, alt, src, ...rest } = node;
      let resolvedSrc: string | null | undefined = src;
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
        ...rest,
        type: "image",
        src: resolvedSrc,
        alt: alt ?? prompt ?? "Generated image",
      } as A2UIComponent;
    }
    default:
      return node as A2UIComponent;
  }
}
