import "server-only";

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getProviderWithOverrides } from "@/lib/ai/factory";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { tools } from "@/lib/ai/tools";
import type { CreateSurfaceMessage, UpdateComponentsMessage } from "@/lib/a2ui/schema/messages";

/**
 * Request body for A2UI stream endpoint
 */
interface A2UIStreamRequest {
  prompt: string;
}

/**
 * Standard SSE response headers
 */
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

/**
 * Generate unique surface ID
 */
function generateSurfaceId(): string {
  return `surface-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate unique component ID
 */
function generateComponentId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a mock component for testing without AI provider
 */
function createMockComponent(prompt: string): Record<string, unknown> {
  const id = `text-${Date.now()}`;
  const normalizedPrompt = prompt.toLowerCase();

  // Generate different mock components based on prompt keywords
  if (normalizedPrompt.includes("button")) {
    return {
      id: `button-${Date.now()}`,
      component: "Button",
      child: id,
      variant: "primary",
      action: { event: { name: "submit" } },
    };
  }

  if (normalizedPrompt.includes("card")) {
    return {
      id: `card-${Date.now()}`,
      component: "Card",
      child: id,
    };
  }

  // Default to Text component
  return {
    id,
    component: "Text",
    text: `Generated from: ${prompt}`,
  };
}

/**
 * Format SSE data line
 */
function formatSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * POST /api/a2ui/stream
 *
 * SSE endpoint that streams A2UI v0.9 JSONL messages.
 * Accepts { prompt: string } and returns:
 * - createSurface message (first)
 * - updateComponents message(s)
 * - [DONE] sentinel
 */
export async function POST(req: NextRequest): Promise<Response> {
  // Parse request body
  let body: A2UIStreamRequest;
  try {
    body = (await req.json()) as A2UIStreamRequest;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // Validate prompt
  const { prompt } = body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return new Response("Missing or invalid prompt", { status: 400 });
  }

  // Get AI provider
  let auth;
  try {
    auth = getProviderWithOverrides();
  } catch (e) {
    console.error("Provider Factory Error:", e);
    return new Response("Configuration Error: No API Key found.", { status: 500 });
  }

  const surfaceId = generateSurfaceId();
  const encoder = new TextEncoder();

  // Handle mock provider or E2E mode
  if (auth.type === "mock" || process.env.E2E === "1") {
    const mockComponent = createMockComponent(prompt);

    const stream = new ReadableStream({
      start(controller) {
        // 1. Send createSurface
        const createSurfaceMsg: CreateSurfaceMessage = {
          type: "createSurface",
          surfaceId,
          catalogId: "standard",
        };
        controller.enqueue(encoder.encode(formatSSE(createSurfaceMsg)));

        // 2. Send updateComponents with mock component
        const updateMsg: UpdateComponentsMessage = {
          type: "updateComponents",
          surfaceId,
          components: [mockComponent as UpdateComponentsMessage["components"][number]],
        };
        controller.enqueue(encoder.encode(formatSSE(updateMsg)));

        // 3. Send [DONE] sentinel
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));

        controller.close();
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  }

  // Create stream for real AI provider
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Send createSurface first
        const createSurfaceMsg: CreateSurfaceMessage = {
          type: "createSurface",
          surfaceId,
          catalogId: "standard",
        };
        controller.enqueue(encoder.encode(formatSSE(createSurfaceMsg)));

        // 2. Stream AI response
        const result = streamText({
          model: auth.provider(auth.model),
          messages: [{ role: "user", content: prompt }],
          system: buildSystemPrompt(),
          tools,
        });

        const components: Record<string, unknown>[] = [];

        // Process the stream
        for await (const chunk of result.fullStream) {
          if (chunk.type === "tool-call" && chunk.toolName === "generate_ui") {
            // fullStream uses 'input' instead of 'args' for tool calls
            const args = "args" in chunk ? chunk.args : (chunk as { input?: unknown }).input;
            const component = (args as { component?: unknown } | undefined)?.component as
              | Record<string, unknown>
              | undefined;
            if (component) {
              // Ensure component has an id
              if (!component.id) {
                component.id = generateComponentId();
              }
              components.push(component);
            }
          }
        }

        // 3. Send updateComponents with collected components
        if (components.length > 0) {
          const updateMsg: UpdateComponentsMessage = {
            type: "updateComponents",
            surfaceId,
            components: components as UpdateComponentsMessage["components"],
          };
          controller.enqueue(encoder.encode(formatSSE(updateMsg)));
        }

        // 4. Send [DONE] sentinel
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));

        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
