import { tool } from "ai";
import { z } from "zod";
import { a2uiInputSchema, a2uiSchema } from "@/lib/protocol/schema";

export const tools = {
  generate_ui: tool({
    description: "Submit a generated A2UI component for rendering.",
    inputSchema: z.object({
      component: a2uiInputSchema.describe("The A2UI component to render"),
    }),
    execute: async ({ component }) => {
      return a2uiSchema.parse(component);
    },
  }),
};
