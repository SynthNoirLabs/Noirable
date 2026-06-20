import { tool } from "ai";
import { z } from "zod";
import { a2uiInputSchema, a2uiSchema, SUPPORTED_LEGACY_TYPE_LIST } from "@/lib/protocol/schema";
import { resolveA2UIImagePrompts } from "@/lib/ai/images";
import { isValidAestheticId } from "@/lib/aesthetic/registry";
import { BUILT_IN_AESTHETIC_IDS } from "@/lib/aesthetic/types";
import type { AestheticId } from "@/lib/aesthetic/types";

/**
 * Zod schema for aesthetic ID validation. Mirrors the built-in keys of
 * AESTHETIC_REGISTRY so the AI can switch to every shipped aesthetic, not just
 * noir/minimal.
 */
const aestheticIdSchema = z
  .enum(BUILT_IN_AESTHETIC_IDS)
  .describe(
    "The aesthetic profile to switch to. 'noir' is a dark detective theme, 'minimal' is a clean light theme, 'cyber-fixer' is a neon cyberpunk theme, 'nostromo-console' is a retro green-phosphor terminal, 'gothic-manor' is a dark Victorian gothic theme, 'grand-hotel' is a 1920s art-deco grand hotel."
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
      //
      // This is NOT us out-engineering a flaw in A2UI. A2UI itself is
      // "prompt-first" (v0.9+): it puts the schema/examples in the PROMPT as
      // documentation and asks the model to emit free-text JSON that is validated
      // AFTER generation — it never feeds the recursive schema into the provider's
      // function-calling / constrained-decoding mechanism. Google moved off the
      // structured-output approach (v0.8) for exactly this reason.
      //
      // We only hit a problem because we route generation through a FORCED tool
      // call (to separate "here is the UI" from the detective's narration in one
      // streamText pass). Our first cut set this tool's `inputSchema` to the full
      // ~50-branch recursive `a2uiInputSchema`; the SDK compiled that to a Gemini
      // function-declaration schema and tripped Gemini's documented "very large /
      // deeply nested schema" limit, so the model emitted garbage (a number, an
      // empty object, a stringified fragment). Taking a single JSON string and
      // validating server-side puts us back on A2UI's own prompt-first pattern —
      // the tool just guarantees UI is produced; it no longer constrains its shape.
      description:
        `Submit a generated A2UI component tree for rendering. Pass \`component\` as a JSON string encoding a nested A2UI object: a root node with a \`type\` (one of: ${SUPPORTED_LEGACY_TYPE_LIST}) plus type-specific fields, and for layout types a \`children\` array of further nodes. ` +
        'For `image` and `video`, set their field to a short scene/shot DESCRIPTION (e.g. {"type":"image","prompt":"a rain-slicked alley mugshot"} or {"type":"video","prompt":"grainy security-cam footage of a figure crossing the alley"}); image is generated automatically, video renders as an on-demand "Generate footage" placeholder the user clicks (use video sparingly, only for genuine motion). ' +
        'For `kanbanBoard`, use {"type":"kanbanBoard","title":…,"columns":[{"title":"To Do","cards":[{"title":…,"description":…,"assignee":…,"tags":[…]}]}]}. For `dataDashboard`, use {"type":"dataDashboard","title":…,"widgets":[{"title":…,"type":"metric"|"progress"|"chart","value":…,"unit":…,"progress":0-100,"data":[{"label":…,"value":…}],"trend":{"value":…,"direction":"up"|"down"|"neutral"}}]}. ' +
        'Example: \'{"type":"card","title":"Suspect","description":"Wanted"}\'.',
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
