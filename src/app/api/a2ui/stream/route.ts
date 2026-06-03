import "server-only";

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getProviderWithOverrides } from "@/lib/ai/factory";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { tools } from "@/lib/ai/tools";
import type { CreateSurfaceMessage, UpdateComponentsMessage } from "@/lib/a2ui/schema/messages";
import { flattenLegacyToCatalog } from "@/lib/a2ui/adapter/legacyToCatalog";
import { apiSecurityCheck } from "@/lib/api/security";

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
 * Create mock catalog components for testing without an AI provider.
 *
 * Returns a flat adjacency list with a `root` component so the surface
 * renderer always has a valid entry point.
 */
function createMockComponents(prompt: string): Record<string, unknown>[] {
  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes("button")) {
    const labelId = "mock-label";
    return [
      {
        id: "root",
        component: "Button",
        child: labelId,
        variant: "primary",
        action: { event: { name: "submit" } },
      },
      { id: labelId, component: "Text", text: "Submit" },
    ];
  }

  if (normalizedPrompt.includes("card")) {
    const textId = "mock-card-text";
    return [
      { id: "root", component: "Card", child: textId },
      { id: textId, component: "Text", text: `Generated from: ${prompt}` },
    ];
  }

  // Default to a single Text component.
  return [{ id: "root", component: "Text", text: `Generated from: ${prompt}` }];
}

/**
 * Normalize a component emitted by the `generate_ui` tool into a flat catalog
 * component list for the surface renderer.
 *
 * - Already-catalog-shaped components (carry a `component` discriminator) are
 *   passed through, with an id ensured.
 * - Legacy-shaped components (carry a lowercase `type`) are flattened into the
 *   catalog adjacency list via the adapter. The first such tree owns the
 *   `root` id.
 */
function toCatalogComponents(
  component: Record<string, unknown>,
  isFirstTree: boolean,
  callIndex: number
): Record<string, unknown>[] {
  if (typeof component.component === "string") {
    // Clone so we never mutate the upstream SDK tool-call object in place.
    const normalized = { ...component };
    if (!normalized.id) {
      normalized.id = generateComponentId();
    }
    return [normalized];
  }

  const { components } = flattenLegacyToCatalog(component, {
    idPrefix: `gen-${callIndex}`,
    rootId: isFirstTree ? "root" : `gen-${callIndex}-root`,
  });
  return components;
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
  const securityError = apiSecurityCheck(req);
  if (securityError) return securityError;

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
    const mockComponents = createMockComponents(prompt);

    const stream = new ReadableStream({
      start(controller) {
        // 1. Send createSurface
        const createSurfaceMsg: CreateSurfaceMessage = {
          type: "createSurface",
          surfaceId,
          catalogId: "standard",
        };
        controller.enqueue(encoder.encode(formatSSE(createSurfaceMsg)));

        // 2. Send updateComponents with the mock catalog components
        const updateMsg: UpdateComponentsMessage = {
          type: "updateComponents",
          surfaceId,
          components: mockComponents as UpdateComponentsMessage["components"],
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

        // 2. Stream AI response (provider is non-null after mock check above)
        const result = streamText({
          model: auth.provider!(auth.model),
          messages: [{ role: "user", content: prompt }],
          system: buildSystemPrompt(),
          tools,
        });

        // Process the stream — emit updateComponents incrementally.
        // The first tool call owns the surface "root"; subsequent calls are
        // namespaced so their ids never collide.
        let callIndex = 0;
        for await (const chunk of result.fullStream) {
          if (chunk.type === "tool-call" && chunk.toolName === "generate_ui") {
            // fullStream uses 'input' instead of 'args' for tool calls
            const args = "args" in chunk ? chunk.args : (chunk as { input?: unknown }).input;
            const component = (args as { component?: unknown } | undefined)?.component as
              | Record<string, unknown>
              | undefined;
            if (component) {
              // Flatten/normalize into catalog components (with a "root").
              const components = toCatalogComponents(component, callIndex === 0, callIndex);
              callIndex++;

              // 3. Send updateComponents immediately for each tool call
              const updateMsg: UpdateComponentsMessage = {
                type: "updateComponents",
                surfaceId,
                components: components as UpdateComponentsMessage["components"],
              };
              controller.enqueue(encoder.encode(formatSSE(updateMsg)));
            }
          }
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
