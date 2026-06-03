import "server-only";

import { NextRequest } from "next/server";
import type { ActionMessage, ServerMessage } from "@/lib/a2ui/schema/messages";
import { apiSecurityCheck } from "@/lib/api/security";

/**
 * POST /api/a2ui/action
 *
 * Plain JSON endpoint (NOT SSE) for the button -> server -> UI round-trip.
 *
 * Accepts an A2UI v0.9 {@link ActionMessage} describing a user interaction and
 * returns a deterministic list of follow-up server messages the client applies
 * to the surface store:
 *
 *   Request body:  ActionMessage
 *     { type: "action", surfaceId, sourceComponentId, actionName, timestamp, context? }
 *   Response body: { messages: ServerMessage[] }
 *
 * The handler is fully deterministic (no AI provider required) so it is usable
 * in the mock / E2E path and easy to unit test.
 */

/**
 * Build the deterministic list of follow-up server messages for an action.
 *
 * Every returned message carries the incoming `surfaceId`. The handler keys off
 * `actionName`:
 *   - "submit" | "submit_form" | "submit_case" -> set `/status` to a
 *     confirmation string and echo `context.formValues` into `/lastSubmission`.
 *   - "increment" -> read a current number from context and set `/count` to the
 *     bumped value.
 *   - default -> set `/lastAction` to the action name.
 */
function handleAction(message: ActionMessage): ServerMessage[] {
  const { surfaceId, actionName, context } = message;

  if (actionName === "submit" || actionName === "submit_form" || actionName === "submit_case") {
    const messages: ServerMessage[] = [
      {
        type: "updateDataModel",
        surfaceId,
        path: "/status",
        value: `Submitted: ${actionName}`,
      },
    ];
    if (context?.formValues !== undefined) {
      messages.push({
        type: "updateDataModel",
        surfaceId,
        path: "/lastSubmission",
        value: context.formValues,
      });
    }
    return messages;
  }

  if (actionName === "increment") {
    const current = readNumberFromContext(context);
    return [
      {
        type: "updateDataModel",
        surfaceId,
        path: "/count",
        value: current + 1,
      },
    ];
  }

  return [
    {
      type: "updateDataModel",
      surfaceId,
      path: "/lastAction",
      value: actionName,
    },
  ];
}

/**
 * Extract a current numeric value from the action context for "increment".
 *
 * Looks at `context.dataBindings.count` then `context.formValues.count`,
 * coercing numeric strings. Falls back to 0 when nothing usable is present.
 */
function readNumberFromContext(context: ActionMessage["context"]): number {
  const candidates: unknown[] = [
    context?.dataBindings?.count,
    context?.dataBindings?.value,
    context?.formValues?.count,
    context?.formValues?.value,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

/**
 * Minimal structural guard for an incoming ActionMessage. We only require the
 * fields the deterministic handler depends on (`actionName` + `surfaceId`);
 * everything else is optional / passthrough.
 */
function isValidActionBody(body: unknown): body is ActionMessage {
  if (typeof body !== "object" || body === null) return false;
  const record = body as Record<string, unknown>;
  return (
    typeof record.actionName === "string" &&
    record.actionName.length > 0 &&
    typeof record.surfaceId === "string" &&
    record.surfaceId.length > 0
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const securityError = apiSecurityCheck(req);
  if (securityError) return securityError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!isValidActionBody(body)) {
    return new Response("Missing or invalid action message", { status: 400 });
  }

  const messages = handleAction(body);

  return Response.json({ messages });
}
