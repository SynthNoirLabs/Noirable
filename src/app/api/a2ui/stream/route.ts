import "server-only";

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getProviderWithOverrides } from "@/lib/ai/factory";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { tools, coerceComponentInput } from "@/lib/ai/tools";
import { resolveA2UIImagePrompts } from "@/lib/ai/images";
import { generateNarration } from "@/lib/ai/narration";
import { a2uiInputSchema, normalizeA2UI } from "@/lib/protocol/schema";
import type { CreateSurfaceMessage, UpdateComponentsMessage } from "@/lib/a2ui/schema/messages";
import { flattenLegacyToCatalog } from "@/lib/a2ui/adapter/legacyToCatalog";
import { enrichA2UI } from "@/lib/a2ui/enrich";
import { apiSecurityCheck } from "@/lib/api/security";
import type { AestheticId } from "@/lib/aesthetic/types";

/**
 * Request body for A2UI stream endpoint
 */
interface A2UIStreamRequest {
  prompt: string;
  aestheticId?: AestheticId;
  customSystemPrompt?: string;
  customImageStylePrompt?: string;
  imageModel?: string;
  /**
   * The currently-rendered surface's component list, threaded back in so the
   * model can AMEND the live UI (the buildSystemPrompt "Current Evidence" +
   * Update Rules path) instead of regenerating from scratch. Optional: absent
   * on a fresh "new case", present when iterating on an existing surface.
   */
  baselineComponents?: unknown;
  /**
   * Optional composition variant seed. When present, buildSystemPrompt appends
   * a terse directive nudging the model toward an alternative arrangement (the
   * Take 1/2/3 picker fires the same prompt with offset seeds). Absent on a
   * normal single send, so behavior is unchanged.
   */
  compositionSeed?: number;
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

  if (normalizedPrompt.includes("kanban")) {
    const johnTitle = prompt.includes("John Doe (Primary)") ? "John Doe (Primary)" : "John Doe";
    const janeTitle = prompt.includes("Jane Smith (Alibi)") ? "Jane Smith (Alibi)" : "Jane Smith";

    return [
      {
        id: "root",
        component: "KanbanBoard",
        title: "Suspect Case Board",
        columns: [
          {
            id: "todo",
            title: "To Do",
            cards: [
              {
                id: "card-1",
                title: johnTitle,
                description:
                  "Primary suspect in murder case. Extremely long description text to test line wrapping properties in Kanban Board cards without causing horizontal overflow or breaking layout boundaries.",
                assignee: "Detective Miller",
                tags: ["suspect", "high-priority"],
              },
            ],
          },
          {
            id: "progress",
            title: "In Progress",
            cards: [
              {
                id: "card-2",
                title: janeTitle,
                description: "Alibi witness verification.",
                assignee: "Officer Davis",
                tags: ["alibi"],
              },
            ],
          },
          {
            id: "done",
            title: "Done",
            cards: [],
          },
        ],
      },
    ];
  }

  if (normalizedPrompt.includes("dashboard")) {
    return [
      {
        id: "root",
        component: "DataDashboard",
        title: "System Logs Analytics",
        widgets: [
          {
            id: "w1",
            title: "Active Alerts",
            type: "metric",
            value: 42,
            unit: "alerts",
            trend: {
              value: 12,
              direction: "up",
            },
          },
          {
            id: "w2",
            title: "Analysis Progress",
            type: "progress",
            progress: 85,
          },
          {
            id: "w3",
            title: "Activity Log",
            type: "chart",
            chartType: "bar",
            data: [
              { label: "Mon", value: 5 },
              { label: "Tue", value: 12 },
              { label: "Wed", value: 8 },
              { label: "Thu", value: 15 },
              { label: "Fri", value: 20 },
            ],
          },
        ],
      },
    ];
  }

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
  const { prompt, aestheticId, customSystemPrompt, customImageStylePrompt, imageModel } = body;
  // Only thread a numeric variant seed; anything else leaves the prompt on the
  // byte-identical no-variant path.
  const compositionSeed =
    typeof body.compositionSeed === "number" && Number.isFinite(body.compositionSeed)
      ? body.compositionSeed
      : undefined;
  // Only treat a non-empty component list as a baseline; an empty surface is a
  // fresh start and must not inject an empty "Current Evidence" block.
  const baselineComponents =
    Array.isArray(body.baselineComponents) && body.baselineComponents.length > 0
      ? body.baselineComponents
      : undefined;
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

        // Kick off the detective's narration in parallel with the UI generation.
        // A dedicated tool-less call is far more reliable than coaxing a second
        // text step out of the model (which usually just stops).
        const narrationPromise = generateNarration(auth, prompt, aestheticId, customSystemPrompt);

        // 2. Stream AI response (provider is non-null after mock check above).
        // Only expose generate_ui (the v0.9 surface is about producing UI;
        // set_aesthetic is irrelevant) and force it by name — without a named
        // choice, Gemini often picks the wrong tool and the surface ends up empty.
        const result = streamText({
          model: auth.provider!(auth.model),
          messages: [{ role: "user", content: prompt }],
          system: buildSystemPrompt(
            baselineComponents,
            aestheticId,
            customSystemPrompt,
            compositionSeed
          ),
          tools: {
            generate_ui: {
              ...tools.generate_ui,
              execute: undefined,
            },
          },
          toolChoice: { type: "tool", toolName: "generate_ui" },
        });

        // Process the stream — emit updateComponents incrementally.
        // The first tool call owns the surface "root"; subsequent calls are
        // namespaced so their ids never collide.
        let callIndex = 0;

        // Emit a generate_ui tool call's component as an updateComponents message.
        const emitComponent = async (rawComponent: unknown): Promise<void> => {
          let component = coerceComponentInput(rawComponent) as Record<string, unknown> | undefined;
          if (!component || typeof component !== "object") return;
          // Resolve any image `prompt`s into real generated image URLs (the v0.9
          // route extracts the raw tool args and bypasses the tool's execute(),
          // so we run the resolver here). Normalize first so the resolver sees a
          // valid tree; fall back to the raw component if validation fails.
          const validated = a2uiInputSchema.safeParse(normalizeA2UI(component));
          if (validated.success) {
            // Deterministic tidy-ups (auto-grid card stacks, promote a leading
            // title) before image resolution + catalog flattening.
            const enriched = enrichA2UI(validated.data);
            component = (await resolveA2UIImagePrompts(
              enriched,
              aestheticId,
              customImageStylePrompt,
              imageModel
            )) as Record<string, unknown>;
          } else {
            component = (await resolveA2UIImagePrompts(
              component,
              aestheticId,
              customImageStylePrompt,
              imageModel
            )) as Record<string, unknown>;
          }
          const components = toCatalogComponents(component, callIndex === 0, callIndex);
          callIndex++;
          const updateMsg: UpdateComponentsMessage = {
            type: "updateComponents",
            surfaceId,
            components: components as UpdateComponentsMessage["components"],
          };
          controller.enqueue(encoder.encode(formatSSE(updateMsg)));
        };

        const componentOf = (chunk: unknown): unknown => {
          const c = chunk as { args?: unknown; input?: unknown };
          const args = "args" in (c as object) ? c.args : c.input;
          return (args as { component?: unknown } | undefined)?.component;
        };

        // Stream incrementally — emit on each valid generate_ui tool call.
        for await (const chunk of result.fullStream) {
          if (
            chunk.type === "tool-call" &&
            chunk.toolName === "generate_ui" &&
            !(chunk as { invalid?: boolean }).invalid
          ) {
            await emitComponent(componentOf(chunk));
          }
        }

        // Fallback: some models (notably Gemini) don't surface a usable
        // `tool-call` chunk in fullStream even with toolChoice "required". If we
        // emitted nothing, recover the tool call from the resolved result.
        if (callIndex === 0) {
          try {
            const finalToolCalls = await result.toolCalls;
            for (const tc of finalToolCalls) {
              if (tc.toolName === "generate_ui") {
                await emitComponent(componentOf(tc));
              }
            }
          } catch {
            // ignore — nothing to recover
          }
        }

        // 4. Send the detective's narration (from the parallel call) for the
        // chat log, then [DONE].
        const narration = (await narrationPromise)?.trim();
        if (narration) {
          controller.enqueue(encoder.encode(formatSSE({ type: "narration", text: narration })));
        }
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
