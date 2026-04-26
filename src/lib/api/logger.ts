import "server-only";

import type { UIMessage } from "ai";

/**
 * Redacted request summary for chat-style endpoints.
 *
 * Never log raw request bodies — they contain full user prompts and may
 * include pasted secrets. Use this helper to capture shape-only telemetry.
 */
export interface ChatRequestSummary {
  messageCount: number;
  lastMessageRole?: string;
  lastMessageChars?: number;
  hasEvidence: boolean;
  aestheticId?: string;
  modelProvider?: string;
  modelName?: string;
}

export function summarizeChatRequest(body: {
  messages?: UIMessage[];
  evidence?: unknown;
  aestheticId?: string;
  modelConfig?: { provider?: string; model?: string };
}): ChatRequestSummary {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const last = messages[messages.length - 1];
  const lastText =
    last && Array.isArray(last.parts)
      ? last.parts.reduce(
          (acc, p) =>
            acc +
            (p && (p as { type?: string }).type === "text"
              ? ((p as { text?: string }).text ?? "").length
              : 0),
          0
        )
      : undefined;

  return {
    messageCount: messages.length,
    lastMessageRole: last?.role,
    lastMessageChars: lastText,
    hasEvidence: body.evidence != null,
    aestheticId: body.aestheticId,
    modelProvider: body.modelConfig?.provider,
    modelName: body.modelConfig?.model,
  };
}

export function logChatRequest(body: Parameters<typeof summarizeChatRequest>[0]): void {
  if (process.env.NODE_ENV === "production") return;
  console.log("[chat] request", summarizeChatRequest(body));
}
