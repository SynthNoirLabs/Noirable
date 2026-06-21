"use client";

import type { ActionMessage, ServerMessage } from "@/lib/a2ui/schema/messages";

/**
 * Server-event names the deterministic /api/a2ui/action handler actually acts
 * on — they mutate the data model, so a bound component visibly updates and the
 * click needs no acknowledgement toast. Every other event name no-ops there
 * (sets /lastAction), so it DOES get a toast. Keep in sync with the handler in
 * src/app/api/a2ui/action/route.ts.
 */
export const EVENTS_WITH_VISIBLE_EFFECT = new Set([
  "submit",
  "submit_form",
  "submit_case",
  "increment",
]);

/**
 * Turn a machine action name into a human label for the click-acknowledgement
 * toast, e.g. "track_signal" / "trackSignal" → "Track Signal". Used only as a
 * fallback when the control has no plain-text label of its own.
 */
export function humanizeActionName(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // split camelCase
    .replace(/[_-]+/g, " ") // snake/kebab → spaces
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "Action";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * POST an action to the server endpoint and apply the returned follow-up
 * messages. Best-effort: a missing/erroring back-channel (e.g. in unit tests
 * without a server) is swallowed so the UI never breaks.
 */
export async function postAction(
  endpoint: string,
  message: ActionMessage,
  apply: (messages: ServerMessage[]) => void
): Promise<void> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { messages?: unknown };
    if (Array.isArray(data.messages)) {
      apply(data.messages as ServerMessage[]);
    }
  } catch {
    // Back-channel unavailable — leave the UI as-is.
  }
}
