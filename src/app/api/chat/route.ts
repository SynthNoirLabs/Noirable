import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { getProvider } from "@/lib/ai/factory";
import { tools } from "@/lib/ai/tools";

type ChatRequestBody = {
  messages: UIMessage[];
  evidence?: unknown;
};

type UIMessagePartType = UIMessage["parts"][number];

type SanitizedMessage = UIMessage & {
  content?: string;
  parts?: UIMessagePartType[];
  providerMetadata?: unknown;
  callProviderMetadata?: unknown;
};

export async function POST(req: Request) {
  try {
    const json = (await req.json()) as ChatRequestBody;
    if (process.env.NODE_ENV !== "production") {
      console.log("DEBUG: Full Request Body:", JSON.stringify(json, null, 2));
    }

    const { messages, evidence } = json;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages missing or invalid", { status: 400 });
    }

    let auth;
    try {
      auth = getProvider();
    } catch (e) {
      console.error("Provider Factory Error:", e);
      return new Response("Configuration Error: No API Key found.", {
        status: 500,
      });
    }

    if (auth.type === "mock") {
      return new Response(
        `0:"The streets are quiet... too quiet. (Detective Mode: No API Key detected. Using local simulation.)"
`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
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
      model: auth.provider(auth.model),
      messages: convertedMessages,
      system: buildSystemPrompt(evidence),
      tools,
    });

    // toUIMessageStreamResponse is the confirmed method in ai@6.0.41 d.ts
    // This replaces toDataStreamResponse which was removed in this version.
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
