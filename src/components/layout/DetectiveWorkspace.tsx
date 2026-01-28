"use client";

import React, { useMemo, useState, useEffect } from "react";
import { DeskLayout } from "./DeskLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { a2uiInputSchema } from "@/lib/protocol/schema";
import { EvidenceBoard } from "@/components/board/EvidenceBoard";
import { EjectPanel } from "@/components/eject/EjectPanel";
import {
  deriveEvidenceLabel,
  deriveEvidenceStatus,
} from "@/lib/evidence/utils";

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
  const {
    evidence,
    setEvidence,
    addEvidence,
    evidenceHistory,
    activeEvidenceId,
    setActiveEvidenceId,
    settings,
    updateSettings,
    layout,
    updateLayout,
  } = useA2UIStore();

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

  const modelConfig = settings.modelConfig ?? { provider: "auto", model: "" };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: {
          evidence,
          modelConfig:
            modelConfig?.provider && modelConfig.provider !== "auto"
              ? { provider: modelConfig.provider, model: modelConfig.model }
              : undefined,
        },
      }),
    [evidence, modelConfig],
  );

  const chat = useChat({
    transport,
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

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    if (process.env.NODE_ENV !== "production") {
      console.log("DEBUG: Last message role:", lastMessage.role);
      console.log("DEBUG: Last message parts:", lastMessage.parts);
    }

    if (lastMessage.role !== "assistant") return;

    const parts = Array.isArray(lastMessage.parts) ? lastMessage.parts : [];

    for (const part of parts) {
      // Standard AI SDK Tool Invocation
      if (part.type === "tool-invocation") {
        const invocation = (part as any).toolInvocation;
        if (
          invocation?.toolName === "generate_ui" &&
          invocation?.state === "result"
        ) {
          const parsed = a2uiInputSchema.safeParse(invocation.result);
          if (parsed.success) {
            if (process.env.NODE_ENV !== "production") {
              console.log("Tool Result received (standard):", parsed.data);
            }
            const entry = {
              id:
                typeof globalThis.crypto?.randomUUID === "function"
                  ? globalThis.crypto.randomUUID()
                  : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              createdAt: Date.now(),
              label: deriveEvidenceLabel(parsed.data),
              status: deriveEvidenceStatus(parsed.data),
              data: parsed.data,
            };
            addEvidence(entry);
            setEvidence(parsed.data);
            setActiveEvidenceId(entry.id);
            setJson(JSON.stringify(parsed.data, null, 2));
            setError(null);
            return;
          }
        }
      }

      const toolPart = part as {
        type: string;
        state?: string;
        output?: unknown;
        errorText?: string;
      };

      if (toolPart.type !== "tool-generate_ui") {
        continue;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "DEBUG: Tool part:",
          toolPart.type,
          "state:",
          toolPart.state,
        );
        if (toolPart.errorText) {
          console.error("DEBUG: Tool error:", toolPart.errorText);
        }
      }

      if (toolPart.state === "output-error") {
        setError(`Tool error: ${toolPart.errorText || "Unknown error"}`);
        continue;
      }

      if (toolPart.state !== "output-available") {
        continue;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("DEBUG: Tool output found:", toolPart.output);
      }

      const parsed = a2uiInputSchema.safeParse(toolPart.output);
      if (!parsed.success) {
        setError("Invalid tool output");
        continue;
      }

      console.log("Tool Result received:", parsed.data);
      const entry = {
        id:
          typeof globalThis.crypto?.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        label: deriveEvidenceLabel(parsed.data),
        status: deriveEvidenceStatus(parsed.data),
        data: parsed.data,
      };
      addEvidence(entry);
      setEvidence(parsed.data);
      setActiveEvidenceId(entry.id);
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
      const entry = {
        id:
          typeof globalThis.crypto?.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        label: deriveEvidenceLabel(parsed.data),
        status: deriveEvidenceStatus(parsed.data),
        data: parsed.data,
      };
      addEvidence(entry);
      setEvidence(parsed.data);
      setActiveEvidenceId(entry.id);
      setJson(JSON.stringify(parsed.data, null, 2));
      setError(null);
      return;
    }
  }, [addEvidence, messages, setActiveEvidenceId, setEvidence]);

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

  const handleSelectEvidence = (id: string) => {
    const entry = evidenceHistory.find((item) => item.id === id);
    if (!entry) return;
    setActiveEvidenceId(id);
    setEvidence(entry.data);
    setJson(JSON.stringify(entry.data, null, 2));
  };

  return (
    <DeskLayout
      showEditor={layout.showEditor}
      showSidebar={layout.showSidebar}
      showEject={layout.showEject}
      editorWidth={layout.editorWidth}
      sidebarWidth={layout.sidebarWidth}
      onToggleEditor={() => updateLayout({ showEditor: !layout.showEditor })}
      onToggleSidebar={() => updateLayout({ showSidebar: !layout.showSidebar })}
      onToggleEject={() => updateLayout({ showEject: !layout.showEject })}
      onResizeEditor={(nextWidth) => updateLayout({ editorWidth: nextWidth })}
      onResizeSidebar={(nextWidth) => updateLayout({ sidebarWidth: nextWidth })}
      ejectPanel={
        <EjectPanel
          evidence={evidence}
          onClose={() => updateLayout({ showEject: false })}
        />
      }
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
          <EvidenceBoard
            entries={evidenceHistory}
            activeId={activeEvidenceId}
            onSelect={handleSelectEvidence}
            fallbackEvidence={evidence}
          />
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
          modelConfig={modelConfig}
          onUpdateSettings={updateSettings}
          onModelConfigChange={(config) =>
            updateSettings({ modelConfig: config })
          }
          onToggleCollapse={() => updateLayout({ showSidebar: false })}
        />
      }
    />
  );
}
