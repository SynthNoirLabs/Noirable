import "server-only";

import type { AestheticId } from "@/lib/aesthetic/types";
import { getPersonaPrompt } from "@/lib/aesthetic/personas";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";
import { COMPONENT_PLAYBOOK } from "./composition";

/**
 * Default system prompt (noir persona).
 * @deprecated Use buildSystemPrompt with aestheticId instead.
 */
export const SYSTEM_PROMPT = getPersonaPrompt("noir");

/**
 * Build the system prompt for the AI based on aesthetic and evidence.
 *
 * Composition guidance is layered after the persona body:
 * - The per-preset LAYOUT DOCTRINE is appended only for built-in personas
 *   (no custom system prompt); custom personas define their own composition.
 *   Unknown/custom aesthetic ids fall back to the noir doctrine.
 * - The shared COMPONENT PLAYBOOK is preset-agnostic structural guidance, so
 *   it is appended in every case (custom or not).
 *
 * @param evidence - Current evidence state to include in context
 * @param aestheticId - Aesthetic profile ID (defaults to "noir")
 * @param customSystemPrompt - Optional custom persona body (skips the doctrine)
 * @returns Complete system prompt string
 */
export function buildSystemPrompt(
  evidence?: unknown,
  aestheticId?: AestheticId,
  customSystemPrompt?: string
): string {
  const basePrompt = customSystemPrompt || getPersonaPrompt(aestheticId);

  // Per-preset layout doctrine only when there is no custom persona.
  const layoutDoctrine = customSystemPrompt
    ? ""
    : getAestheticDefinition(aestheticId).identity.layoutDoctrine;

  const composition = layoutDoctrine
    ? `${layoutDoctrine}\n\n${COMPONENT_PLAYBOOK}`
    : COMPONENT_PLAYBOOK;

  const promptWithComposition = `${basePrompt}\n\n${composition}`;

  if (!evidence) return promptWithComposition;

  return `${promptWithComposition}

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
