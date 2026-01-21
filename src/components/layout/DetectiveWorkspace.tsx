"use client";

import React, { useMemo, useState, useEffect } from "react";
import { DeskLayout } from "./DeskLayout";
import { A2UIRenderer } from "@/components/renderer/A2UIRenderer";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useChat } from "@ai-sdk/react";
import { a2uiInputSchema } from "@/lib/protocol/schema";
import type { UIMessage } from "ai";

const DEFAULT_JSON = JSON.stringify(
  {
    type: "text",
    content: "Evidence #1",
    priority: "normal",
  },
  null,
  2,
);

export function DetectiveWorkspace() {
  const [json, setJson] = useState(DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const { evidence, setEvidence, settings, updateSettings } = useA2UIStore();

  // Initialize store
  useEffect(() => {
    try {
      if (!evidence) {
        setEvidence(JSON.parse(DEFAULT_JSON));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Once

  const chat = useChat({
    body: { evidence },
    onError: (err) => console.error("useChat error:", err),
  });

  const { messages, status, sendMessage } = chat;
  const isLoading = status === "submitted" || status === "streaming";

  const uiMessages = useMemo(
    () =>
      messages.map((message: UIMessage & { content?: string }) => {
        const parts = Array.isArray(message.parts) ? message.parts : null;
        const contentFromParts = parts
          ? parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("")
          : "";
        const content = contentFromParts || message.content || "";

        return {
          id: message.id,
          role: message.role,
          content,
        };
      }),
    [messages],
  );

  // Sync Tool Results to Store
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== "assistant") return;

    const parts = Array.isArray(lastMessage.parts) ? lastMessage.parts : [];
    for (const part of parts) {
      if (
        part.type !== "tool-generate_ui" ||
        part.state !== "output-available"
      ) {
        continue;
      }

      const parsed = a2uiInputSchema.safeParse(part.output);
      if (!parsed.success) {
        setError("Invalid tool output");
        continue;
      }

      console.log("Tool Result received:", parsed.data);
      setEvidence(parsed.data);
      setJson(JSON.stringify(parsed.data, null, 2));
      setError(null);
      return;
    }

    const legacyInvocations = (lastMessage as { toolInvocations?: unknown })
      .toolInvocations;
    if (!Array.isArray(legacyInvocations)) return;

    for (const tool of legacyInvocations) {
      if (
        typeof tool !== "object" ||
        tool === null ||
        (tool as { toolName?: string }).toolName !== "generate_ui"
      ) {
        continue;
      }

      const result = (tool as { state?: string; result?: unknown }).result;
      const parsed = a2uiInputSchema.safeParse(result);
      if (!parsed.success) {
        setError("Invalid tool output");
        continue;
      }

      console.log("Tool Result received:", parsed.data);
      setEvidence(parsed.data);
      setJson(JSON.stringify(parsed.data, null, 2));
      setError(null);
      return;
    }
  }, [messages, setEvidence]);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setJson(newVal);
    try {
      const data = JSON.parse(newVal);
      setEvidence(data);
      setError(null);
    } catch {
      setError("Invalid JSON");
    }
  };

  return (
    <DeskLayout
      editor={
        <div className="h-full min-h-0 flex flex-col">
          <textarea
            className="w-full flex-1 min-h-0 bg-noir-black/30 text-noir-paper/95 font-mono text-sm leading-relaxed resize-none focus:outline-none p-3 border border-noir-gray/30 rounded-sm shadow-inner"
            id="json-editor"
            name="json-editor"
            value={json}
            onChange={handleEditorChange}
            spellCheck={false}
          />
          {error && (
            <div className="text-noir-red font-typewriter text-xs mt-2 border-t border-noir-red pt-2">
              Error: {error}
            </div>
          )}
        </div>
      }
      preview={
        evidence ? (
          <A2UIRenderer data={evidence} />
        ) : (
          <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm animate-pulse max-w-md">
            <h3 className="text-noir-red font-typewriter font-bold mb-2">
              REDACTED
            </h3>
            <p className="text-noir-red/80 font-mono text-xs">
              NO EVIDENCE LOADED.
            </p>
          </div>
        )
      }
      sidebar={
        <ChatSidebar
          messages={uiMessages}
          sendMessage={sendMessage}
          isLoading={isLoading}
          typewriterSpeed={settings.typewriterSpeed}
          onUpdateSettings={updateSettings}
        />
      }
    />
  );
}
