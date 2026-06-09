import { tool } from "ai";
import { z } from "zod";
import { a2uiInputSchema, a2uiSchema } from "@/lib/protocol/schema";
import { resolveA2UIImagePrompts } from "@/lib/ai/images";
import { isValidAestheticId } from "@/lib/aesthetic/registry";
import type { AestheticId } from "@/lib/aesthetic/types";

/**
 * Zod schema for aesthetic ID validation. Mirrors the built-in keys of
 * AESTHETIC_REGISTRY so the AI can switch to every shipped aesthetic, not just
 * noir/minimal.
 */
const aestheticIdSchema = z
  .enum(["noir", "minimal", "cyber-fixer", "nostromo-console", "gothic-manor"])
  .describe(
    "The aesthetic profile to switch to. 'noir' is a dark detective theme, 'minimal' is a clean light theme, 'cyber-fixer' is a neon cyberpunk theme, 'nostromo-console' is a retro green-phosphor terminal, 'gothic-manor' is a dark Victorian gothic theme."
  );

/**
 * Result returned by the set_aesthetic tool.
 */
export interface SetAestheticResult {
  success: boolean;
  aestheticId: AestheticId;
  appliedAt: number;
  message: string;
}

/**
 * Coerce the model-supplied `component` argument into a plain object.
 *
 * The tool accepts the A2UI tree as a JSON STRING (see `generate_ui` below):
 * a single string field is far more reliable for models — especially Gemini —
 * than a deep recursive object schema, which they tend to mangle (emitting a
 * number, a fragment like `"{type:"`, or an empty `{}`). This also tolerates a
 * already-object input (some models/SDKs hand back a parsed object) and the
 * loose unquoted-key JS-object notation models sometimes produce.
 */
export function coerceComponentInput(raw: unknown): unknown {
  if (raw && typeof raw === "object") return raw;
  if (typeof raw !== "string") return raw;

  const text = raw.trim();
  // 1. Strict JSON.
  try {
    return JSON.parse(text);
  } catch {
    // 2. Tolerant pass for unquoted object keys and single quotes
    //    (e.g. `{type: 'card', title: "X"}`).
    try {
      const repaired = text
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');
      return JSON.parse(repaired);
    } catch {
      return raw;
    }
  }
}

export function createTools(
  aestheticId?: string,
  customImageStylePrompt?: string | null,
  imageModel?: string
) {
  return {
    generate_ui: tool({
      // The component tree is passed as a JSON STRING, not a structured object.
      // The full `a2uiInputSchema` is a deep, 50-branch recursive discriminated
      // union; converted to a tool/function-declaration JSON Schema it is complex
      // enough that some models (notably Gemini) fail to fill it and emit garbage
      // (a number, an empty object, or a stringified fragment). Asking for a single
      // JSON string sidesteps that entirely — models reliably emit one string field
      // — and we parse + validate server-side via `a2uiInputSchema`.
      description:
        'Submit a generated A2UI component tree for rendering. Pass `component` as a JSON string encoding a nested A2UI object: a root node with a `type` (one of: container, row, column, grid, card, tabs, heading, paragraph, text, callout, badge, divider, list, table, stat, image, video, input, textarea, select, checkbox, button) plus type-specific fields, and for layout types a `children` array of further nodes. For `image` and `video`, set their field to a short scene/shot DESCRIPTION (e.g. {"type":"image","prompt":"a rain-slicked alley mugshot"} or {"type":"video","prompt":"grainy security-cam footage of a figure crossing the alley"}); image is generated automatically, video renders as an on-demand "Generate footage" placeholder the user clicks (use video sparingly, only for genuine motion). Example: \'{"type":"card","title":"Suspect","description":"Wanted"}\'.',
      inputSchema: z.object({
        component: z.string().describe("The A2UI component tree, encoded as a JSON string."),
      }),
      execute: async ({ component }) => {
        const parsed = a2uiInputSchema.parse(coerceComponentInput(component));
        const resolved = await resolveA2UIImagePrompts(
          parsed,
          aestheticId,
          customImageStylePrompt,
          imageModel
        );
        return a2uiSchema.parse(resolved);
      },
    }),

    set_aesthetic: tool({
      description:
        "Switch the application's visual aesthetic and AI persona. Use this when the user requests a theme change or when the context suggests a different aesthetic would be more appropriate. Available aesthetics: 'noir' (dark detective), 'minimal' (clean light), 'cyber-fixer' (neon cyberpunk), 'nostromo-console' (retro green terminal), 'gothic-manor' (Victorian gothic).",
      inputSchema: z.object({
        aestheticId: aestheticIdSchema,
        reason: z
          .string()
          .optional()
          .describe("Brief explanation for why this aesthetic was chosen"),
      }),
      execute: async ({ aestheticId, reason }): Promise<SetAestheticResult> => {
        // Validate the aesthetic ID
        if (!isValidAestheticId(aestheticId)) {
          return {
            success: false,
            aestheticId: "noir", // fallback
            appliedAt: Date.now(),
            message: `Invalid aesthetic ID: ${aestheticId}. Falling back to 'noir'.`,
          };
        }

        return {
          success: true,
          aestheticId,
          appliedAt: Date.now(),
          message: reason
            ? `Switched to '${aestheticId}' aesthetic: ${reason}`
            : `Switched to '${aestheticId}' aesthetic.`,
        };
      },
    }),
  };
}

export const tools = createTools();
