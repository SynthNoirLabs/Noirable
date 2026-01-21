import { generateImage, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { A2UIComponent, A2UIInput } from "@/lib/protocol/schema";

const DEFAULT_GATEWAY_IMAGE_MODEL = "google/gemini-3-pro-image";
const DEFAULT_GOOGLE_IMAGE_MODEL = "gemini-3-pro-image-preview";

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
    const gatewayKey = process.env.AI_GATEWAY_API_KEY;
    const googleKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    let result;

    if (googleKey) {
      const google = createGoogleGenerativeAI({ apiKey: googleKey });
      result = await generateText({
        model: google(process.env.AI_IMAGE_MODEL ?? DEFAULT_GOOGLE_IMAGE_MODEL),
        prompt,
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
          },
        },
      });
    } else if (gatewayKey) {
      result = await generateImage({
        model: process.env.AI_IMAGE_MODEL ?? DEFAULT_GATEWAY_IMAGE_MODEL,
        prompt,
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

export async function resolveA2UIImagePrompts(
  input: A2UIInput,
): Promise<A2UIComponent> {
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
        node.children.map((child) => resolveA2UIImagePrompts(child)),
      );
      return { ...node, children } as A2UIComponent;
    }
    case "tabs": {
      const tabs = await Promise.all(
        node.tabs.map(async (tab) => ({
          ...tab,
          content: await resolveA2UIImagePrompts(tab.content),
        })),
      );
      return { ...node, tabs } as A2UIComponent;
    }
    case "image": {
      const { prompt, alt, src, ...rest } = node;
      let resolvedSrc = src;
      if (!resolvedSrc && prompt) {
        resolvedSrc = await generateImageDataUrl(prompt);
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
