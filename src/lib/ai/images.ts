import "server-only";
import { generateText } from "ai";
import type { A2UIComponent, A2UIInput } from "@/lib/protocol/schema";

const DEFAULT_IMAGE_MODEL = "google/gemini-2.5-flash-image";

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
    const result = await generateText({
      model: process.env.AI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL,
      prompt,
    });

    const file = result.files?.find((item) =>
      item.mediaType?.startsWith("image/"),
    );

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
