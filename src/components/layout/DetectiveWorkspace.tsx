"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { DeskLayout } from "./DeskLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { CaseBoardEmptyState } from "@/components/board/CaseBoardEmptyState";
import { CaseArchive } from "@/components/board/CaseArchive";
import type { ArchivedCase } from "@/lib/store/useA2UIStore";
import { EjectPanel } from "@/components/eject/EjectPanel";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { TemplatePanel } from "@/components/templates/TemplatePanel";
import { EvidenceSkeleton } from "@/components/board/EvidenceSkeleton";
import { NoirErrorBoundary } from "@/components/shared/NoirErrorBoundary";
import { DictaphonePanel } from "@/components/noir/DictaphonePanel";
import type { A2UIInput } from "@/lib/protocol/schema";
// A2UI v0.9 imports
import { useA2UIStream } from "@/lib/a2ui/hooks/useA2UIStream";
import { useSurfaceStore } from "@/lib/a2ui/store/useSurfaceStore";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import type { AmbientIntensity } from "@/lib/store/types";
import { getCompositionSeed } from "@/lib/aesthetic/identity";
import { A2UIv09Preview } from "@/components/a2ui/A2UIv09Preview";
import { A2UIVariantControls } from "@/components/a2ui/A2UIVariantControls";
import { CustomizationPanel } from "@/components/settings/CustomizationPanel";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";
import { useWorldSwitch } from "./useWorldSwitch";
import { emitSemanticAudioEvent } from "@/lib/audio/audioEvents";
import { useLiveWire } from "@/lib/hooks/useLiveWire";

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
 * Per-world fallback narration, keyed by base aesthetic id. Used only when the
 * model's stream didn't carry its own narration this run. Defined locally (the
 * aesthetic definitions/types are owned elsewhere) so cyber-fixer / nostromo /
 * gothic / grand-hotel / minimal each speak in character instead of leaking
 * noir everywhere. Custom profiles resolve through their base id; an unknown id
 * falls back to noir.
 */
const V09_FALLBACK_REPLIES_BY_WORLD: Record<string, string[]> = {
  noir: [
    "Case file's on the board. The evidence speaks for itself — read it and weep.",
    "Pulled the threads together. It's pinned up and waiting. Don't touch the photos.",
    "Filed it. The rain's still coming down, but the board's lit. Take a look.",
    "Another case cracked open on the desk. The details are all there in the evidence.",
    "Wired the report to the board. Cold facts, warm coffee. Your move, detective.",
    "It's all laid out — the leads, the faces, the loose ends. Make of it what you will.",
  ],
  minimal: [
    "Done. The layout is rendered above.",
    "Generated. Review the result when ready.",
    "Output ready. Everything is in place.",
    "Complete. The composition is on screen.",
  ],
  "cyber-fixer": [
    "Job's done, choom. The data's jacked into the board — go check it.",
    "Wired and live. Your payload's on the deck, no ICE tripped.",
    "Decked it clean. The output's glowing right where you want it.",
    "Run's complete. The grid's lit — eyes up, the intel's all there.",
  ],
  "nostromo-console": [
    "PROCESSING COMPLETE. OUTPUT RENDERED TO MAIN DISPLAY.",
    "TASK FINISHED. DATA AVAILABLE FOR REVIEW.",
    "ANALYSIS CONCLUDED. RESULTS ON SCREEN.",
    "REQUEST EXECUTED. STANDING BY FOR FURTHER INSTRUCTIONS.",
  ],
  "gothic-manor": [
    "The manuscript is complete, and its secrets lie before you upon the page.",
    "It is done. The account has been set down — read it by candlelight, if you dare.",
    "The pages have been inscribed. Whatever truth they hold now waits for your eyes.",
    "Composed and sealed. The chronicle rests above; tread softly through its lines.",
  ],
  "grand-hotel": [
    "Your arrangement is ready, and laid out with the utmost care above.",
    "It is prepared. Everything has been set in its proper place for you.",
    "Done, with pleasure. The composition awaits your gracious review.",
    "Presented and complete — may it be entirely to your satisfaction.",
  ],
};

/** Pick a world's fallback line set by aesthetic id (defaults to noir). */
function getFallbackReplies(aestheticId: string | undefined): string[] {
  if (aestheticId && V09_FALLBACK_REPLIES_BY_WORLD[aestheticId]) {
    return V09_FALLBACK_REPLIES_BY_WORLD[aestheticId];
  }
  return V09_FALLBACK_REPLIES_BY_WORLD.noir;
}

/** A chat-log line. The v0.9 path drives the log by hand (it is not served by
 * an SDK), so this is a plain local message shape, not a UIMessage. */
interface ChatLogMessage {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
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
  const [showCustomization, setShowCustomization] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  // The interrogation-log messages. The v0.9 stream is a one-shot POST (no SDK
  // chat transport), so we drive the log ourselves: each exchange pushes a user
  // line and the detective's narrated reply.
  const [messages, setMessages] = useState<ChatLogMessage[]>([]);
  // Bet 6: Take 1/2/3 variants. Each completed generation is snapshotted here so
  // the picker can swap which take is shown without re-calling the model. Empty
  // until the user explicitly requests variations or iterates.
  const [variants, setVariants] = useState<CapturedVariant[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  // The live wire: when on, the board's numeric stats/dashboards tick with a
  // random walk through the real store update path.
  const [liveWire, setLiveWire] = useState(false);
  useLiveWire(liveWire);
  // The most recent v0.9 prompt, so iteration actions ("fancier"/"simplify"/
  // "different angle") can re-issue it with a canned refinement appended.
  const lastV09PromptRef = useRef<string | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const {
    evidence,
    setEvidence,
    settings,
    updateSettings,
    layout,
    updateLayout,
    pushUndoState,
    undo,
    redo,
    addPrompt,
    archive,
    addToArchive,
    removeFromArchive,
  } = useA2UIStore();

  const loadProfiles = useCustomProfileStore((state) => state.loadProfiles);
  const customProfiles = useCustomProfileStore((state) => state.customProfiles);
  const activeProfile = useCustomProfileStore((state) => {
    if (!state.activeCustomProfileId) return null;
    return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
  });

  // World-switch choreography: the STORE (and therefore prompts/personas)
  // changes instantly, but the visible desk lags through strike-the-set →
  // commit (View Transition / diegetic scene) → re-deal. See useWorldSwitch.
  const {
    displayAestheticId,
    displayCustomProfileId,
    exitingEntrance,
    worldEpoch,
    consumeArrival,
  } = useWorldSwitch(activeProfile?.baseAestheticId ?? settings.aestheticId, activeProfile?.id);

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

    // A custom profile's effects.{rain,fog,crackle} (0–1) must actually drive the
    // live overlays, not just persist. The overlays share one low|medium|high
    // `intensity` enum + per-effect `enabled` flags, so map the continuous values
    // onto both: a defined 0 turns the effect off; otherwise the strongest of the
    // defined effects sets the shared intensity bucket. Undefined effects inherit
    // the base session ambient untouched.
    const fx = activeProfile.effects;
    const toEnum = (v: number): AmbientIntensity =>
      v >= 0.66 ? "high" : v >= 0.33 ? "medium" : "low";
    const definedFx = [fx?.rain, fx?.fog, fx?.crackle].filter(
      (v): v is number => typeof v === "number"
    );
    const intensity = definedFx.length > 0 ? toEnum(Math.max(...definedFx)) : base.intensity;

    return {
      ...base,
      intensity,
      rainEnabled: typeof fx?.rain === "number" ? fx.rain > 0 : base.rainEnabled,
      fogEnabled: typeof fx?.fog === "number" ? fx.fog > 0 : base.fogEnabled,
      crackleEnabled: typeof fx?.crackle === "number" ? fx.crackle > 0 : base.crackleEnabled,
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
    onSource: (tree) => {
      // The resolved legacy A2UI tree (image prompts already swapped for real
      // URLs) is the high-fidelity shape the eject/export feature consumes.
      // Mirror it into `evidence` + the JSON editor so Eject Mode exports exactly
      // what was generated, without reverse-engineering the flat catalog.
      if (tree && typeof tree === "object") {
        const data = tree as A2UIInput;
        setEvidence(data);
        setJson(JSON.stringify(data, null, 2));
      }
    },
    onComplete: () => {
      setLastFailedPrompt(null);
    },
    onError: (err) => {
      console.error("[A2UI v0.9] Error:", err);
      setError(err.message);
    },
  });

  const isLoading = isV09Streaming;

  const uiMessages = useMemo(
    () =>
      messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.parts.map((part) => part.text).join(""),
      })),
    [messages]
  );

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
      addPrompt(text);
      pushUndoState();
      setLastFailedPrompt(text);
      setError(null);
    },
    [addPrompt, pushUndoState]
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
        // line (per active world) if the stream didn't provide one this run.
        const fallbacks = getFallbackReplies(
          activeProfile?.baseAestheticId ?? settings.aestheticId
        );
        const narrated = (v09NarrationRef.current ?? "") as string;
        const reply = narrated.trim() || fallbacks[stamp % fallbacks.length];
        setMessages((prev) => [
          ...prev,
          { id: `v09-asst-${stamp}`, role: "assistant", parts: [{ type: "text", text: reply }] },
        ]);
        // First generation since arriving in a world: the world acknowledges
        // you walked in (the preset's dramatic sting + lightning, once).
        if (consumeArrival()) {
          emitSemanticAudioEvent("dramatic.beat");
        }
        // Snapshot the freshly-rendered surface so it can be re-loaded later.
        // Capture the data model alongside the components — list/template
        // children resolve from it, so a restored take needs both to render.
        const completed = readActiveSurface();
        if (!completed) return undefined;
        const snapshot: CapturedVariant = {
          catalogId: completed.config.catalogId,
          theme: completed.config.theme,
          components: Array.from(completed.components.values()),
          dataModel: completed.dataModel,
        };
        // Pin a genuine new generation to the persisted Case Archive. Gated on
        // recordAsBase so silent variant re-rolls don't flood the strip with
        // near-duplicates of one prompt.
        if (recordAsBase) {
          addToArchive({
            prompt: text,
            aestheticId: activeProfile?.id ?? settings.aestheticId ?? "noir",
            catalogId: snapshot.catalogId,
            theme: snapshot.theme,
            components: snapshot.components,
            dataModel: snapshot.dataModel,
          });
        }
        return snapshot;
      } catch {
        // The hook surfaces the error in the preview pane; leave the log as-is.
        return undefined;
      }
    },
    [
      sendV09Prompt,
      readActiveSurface,
      consumeArrival,
      addToArchive,
      settings.aestheticId,
      settings.imageModel,
      customSystemPrompt,
      activeProfile,
    ]
  );

  // Send a chat prompt. The v0.9 stream produces UI components plus a
  // `narration` message (captured via onNarration into v09NarrationRef); we
  // mirror the exchange into the chat log ourselves so the Interrogation Log
  // stays populated and TTS can read the detective's reply.
  const handleSendMessage = useCallback(
    async (message?: { text: string }) => {
      const text = message?.text ?? "";
      if (!text) return;
      trackAndSend(text);

      // Don't start a send while a multi-take run is mid-flight: each send
      // clear()s the surface store, which would wipe a variant still streaming.
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
    },
    [trackAndSend, readActiveSurface, runV09Exchange, isGeneratingVariants]
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

  // Restore an archived case into the live surface. Reuses the same
  // create→update→setDataModel restore path as the variant picker, so a pinned
  // case re-renders exactly as generated. The current live generation is itself
  // already archived, so swapping it in is non-destructive of history. Ensures
  // the preview leaves the empty state by seeding a chat line if the log's bare.
  const restoreArchivedCase = useCallback((entry: ArchivedCase) => {
    const store = useSurfaceStore.getState();
    store.clear();
    const surfaceId = `surface-archive-${entry.id}-${Date.now()}`;
    store.createSurface({
      surfaceId,
      catalogId: entry.catalogId,
      theme: entry.theme,
    });
    store.updateComponents(surfaceId, entry.components);
    if (entry.dataModel && Object.keys(entry.dataModel).length > 0) {
      store.setDataModel(surfaceId, "/", entry.dataModel);
    }
    // A restored take isn't part of the live variant run; clear that picker.
    setVariants([]);
    setActiveVariantIndex(0);
    lastV09PromptRef.current = entry.prompt;
    // Drop a log marker so the preview shows the surface (not the empty state)
    // and the user can see which case was pulled from the files.
    setMessages((prev) => [
      ...prev,
      {
        id: `archive-restore-${entry.id}-${Date.now()}`,
        role: "assistant",
        parts: [
          { type: "text", text: `Pulled the file: "${entry.title}". It's back on the board.` },
        ],
      },
    ]);
    setShowArchive(false);
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
      handleSendMessage({ text: lastFailedPrompt });
    }
  }, [lastFailedPrompt, handleSendMessage]);

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
        showArchive={showArchive}
        editorWidth={layout.editorWidth}
        sidebarWidth={layout.sidebarWidth}
        ambient={activeAmbient}
        soundEnabled={settings.soundEnabled}
        musicEnabled={settings.musicEnabled}
        liveScoreEnabled={settings.liveScoreEnabled}
        musicVolume={activeMusicVolume}
        customMusicUrl={activeCustomMusicUrl}
        aestheticId={displayAestheticId}
        customProfileId={displayCustomProfileId}
        worldEpoch={worldEpoch}
        exitingEntrance={exitingEntrance}
        onToggleEditor={() => updateLayout({ showEditor: !layout.showEditor })}
        onToggleSidebar={() => updateLayout({ showSidebar: !layout.showSidebar })}
        onToggleEject={() => updateLayout({ showEject: !layout.showEject })}
        onToggleDictaphone={() => updateLayout({ showDictaphone: !layout.showDictaphone })}
        onToggleTemplates={() => setShowTemplates(!showTemplates)}
        onToggleArchive={() => setShowArchive((open) => !open)}
        onResizeEditor={(nextWidth) => updateLayout({ editorWidth: nextWidth })}
        onResizeSidebar={(nextWidth) => updateLayout({ sidebarWidth: nextWidth })}
        templatePanel={
          <TemplatePanel onSelect={handleSelectTemplate} onClose={() => setShowTemplates(false)} />
        }
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
        caseArchive={
          <CaseArchive
            cases={archive}
            isOpen={showArchive}
            onClose={() => setShowArchive(false)}
            onRestore={restoreArchivedCase}
            onRemove={removeFromArchive}
          />
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
            ) : (
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
                  liveWire={liveWire}
                  onToggleLiveWire={() => setLiveWire((on) => !on)}
                />
                {messages.length === 0 ? (
                  // True first run: show the inviting case-board empty state and
                  // its prompt picker instead of the bare "awaiting lead" surface.
                  <CaseBoardEmptyState onSelectPrompt={(text) => handleSendMessage({ text })} />
                ) : (
                  <A2UIv09Preview />
                )}
              </div>
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
