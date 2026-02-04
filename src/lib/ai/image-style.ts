import "server-only";

let customImageStylePrompt: string | null = null;

export function setCustomImageStylePrompt(prompt: string | null): void {
  customImageStylePrompt = prompt;
}

export function getCustomImageStylePrompt(): string | null {
  return customImageStylePrompt;
}
