"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { DeskLayout } from "./DeskLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { a2uiInputSchema } from "@/lib/protocol/schema";
import { EvidenceBoard } from "@/components/board/EvidenceBoard";
import { CaseBoardEmptyState } from "@/components/board/CaseBoardEmptyState";
import { EjectPanel } from "@/components/eject/EjectPanel";
import { deriveEvidenceLabel, deriveEvidenceStatus } from "@/lib/evidence/utils";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { TemplatePanel } from "@/components/templates/TemplatePanel";
import { EvidenceSkeleton } from "@/components/board/EvidenceSkeleton";
import { NoirErrorBoundary } from "@/components/shared/NoirErrorBoundary";
import { TrainingDataPanel } from "@/components/training/TrainingDataPanel";
import { DictaphonePanel } from "@/components/noir/DictaphonePanel";
import type { A2UIInput } from "@/lib/protocol/schema";
import { createTrainingExample, shouldCapture } from "@/lib/training";
// A2UI v0.9 imports
import { useA2UIStream } from "@/lib/a2ui/hooks/useA2UIStream";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getCompositionSeed } from "@/lib/aesthetic/identity";
import { A2UIv09Preview } from "@/components/a2ui/A2UIv09Preview";
import { A2UIVariantControls } from "@/components/a2ui/A2UIVariantControls";
import { CustomizationPanel } from "@/components/settings/CustomizationPanel";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";

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

/**
 * A captured "Take" — a frozen snapshot of one generated surface so the
 * variant picker can re-load it after subsequent sends clear()/replace the
 * live surface store.
 */
interface CapturedVariant {
  catalogId: string;
  theme?: string | Record<string, unknown>;
  components: SurfaceComponent[];
  // The surface's data model must be captured too: list/template components
  // resolve their children from it, so a take restored with an empty model
  // renders blank even though all its components are present.
  dataModel: Record<string, unknown>;
}

export function DetectiveWorkspace() {
  const [json, setJson] = useState(DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  // Bet 6: Take 1/2/3 variants. Each completed generation is snapshotted here so
  // the picker can swap which take is shown without re-calling the model. Empty
  // until the user explicitly requests variations or iterates.
  const [variants, setVariants] = useState<CapturedVariant[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  // The most recent v0.9 prompt, so iteration actions ("fancier"/"simplify"/
  // "different angle") can re-issue it with a canned refinement appended.
  const lastV09PromptRef = useRef<string | null>(null);
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

  const loadProfiles = useCustomProfileStore((state) => state.loadProfiles);
  const customProfiles = useCustomProfileStore((state) => state.customProfiles);
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Live-apply custom-profile CSS. injectProfileStyles was previously only
  // called from the Colors tab, so a saved profile rendered as its bare base
  // preset on load and on switch. Inject every loaded profile's scoped
  // `[data-custom-profile]` rule whenever the set or any profile changes, so
  // the rule always exists and flipping DeskLayout's data-custom-profile
  // attribute (on activation) immediately repaints. injectProfileStyles is
  // idempotent (marker-splice) and no-ops server-side.
  useEffect(() => {
    for (const profile of customProfiles) {
      injectProfileStyles(profile);
    }
  }, [customProfiles]);

  const customSystemPrompt = activeProfile?.systemPrompt;

  const activeAmbient = useMemo(() => {
    const base = settings.ambient;
    if (!activeProfile) return base;

    return {
      ...base,
      rainVolume: activeProfile.audio?.ambientRainVolume ?? base.rainVolume,
      crackleVolume: activeProfile.audio?.ambientCrackleVolume ?? base.crackleVolume,
    };
  }, [settings.ambient, activeProfile]);

  const activeMusicVolume = activeProfile?.audio?.musicVolume ?? settings.musicVolume;
  const activeCustomMusicUrl = activeProfile?.audio?.customMusicUrl ?? settings.customMusicUrl;

  const modelConfig = useMemo(
    () => settings.modelConfig ?? { provider: "auto", model: "" },
    [settings.modelConfig]
  );

  const transport = useMemo(() => new DefaultChatTransport(), []);

  // A2UI v0.9 hook
  const useV09 = settings.useA2UIv09 ?? false;
  // The v0.9 stream delivers the detective's narration mid-stream (before the
  // promise resolves), so stash it here for the send handler to read afterward.
  const v09NarrationRef = useRef<string | null>(null);
  const {
    sendPrompt: sendV09Prompt,
    isStreaming: isV09Streaming,
    error: v09Error,
  } = useA2UIStream({
    onNarration: (text) => {
      v09NarrationRef.current = text;
    },
    onComplete: (surfaceId) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[A2UI v0.9] Surface completed:", surfaceId);
      }
      // Mirror the rendered surface into the JSON editor so the "CASE FILE //
      // JSON DATA" pane reflects the v0.9 component tree instead of stale state.
      const surface = useSurfaceStore.getState().getSurface(surfaceId);
      if (surface) {
        const components = Array.from(surface.components.values());
        setJson(
          JSON.stringify(
            {
              surfaceId,
              catalogId: surface.config.catalogId,
              components,
            },
            null,
            2
          )
        );
      }
      setLastFailedPrompt(null);
    },
    onError: (err) => {
      console.error("[A2UI v0.9] Error:", err);
      setError(err.message);
    },
  });

  const buildRequestBody = useCallback(
    () => ({
      evidence,
      modelConfig:
        modelConfig?.provider && modelConfig.provider !== "auto"
          ? { provider: modelConfig.provider, model: modelConfig.model }
          : undefined,
      aestheticId: activeProfile?.baseAestheticId ?? settings.aestheticId,
      customSystemPrompt,
      customImageStylePrompt: activeProfile?.imageStylePrompt,
      imageModel: settings.imageModel,
    }),
    [
      evidence,
      modelConfig,
      settings.aestheticId,
      settings.imageModel,
      customSystemPrompt,
      activeProfile?.baseAestheticId,
      activeProfile?.imageStylePrompt,
    ]
  );

  const chat = useChat({
    transport,
    onError: (err) => console.error("useChat error:", err),
  });

  const { messages, status, sendMessage, setMessages } = chat;
  const isLegacyLoading = status === "submitted" || status === "streaming";
  const isLoading = useV09 ? isV09Streaming : isLegacyLoading;

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

  /** Shared logic for committing a new evidence entry to the store */
  const processNewEvidence = useCallback(
    (
      entry: { id: string; createdAt: number; label: string; status?: string; data: A2UIInput },
      data: A2UIInput
    ) => {
      addEvidence(entry);
      setEvidence(data);
      setActiveEvidenceId(entry.id);
      setJson(JSON.stringify(data, null, 2));
      setError(null);
    },
    [addEvidence, setActiveEvidenceId, setEvidence]
  );

  /** Capture training data if conditions are met */
  const captureTraining = useCallback(
    (data: A2UIInput) => {
      const userPrompt = getLastUserPrompt(messages);
      if (userPrompt && shouldCapture(userPrompt, data)) {
        addTrainingExample(createTrainingExample(userPrompt, data));
      }
    },
    [addTrainingExample, messages]
  );

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

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
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              label: deriveEvidenceLabel(parsed.data),
              status: deriveEvidenceStatus(parsed.data),
              data: parsed.data,
            };
            // This effect synchronizes the app with the external AI message
            // stream (the documented Client Synchronization pattern), so it
            // intentionally commits state when a tool result arrives.
            processNewEvidence(entry, parsed.data);
            setLastFailedPrompt(null);
            captureTraining(parsed.data);
            return;
          }
        }

        // Handle set_aesthetic tool result
        if (invocation?.toolName === "set_aesthetic" && invocation?.state === "result") {
          const result = invocation.result as {
            success?: boolean;
            aestheticId?: string;
            message?: string;
          };
          if (result?.success && result?.aestheticId) {
            updateSettings({ aestheticId: result.aestheticId as "noir" | "minimal" });
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

      if (toolPart.state === "output-error") {
        setError(`Tool error: ${toolPart.errorText || "Unknown error"}`);
        continue;
      }

      if (toolPart.state !== "output-available") {
        continue;
      }

      const parsed = a2uiInputSchema.safeParse(toolPart.output);
      if (!parsed.success) {
        setError("Invalid tool output");
        continue;
      }

      const entry = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        label: deriveEvidenceLabel(parsed.data),
        status: deriveEvidenceStatus(parsed.data),
        data: parsed.data,
      };
      processNewEvidence(entry, parsed.data);
      captureTraining(parsed.data);
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

      const entry = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        label: deriveEvidenceLabel(parsed.data),
        status: deriveEvidenceStatus(parsed.data),
        data: parsed.data,
      };
      processNewEvidence(entry, parsed.data);
      captureTraining(parsed.data);
      return;
    }
  }, [captureTraining, messages, processNewEvidence, updateSettings]);

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

  // Read the live surface store's currently-rendered surface. sendV09Prompt
  // clear()s the store at the start of each send, so callers must read this
  // BEFORE sending to capture a baseline / variant snapshot.
  const readActiveSurface = useCallback(() => {
    const surfaceStore = useSurfaceStore.getState();
    const surfaceIds = surfaceStore.getAllSurfaceIds();
    return surfaceIds.length > 0
      ? surfaceStore.getSurface(surfaceIds[surfaceIds.length - 1])
      : undefined;
  }, []);

  // Single v0.9 exchange: pushes the user line, sends the prompt (optionally
  // with a composition variant seed and/or an explicit baseline), mirrors the
  // detective's narration into the chat log, and returns the resulting surface
  // snapshot so callers can capture it as a Take. Reused by the normal send,
  // the Variations picker, and the iteration buttons.
  const runV09Exchange = useCallback(
    async (params: {
      text: string;
      compositionSeed?: number;
      baselineComponents?: SurfaceComponent[];
      logUser?: boolean;
      recordAsBase?: boolean;
    }): Promise<CapturedVariant | undefined> => {
      const { text, compositionSeed, baselineComponents, logUser = true, recordAsBase } = params;
      const stamp = Date.now();
      v09NarrationRef.current = null;
      // Only a genuine new user prompt becomes the "base" that variants re-roll
      // and iterations refine from. Iterations send compounded text but must NOT
      // overwrite the base, or repeated "make it fancier / simpler" would stack
      // contradictory instructions and balloon the prompt each round.
      if (recordAsBase) {
        lastV09PromptRef.current = text;
      }

      if (logUser) {
        setMessages((prev) => [
          ...prev,
          { id: `v09-user-${stamp}`, role: "user", parts: [{ type: "text", text }] },
        ]);
      }
      try {
        await sendV09Prompt(
          text,
          activeProfile?.baseAestheticId ?? settings.aestheticId,
          customSystemPrompt,
          activeProfile?.imageStylePrompt,
          settings.imageModel,
          baselineComponents,
          compositionSeed
        );
        // Prefer the model's real narration; fall back to a varied in-character
        // line if the stream didn't provide one this run.
        const V09_FALLBACK_REPLIES = [
          "Case file's on the board. The evidence speaks for itself — read it and weep.",
          "Pulled the threads together. It's pinned up and waiting. Don't touch the photos.",
          "Filed it. The rain's still coming down, but the board's lit. Take a look.",
          "Another case cracked open on the desk. The details are all there in the evidence.",
          "Wired the report to the board. Cold facts, warm coffee. Your move, detective.",
          "It's all laid out — the leads, the faces, the loose ends. Make of it what you will.",
        ];
        const narrated = (v09NarrationRef.current ?? "") as string;
        const reply = narrated.trim() || V09_FALLBACK_REPLIES[stamp % V09_FALLBACK_REPLIES.length];
        setMessages((prev) => [
          ...prev,
          { id: `v09-asst-${stamp}`, role: "assistant", parts: [{ type: "text", text: reply }] },
        ]);
        // Snapshot the freshly-rendered surface so it can be re-loaded later.
        // Capture the data model alongside the components — list/template
        // children resolve from it, so a restored take needs both to render.
        const completed = readActiveSurface();
        return completed
          ? {
              catalogId: completed.config.catalogId,
              theme: completed.config.theme,
              components: Array.from(completed.components.values()),
              dataModel: completed.dataModel,
            }
          : undefined;
      } catch {
        // The hook surfaces the error in the preview pane; leave the log as-is.
        return undefined;
      }
    },
    [
      sendV09Prompt,
      setMessages,
      readActiveSurface,
      settings.aestheticId,
      settings.imageModel,
      customSystemPrompt,
      activeProfile,
    ]
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

      // Use A2UI v0.9 endpoint when enabled. The v0.9 stream produces UI
      // components plus a `narration` message (captured via onNarration into
      // v09NarrationRef); mirror the exchange into the chat log ourselves so the
      // Interrogation Log stays populated and TTS can read the detective's reply.
      if (useV09 && text) {
        // Don't start a send while a multi-take run is mid-flight: each send
        // clear()s the surface store, which would wipe a variant still
        // streaming. (The single-stream case is already serialized by the hook.)
        if (isGeneratingVariants) {
          return;
        }
        // A normal send is a single take — clear any stale variant picker.
        setVariants([]);
        setActiveVariantIndex(0);
        // Capture the currently-rendered surface BEFORE sending so the model can
        // AMEND the live UI (Update Rules) instead of regenerating from scratch.
        const activeSurface = readActiveSurface();
        const baselineComponents = activeSurface
          ? Array.from(activeSurface.components.values())
          : undefined;
        await runV09Exchange({ text, baselineComponents, recordAsBase: true });
        return;
      }

      return sendMessageWithContext(message, options);
    },
    [
      sendMessageWithContext,
      trackAndSend,
      useV09,
      readActiveSurface,
      runV09Exchange,
      isGeneratingVariants,
    ]
  );

  // Bet 6 — Take 1/2/3. Fire the SAME prompt N times with offset composition
  // seeds and capture each completed surface so the picker can swap between
  // them. Gated behind an explicit button (it is N× latency/cost). Defaults to
  // the most recent v0.9 prompt; offsets the per-preset base seed per take.
  const generateVariants = useCallback(
    async (count = 3) => {
      if (isV09Streaming || isGeneratingVariants) return;
      const text = lastV09PromptRef.current;
      if (!text) return;

      // Variants are alternative takes of the SAME prompt — each must regenerate
      // a full surface from scratch, NOT amend the current one. Passing a
      // baseline would trigger the Update-Rules path and yield a tiny diff (e.g.
      // a lone container) instead of a complete take, so no baseline here.
      const baseSeed = getCompositionSeed(activeProfile?.baseAestheticId ?? settings.aestheticId);

      setIsGeneratingVariants(true);
      setVariants([]);
      setActiveVariantIndex(0);
      try {
        const captured: CapturedVariant[] = [];
        for (let i = 0; i < count; i++) {
          // Log only the first take as a user line; the rest are silent re-rolls.
          const variant = await runV09Exchange({
            text,
            compositionSeed: baseSeed + i,
            logUser: i === 0,
          });
          if (variant) {
            captured.push(variant);
            // Surface progress incrementally so the picker fills in as takes land.
            setVariants([...captured]);
            setActiveVariantIndex(captured.length - 1);
          }
        }
      } finally {
        setIsGeneratingVariants(false);
      }
    },
    [
      isV09Streaming,
      isGeneratingVariants,
      runV09Exchange,
      activeProfile?.baseAestheticId,
      settings.aestheticId,
    ]
  );

  // Load a previously-captured Take back into the live surface store so it
  // becomes the active surface (re-create + repopulate; the store keys by id).
  const selectVariant = useCallback((index: number, list: CapturedVariant[]) => {
    const variant = list[index];
    if (!variant) return;
    const store = useSurfaceStore.getState();
    store.clear();
    const surfaceId = `surface-take-${index + 1}-${Date.now()}`;
    store.createSurface({
      surfaceId,
      catalogId: variant.catalogId,
      theme: variant.theme,
    });
    store.updateComponents(surfaceId, variant.components);
    // Restore the captured data model (root-path replace) so template/list
    // children resolve exactly as they did when the take was generated.
    if (variant.dataModel && Object.keys(variant.dataModel).length > 0) {
      store.setDataModel(surfaceId, "/", variant.dataModel);
    }
    setActiveVariantIndex(index);
  }, []);

  // Bet 6 — iteration actions. Re-send the current evidence (live surface) as
  // the baseline with a canned refinement appended to the last prompt, reusing
  // the already-working baseline-into-prompt flow.
  const iterateSurface = useCallback(
    async (instruction: string) => {
      if (isV09Streaming || isGeneratingVariants) return;
      const activeSurface = readActiveSurface();
      const baselineComponents = activeSurface
        ? Array.from(activeSurface.components.values())
        : undefined;
      if (!baselineComponents) return;
      // A fresh iteration invalidates the variant picker.
      setVariants([]);
      setActiveVariantIndex(0);
      const base = lastV09PromptRef.current;
      const text = base ? `${base}\n\n${instruction}` : instruction;
      trackAndSend(instruction);
      await runV09Exchange({ text, baselineComponents });
    },
    [isV09Streaming, isGeneratingVariants, readActiveSurface, runV09Exchange, trackAndSend]
  );

  const handleSelectVariant = useCallback(
    (index: number) => selectVariant(index, variants),
    [selectVariant, variants]
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
    <>
      <DeskLayout
        showEditor={layout.showEditor}
        showSidebar={layout.showSidebar}
        showEject={layout.showEject}
        showDictaphone={layout.showDictaphone}
        showTemplates={showTemplates}
        showTraining={showTraining}
        editorWidth={layout.editorWidth}
        sidebarWidth={layout.sidebarWidth}
        ambient={activeAmbient}
        soundEnabled={settings.soundEnabled}
        musicEnabled={settings.musicEnabled}
        musicVolume={activeMusicVolume}
        customMusicUrl={activeCustomMusicUrl}
        aestheticId={activeProfile?.baseAestheticId ?? settings.aestheticId}
        customProfileId={activeProfile?.id}
        onToggleEditor={() => updateLayout({ showEditor: !layout.showEditor })}
        onToggleSidebar={() => updateLayout({ showSidebar: !layout.showSidebar })}
        onToggleEject={() => updateLayout({ showEject: !layout.showEject })}
        onToggleDictaphone={() => updateLayout({ showDictaphone: !layout.showDictaphone })}
        onToggleTemplates={() => setShowTemplates(!showTemplates)}
        onToggleTraining={() => setShowTraining(!showTraining)}
        onResizeEditor={(nextWidth) => updateLayout({ editorWidth: nextWidth })}
        onResizeSidebar={(nextWidth) => updateLayout({ sidebarWidth: nextWidth })}
        templatePanel={
          <TemplatePanel onSelect={handleSelectTemplate} onClose={() => setShowTemplates(false)} />
        }
        trainingPanel={<TrainingDataPanel onClose={() => setShowTraining(false)} />}
        dictaphonePanel={
          <NoirErrorBoundary>
            <DictaphonePanel
              tapes={settings.generatedTapes ?? []}
              onDeleteTape={(hash) => {
                const updated = (settings.generatedTapes ?? []).filter((t) => t.hash !== hash);
                updateSettings({ generatedTapes: updated });
              }}
              onClose={() => updateLayout({ showDictaphone: false })}
            />
          </NoirErrorBoundary>
        }
        ejectPanel={
          <NoirErrorBoundary>
            <EjectPanel evidence={evidence} onClose={() => updateLayout({ showEject: false })} />
          </NoirErrorBoundary>
        }
        editor={
          <div className="h-full min-h-0 flex flex-col">
            <textarea
              aria-label="Edit JSON case file"
              className="w-full flex-1 min-h-0 bg-[var(--aesthetic-background)]/30 text-[var(--aesthetic-text)]/95 font-mono text-sm leading-relaxed resize-none focus:outline-none p-3 border border-[var(--aesthetic-border)]/30 rounded-sm shadow-inner"
              id="json-editor"
              name="json-editor"
              value={json}
              onChange={handleEditorChange}
              spellCheck={false}
            />
            {error && (
              <div className="text-[var(--aesthetic-error)] font-typewriter text-xs mt-2 border-t border-[var(--aesthetic-error)] pt-2">
                Error: {error}
              </div>
            )}
          </div>
        }
        preview={
          <NoirErrorBoundary>
            {isLoading ? (
              <EvidenceSkeleton />
            ) : error || v09Error ? (
              <div className="max-w-md space-y-4">
                <div className="bg-[var(--aesthetic-error)]/10 border-2 border-[var(--aesthetic-error)] p-4 rounded-sm">
                  <h3 className="text-[var(--aesthetic-error)] font-typewriter font-bold mb-2">
                    CASE FILE ERROR
                  </h3>
                  <p className="text-[var(--aesthetic-error)]/80 font-mono text-xs">
                    {error || v09Error?.message}
                  </p>
                </div>
                {lastFailedPrompt && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="px-4 py-2 bg-[var(--aesthetic-accent)]/20 border border-[var(--aesthetic-accent)]/50 text-[var(--aesthetic-accent)] font-typewriter text-xs uppercase tracking-wider rounded-sm hover:bg-[var(--aesthetic-accent)]/30 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
                    >
                      Retry Last Command
                    </button>
                    <span className="text-[var(--aesthetic-text)]/50 font-mono text-xs truncate max-w-[200px]">
                      &ldquo;{lastFailedPrompt}&rdquo;
                    </span>
                  </div>
                )}
              </div>
            ) : useV09 ? (
              <div className="flex flex-col gap-3">
                <A2UIVariantControls
                  variants={variants.length}
                  activeIndex={activeVariantIndex}
                  isGenerating={isGeneratingVariants}
                  isStreaming={isV09Streaming}
                  canIterate={
                    !isV09Streaming && !isGeneratingVariants && !!lastV09PromptRef.current
                  }
                  onGenerateVariants={() => generateVariants(3)}
                  onSelectVariant={handleSelectVariant}
                  onIterate={iterateSurface}
                />
                <A2UIv09Preview />
              </div>
            ) : evidence ? (
              <EvidenceBoard
                entries={evidenceHistory}
                activeId={activeEvidenceId}
                onSelect={handleSelectEvidence}
                fallbackEvidence={evidence}
              />
            ) : (
              // No evidence yet (true first run, after removing the seed): show
              // the inviting case-board empty state instead of an alarm.
              <CaseBoardEmptyState onSelectPrompt={(text) => handleSendMessage({ text })} />
            )}
          </NoirErrorBoundary>
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
            ambient={activeAmbient}
            modelConfig={modelConfig}
            useA2UIv09={useV09}
            onUpdateSettings={updateSettings}
            onModelConfigChange={(config) => updateSettings({ modelConfig: config })}
            onToggleCollapse={() => updateLayout({ showSidebar: false })}
            inputRef={chatInputRef}
            generatedTapes={settings.generatedTapes}
            onOpenCustomization={() => setShowCustomization(true)}
          />
        }
      />
      <CustomizationPanel isOpen={showCustomization} onClose={() => setShowCustomization(false)} />
    </>
  );
}
