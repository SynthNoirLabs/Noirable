"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { DeskLayout } from "./DeskLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { a2uiInputSchema } from "@/lib/protocol/schema";
import { EvidenceBoard } from "@/components/board/EvidenceBoard";
import { EjectPanel } from "@/components/eject/EjectPanel";
import { deriveEvidenceLabel, deriveEvidenceStatus } from "@/lib/evidence/utils";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { TemplatePanel } from "@/components/templates/TemplatePanel";
import { EvidenceSkeleton } from "@/components/board/EvidenceSkeleton";
import { TrainingDataPanel } from "@/components/training/TrainingDataPanel";
import type { A2UIInput } from "@/lib/protocol/schema";
import { createTrainingExample, shouldCapture } from "@/lib/training";

const DEFAULT_JSON = JSON.stringify(
  {
    type: "text",
    content: "Evidence #1",
    priority: "normal",
  },
  null,
  2
);

/**
 * Extract the last user prompt from messages array
 */
function getLastUserPrompt(
  messages: Array<{ role: string; content?: string; parts?: unknown[] }>
): string | null {
  // Traverse from the end to find the most recent user message
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "user") {
      // Extract text from parts if available
      if (Array.isArray(msg.parts)) {
        const textParts = msg.parts
          .filter(
            (part): part is { type: "text"; text: string } =>
              typeof part === "object" &&
              part !== null &&
              (part as { type?: string }).type === "text"
          )
          .map((part) => part.text)
          .join("");
        if (textParts) return textParts;
      }
      // Fallback to content
      if (msg.content) return msg.content;
    }
  }
  return null;
}

export function DetectiveWorkspace() {
  const [json, setJson] = useState(DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
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
    pushUndoState,
    undo,
    redo,
    addPrompt,
    addTrainingExample,
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

  const modelConfig = useMemo(
    () => settings.modelConfig ?? { provider: "auto", model: "" },
    [settings.modelConfig]
  );

  const transport = useMemo(() => new DefaultChatTransport(), []);

  const buildRequestBody = useCallback(
    () => ({
      evidence,
      modelConfig:
        modelConfig?.provider && modelConfig.provider !== "auto"
          ? { provider: modelConfig.provider, model: modelConfig.model }
          : undefined,
    }),
    [evidence, modelConfig]
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
    [messages]
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
        const invocation = (
          part as {
            toolInvocation?: {
              toolName?: string;
              state?: string;
              result?: unknown;
            };
          }
        ).toolInvocation;
        if (invocation?.toolName === "generate_ui" && invocation?.state === "result") {
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
            setLastFailedPrompt(null); // Clear on success

            // Capture training data from successful generation
            const userPrompt = getLastUserPrompt(messages);
            if (userPrompt && shouldCapture(userPrompt, parsed.data)) {
              addTrainingExample(createTrainingExample(userPrompt, parsed.data));
            }
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
        console.log("DEBUG: Tool part:", toolPart.type, "state:", toolPart.state);
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

      // Capture training data from successful generation
      const userPrompt2 = getLastUserPrompt(messages);
      if (userPrompt2 && shouldCapture(userPrompt2, parsed.data)) {
        addTrainingExample(createTrainingExample(userPrompt2, parsed.data));
      }
      return;
    }

    const legacyInvocations = (lastMessage as { toolInvocations?: unknown }).toolInvocations;
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

      // Capture training data from successful generation (legacy path)
      const userPrompt3 = getLastUserPrompt(messages);
      if (userPrompt3 && shouldCapture(userPrompt3, parsed.data)) {
        addTrainingExample(createTrainingExample(userPrompt3, parsed.data));
      }
      return;
    }
  }, [addEvidence, addTrainingExample, messages, setActiveEvidenceId, setEvidence]);

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
    pushUndoState(); // Save state before changing
    setActiveEvidenceId(id);
    setEvidence(entry.data);
    setJson(JSON.stringify(entry.data, null, 2));
  };

  const handleSelectTemplate = (data: A2UIInput) => {
    pushUndoState(); // Save state before loading template
    setEvidence(data);
    setJson(JSON.stringify(data, null, 2));
    setShowTemplates(false); // Close template panel after selection
    setError(null);
  };

  // Track prompt before sending
  const trackAndSend = useCallback(
    (text: string) => {
      addPrompt(text, activeEvidenceId ?? undefined);
      pushUndoState();
      setLastFailedPrompt(text);
      setError(null);
    },
    [addPrompt, activeEvidenceId, pushUndoState]
  );

  const sendMessageWithContext = useCallback(
    (message?: Parameters<typeof sendMessage>[0], options?: Parameters<typeof sendMessage>[1]) =>
      sendMessage(message, {
        ...options,
        body: {
          ...(options?.body ?? {}),
          ...buildRequestBody(),
        },
      }),
    [buildRequestBody, sendMessage]
  );

  // Wrap sendMessage to track prompt history
  const handleSendMessage: typeof sendMessage = useCallback(
    async (message, options) => {
      // Extract text from message if it has a text property
      const text =
        message && typeof message === "object" && "text" in message
          ? (message as { text: string }).text
          : "";
      if (text) {
        trackAndSend(text);
      }
      return sendMessageWithContext(message, options);
    },
    [sendMessageWithContext, trackAndSend]
  );

  // Retry last failed prompt
  const handleRetry = useCallback(() => {
    if (lastFailedPrompt) {
      trackAndSend(lastFailedPrompt);
      sendMessageWithContext({ text: lastFailedPrompt });
    }
  }, [lastFailedPrompt, sendMessageWithContext, trackAndSend]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onToggleEject: () => updateLayout({ showEject: !layout.showEject }),
    onSend: () => {
      // Focus chat input and trigger form submit
      chatInputRef.current?.form?.requestSubmit();
    },
    onEscape: () => {
      if (layout.showEject) {
        updateLayout({ showEject: false });
      }
    },
  });

  return (
    <DeskLayout
      showEditor={layout.showEditor}
      showSidebar={layout.showSidebar}
      showEject={layout.showEject}
      showTemplates={showTemplates}
      showTraining={showTraining}
      editorWidth={layout.editorWidth}
      sidebarWidth={layout.sidebarWidth}
      ambient={settings.ambient}
      soundEnabled={settings.soundEnabled}
      musicEnabled={settings.musicEnabled}
      onToggleEditor={() => updateLayout({ showEditor: !layout.showEditor })}
      onToggleSidebar={() => updateLayout({ showSidebar: !layout.showSidebar })}
      onToggleEject={() => updateLayout({ showEject: !layout.showEject })}
      onToggleTemplates={() => setShowTemplates(!showTemplates)}
      onToggleTraining={() => setShowTraining(!showTraining)}
      onResizeEditor={(nextWidth) => updateLayout({ editorWidth: nextWidth })}
      onResizeSidebar={(nextWidth) => updateLayout({ sidebarWidth: nextWidth })}
      templatePanel={
        <TemplatePanel onSelect={handleSelectTemplate} onClose={() => setShowTemplates(false)} />
      }
      trainingPanel={<TrainingDataPanel onClose={() => setShowTraining(false)} />}
      ejectPanel={
        <EjectPanel evidence={evidence} onClose={() => updateLayout({ showEject: false })} />
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
        isLoading ? (
          <EvidenceSkeleton />
        ) : error ? (
          <div className="max-w-md space-y-4">
            <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm">
              <h3 className="text-noir-red font-typewriter font-bold mb-2">CASE FILE ERROR</h3>
              <p className="text-noir-red/80 font-mono text-xs">{error}</p>
            </div>
            {lastFailedPrompt && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-4 py-2 bg-noir-amber/20 border border-noir-amber/50 text-noir-amber font-typewriter text-xs uppercase tracking-wider rounded-sm hover:bg-noir-amber/30 transition-colors"
                >
                  Retry Last Command
                </button>
                <span className="text-noir-paper/50 font-mono text-xs truncate max-w-[200px]">
                  &ldquo;{lastFailedPrompt}&rdquo;
                </span>
              </div>
            )}
          </div>
        ) : evidence ? (
          <EvidenceBoard
            entries={evidenceHistory}
            activeId={activeEvidenceId}
            onSelect={handleSelectEvidence}
            fallbackEvidence={evidence}
          />
        ) : (
          <div className="bg-noir-red/10 border-2 border-noir-red p-4 rounded-sm animate-pulse max-w-md">
            <h3 className="text-noir-red font-typewriter font-bold mb-2">REDACTED</h3>
            <p className="text-noir-red/80 font-mono text-xs">NO EVIDENCE LOADED.</p>
          </div>
        )
      }
      sidebar={
        <ChatSidebar
          messages={uiMessages}
          sendMessage={handleSendMessage}
          isLoading={isLoading}
          typewriterSpeed={settings.typewriterSpeed}
          soundEnabled={settings.soundEnabled}
          ttsEnabled={settings.ttsEnabled}
          musicEnabled={settings.musicEnabled}
          ambient={settings.ambient}
          modelConfig={modelConfig}
          onUpdateSettings={updateSettings}
          onModelConfigChange={(config) => updateSettings({ modelConfig: config })}
          onToggleCollapse={() => updateLayout({ showSidebar: false })}
          inputRef={chatInputRef}
        />
      }
    />
  );
}
