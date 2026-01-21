import { streamText, convertToModelMessages } from "ai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { getProvider } from "@/lib/ai/factory";
import { tools } from "@/lib/ai/tools";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    console.log("DEBUG: Full Request Body:", JSON.stringify(json, null, 2));

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
    const normalizedMessages = messages.map((m) => {
      const sanitized = { ...m };

      if (sanitized.providerMetadata) {
        delete sanitized.providerMetadata;
      }

      if (!sanitized.parts && typeof sanitized.content === "string") {
        sanitized.parts = [{ type: "text", text: sanitized.content }];
        return sanitized;
      }

      if (Array.isArray(sanitized.parts)) {
        sanitized.parts = sanitized.parts.map((part) => {
          if (typeof part !== "object" || part === null) return part;
          const { providerMetadata, callProviderMetadata, ...rest } = part as {
            providerMetadata?: unknown;
            callProviderMetadata?: unknown;
            [key: string]: unknown;
          };
          return rest;
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
