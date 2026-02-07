import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import type { UIMessage } from "ai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { getProviderWithOverrides, type ModelOverride } from "@/lib/ai/factory";
import { tools } from "@/lib/ai/tools";
import { a2uiInputSchema, type A2UIInput } from "@/lib/protocol/schema";
import type { AestheticId } from "@/lib/aesthetic/types";
import { apiSecurityCheck } from "@/lib/api/security";

type ChatRequestBody = {
  messages: UIMessage[];
  evidence?: unknown;
  modelConfig?: ModelOverride;
  /** Active aesthetic profile ID for persona selection */
  aestheticId?: AestheticId;
};

type UIMessagePartType = UIMessage["parts"][number];

type SanitizedMessage = UIMessage & {
  content?: string;
  parts?: UIMessagePartType[];
  providerMetadata?: unknown;
  callProviderMetadata?: unknown;
};

function extractMessageText(message: UIMessage & { content?: string }): string {
  if (typeof message.content === "string" && message.content.trim().length > 0) {
    return message.content;
  }

  if (Array.isArray(message.parts)) {
    return message.parts.reduce((acc, part) => {
      if (part.type === "text") {
        return acc + part.text;
      }
      return acc;
    }, "");
  }

  return "";
}

function extractMockCardContent(prompt: string) {
  const titleMatch = prompt.match(/title\s*["“”']([^"“”']+)["“”']/i);
  const descriptionMatch = prompt.match(/description\s*["“”']([^"“”']+)["“”']/i);
  const missingMatch = prompt.match(/missing:\s*([^\n]+)$/i);

  const title = titleMatch?.[1]?.trim() || missingMatch?.[1]?.trim() || "Missing: Unknown Subject";
  const description =
    descriptionMatch?.[1]?.trim() ||
    "Last seen at the edge of town. Provide more detail to sharpen the dossier.";

  return { title, description };
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createMockComponent(prompt: string): A2UIInput {
  const normalized = prompt.trim();
  const lower = normalized.toLowerCase();
  const { title, description } = extractMockCardContent(normalized);
  const status = title.toLowerCase().includes("missing") ? "missing" : "active";

  if (lower.includes("table")) {
    return {
      type: "table",
      columns: ["Lead", "Status"],
      rows: [
        ["Dock worker", "Interviewed"],
        ["Warehouse log", "Missing pages"],
        ["CCTV sweep", "Pending"],
      ],
    };
  }

  if (lower.includes("tabs")) {
    return {
      type: "tabs",
      tabs: [
        { label: "Summary", content: { type: "paragraph", text: "Case notes pending." } },
        {
          label: "Leads",
          content: { type: "list", items: ["Check harbors", "Follow the signal"] },
        },
      ],
      activeIndex: 0,
    };
  }

  if (lower.includes("timeline") || lower.includes("chronology")) {
    return {
      type: "list",
      ordered: true,
      items: ["22:15 - Alarm triggered", "22:42 - Witness spotted", "23:08 - Trail went cold"],
    };
  }

  if (lower.includes("form") || lower.includes("input")) {
    return {
      type: "container",
      style: { padding: "md", gap: "sm" },
      children: [
        { type: "heading", text: "Intake Form", level: 3 },
        {
          type: "row",
          style: { gap: "sm" },
          children: [
            { type: "input", label: "Alias", placeholder: "Jane Doe" },
            { type: "input", label: "Last Seen", placeholder: "Pier 9" },
          ],
        },
        { type: "button", label: "Submit Lead", variant: "primary" },
      ],
    };
  }

  if (lower.includes("image") || lower.includes("photo")) {
    return {
      type: "image",
      prompt: normalized.length > 0 ? normalized : "Noir alley evidence shot",
      alt: "Evidence photo",
    };
  }

  if (
    lower.includes("card") ||
    lower.includes("dossier") ||
    lower.includes("profile") ||
    lower.includes("missing")
  ) {
    return {
      type: "card",
      title,
      description,
      status,
    };
  }

  const variants: Array<() => A2UIInput> = [
    () => ({
      type: "card",
      title,
      description,
      status,
    }),
    () => ({
      type: "stat",
      label: "Active Leads",
      value: "7",
      change: "+2",
    }),
    () => ({
      type: "list",
      items: ["Pier 9", "Blue Lantern Club", "Warehouse 12"],
    }),
  ];

  const pick = variants[hashString(normalized) % variants.length];
  return pick();
}

function buildMockNarration(component: A2UIInput) {
  switch (component.type) {
    case "card":
      return `Filed a fresh dossier: ${component.title}.`;
    case "table":
      return "Compiled a cross-reference ledger.";
    case "tabs":
      return "Tabbed the evidence into separate leads.";
    case "list":
      return "Pinned a new lead list to the board.";
    case "stat":
      return "Updated the case metrics.";
    case "image":
      return "Developed a fresh evidence photo.";
    default:
      return "Cataloged new evidence.";
  }
}

function createMockUIResponse(messages: UIMessage[]): Response {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const prompt = lastUserMessage
    ? extractMessageText(lastUserMessage as UIMessage & { content?: string })
    : "";
  const component = a2uiInputSchema.parse(createMockComponent(prompt));
  const narration = buildMockNarration(component);

  const toolCallId = `mock-${Date.now()}`;
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });
      writer.write({
        type: "tool-input-available",
        toolCallId,
        toolName: "generate_ui",
        input: { component },
      });
      writer.write({
        type: "tool-output-available",
        toolCallId,
        output: component,
      });
      writer.write({ type: "text-start", id: "mock-text" });
      writer.write({ type: "text-delta", id: "mock-text", delta: narration });
      writer.write({ type: "text-end", id: "mock-text" });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request) {
  const securityError = apiSecurityCheck(req);
  if (securityError) return securityError;

  try {
    const json = (await req.json()) as ChatRequestBody;
    if (process.env.NODE_ENV !== "production") {
      console.log("DEBUG: Full Request Body:", JSON.stringify(json, null, 2));
    }

    const { messages, evidence, modelConfig, aestheticId } = json;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages missing or invalid", { status: 400 });
    }

    let auth;
    try {
      auth = getProviderWithOverrides(modelConfig);
    } catch (e) {
      console.error("Provider Factory Error:", e);
      return new Response("Configuration Error: No API Key found.", {
        status: 500,
      });
    }

    if (auth.type === "mock" || process.env.E2E === "1") {
      return createMockUIResponse(messages);
    }

    // Normalize messages to ensure they have 'parts' if coming from older client
    const normalizedMessages = messages.map((m): UIMessage => {
      const sanitized: SanitizedMessage = { ...m };

      if (sanitized.providerMetadata) {
        delete sanitized.providerMetadata;
      }

      if (!sanitized.parts && typeof sanitized.content === "string") {
        sanitized.parts = [{ type: "text", text: sanitized.content }];
        return sanitized;
      }

      if (Array.isArray(sanitized.parts)) {
        const parts = sanitized.parts as UIMessagePartType[];
        sanitized.parts = parts.map((part) => {
          const cleaned = { ...(part as Record<string, unknown>) };
          delete cleaned.providerMetadata;
          delete cleaned.callProviderMetadata;
          return cleaned as UIMessagePartType;
        });
      }

      return sanitized;
    });

    // Await message conversion (Confirmed async in ai@6.0.41)
    const convertedMessages = await convertToModelMessages(normalizedMessages);

    const result = streamText({
      model: auth.provider!(auth.model),
      messages: convertedMessages,
      system: buildSystemPrompt(evidence, aestheticId),
      tools,
    });

    // toUIMessageStreamResponse is the confirmed method in ai@6.0.41 d.ts
    // This replaces toDataStreamResponse which was removed in this version.
    return result.toUIMessageStreamResponse({ originalMessages: normalizedMessages });
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
