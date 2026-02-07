import "server-only";

// NOTE: Module-level state is ephemeral in serverless environments (Vercel, AWS Lambda).
// Each cold start resets this to null. This is acceptable for a per-request hint
// but should not be relied on for persistent state across requests.
let customImageStylePrompt: string | null = null;

export function setCustomImageStylePrompt(prompt: string | null): void {
  customImageStylePrompt = prompt;
}

export function getCustomImageStylePrompt(): string | null {
  return customImageStylePrompt;
}
