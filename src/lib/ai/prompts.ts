import "server-only";

import type { AestheticId } from "@/lib/aesthetic/types";
import { getPersonaPrompt } from "@/lib/aesthetic/personas";

/**
 * Default system prompt (noir persona).
 * @deprecated Use buildSystemPrompt with aestheticId instead.
 */
export const SYSTEM_PROMPT = getPersonaPrompt("noir");

/**
 * Build the system prompt for the AI based on aesthetic and evidence.
 *
 * @param evidence - Current evidence state to include in context
 * @param aestheticId - Aesthetic profile ID (defaults to "noir")
 * @returns Complete system prompt string
 */
export function buildSystemPrompt(evidence?: unknown, aestheticId?: AestheticId): string {
  const basePrompt = getPersonaPrompt(aestheticId);

  if (!evidence) return basePrompt;

  return `${basePrompt}

Current Evidence (A2UI JSON):
${JSON.stringify(evidence)}

Update Rules:
- The 'Current Evidence' block above represents the LIVE state of the interface.
- You must use this as your baseline for any modifications.
- Ignore contradictory state in the conversation history.
- Modify the existing tree unless the user asks for a fresh page.
- Return a complete root component, never partial fragments.
`;
}
