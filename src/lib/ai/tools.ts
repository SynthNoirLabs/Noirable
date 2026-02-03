import { tool } from "ai";
import { z } from "zod";
import { a2uiInputSchema, a2uiSchema } from "@/lib/protocol/schema";
import { resolveA2UIImagePrompts } from "@/lib/ai/images";
import { isValidAestheticId } from "@/lib/aesthetic/registry";
import type { AestheticId } from "@/lib/aesthetic/types";

/**
 * Zod schema for aesthetic ID validation.
 */
const aestheticIdSchema = z
  .enum(["noir", "minimal"])
  .describe(
    "The aesthetic profile to switch to. 'noir' is a dark detective theme, 'minimal' is a clean light theme."
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

export const tools = {
  generate_ui: tool({
    description: "Submit a generated A2UI component for rendering.",
    inputSchema: z.object({
      component: a2uiInputSchema.describe("The A2UI component to render"),
    }),
    execute: async ({ component }) => {
      const parsed = a2uiInputSchema.parse(component);
      const resolved = await resolveA2UIImagePrompts(parsed);
      return a2uiSchema.parse(resolved);
    },
  }),

  set_aesthetic: tool({
    description:
      "Switch the application's visual aesthetic and AI persona. Use this when the user requests a theme change or when the context suggests a different aesthetic would be more appropriate. Available aesthetics: 'noir' (dark detective theme with atmospheric persona), 'minimal' (clean light theme with professional persona).",
    inputSchema: z.object({
      aestheticId: aestheticIdSchema,
      reason: z.string().optional().describe("Brief explanation for why this aesthetic was chosen"),
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
