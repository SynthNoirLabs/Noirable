import React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  Code,
  LayoutTemplate,
  Disc,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NoirEffects } from "@/components/noir/NoirEffects";
import { formatShortcut } from "@/lib/hooks/useKeyboardShortcuts";
import type { AmbientSettings, AestheticId } from "@/lib/store/useA2UIStore";
import { getAestheticCopy, getEffectsProfile, getStyleTokens } from "@/lib/aesthetic/identity";
import { ResizeHandle } from "./ResizeHandle";

interface DeskLayoutProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  sidebar?: React.ReactNode;
  ejectPanel?: React.ReactNode;
  templatePanel?: React.ReactNode;
  dictaphonePanel?: React.ReactNode;
  showEditor?: boolean;
  showSidebar?: boolean;
  showEject?: boolean;
  showDictaphone?: boolean;
  showTemplates?: boolean;
  onToggleDictaphone?: () => void;
  editorWidth?: number;
  sidebarWidth?: number;
  onToggleEditor?: () => void;
  onToggleSidebar?: () => void;
  onToggleEject?: () => void;
  onToggleTemplates?: () => void;
  onResizeEditor?: (nextWidth: number) => void;
  onResizeSidebar?: (nextWidth: number) => void;
  ambient?: AmbientSettings;
  soundEnabled?: boolean;
  musicEnabled?: boolean;
  musicVolume?: number;
  /** Base aesthetic to inherit (built-in id), drives CSS vars + audio pack */
  aestheticId?: AestheticId;
  /** Active custom profile id, if any — scopes injected override CSS */
  customProfileId?: string;
  customMusicUrl?: string;
  className?: string;
}

export function DeskLayout({
  editor,
  preview,
  sidebar,
  ejectPanel,
  templatePanel,
  dictaphonePanel,
  showEditor = true,
  showSidebar = true,
  showEject = false,
  showDictaphone = false,
  showTemplates = false,
  editorWidth = 300,
  sidebarWidth = 360,
  onToggleEditor,
  onToggleSidebar,
  onToggleEject,
  onToggleTemplates,
  onToggleDictaphone,
  onResizeEditor,
  onResizeSidebar,
  ambient,
  soundEnabled,
  musicEnabled,
  musicVolume,
  customMusicUrl,
  aestheticId,
  customProfileId,
  className,
}: DeskLayoutProps) {
  const isEditorVisible = showEditor;
  const isSidebarVisible = Boolean(sidebar) && showSidebar;
  const isEjectVisible = Boolean(ejectPanel) && showEject;
  const isTemplatesVisible = Boolean(templatePanel) && showTemplates;
  const isDictaphoneVisible = Boolean(dictaphonePanel) && showDictaphone;
  const ejectShortcut = formatShortcut(["mod", "e"]);
  // `persist` may rehydrate older saved settings that don't include newly added fields.
  // Merge with defaults to avoid undefined values.
  const ambientSettings: AmbientSettings = {
    rainEnabled: true,
    rainVolume: 1,
    fogEnabled: true,
    intensity: "medium",
    crackleEnabled: false,
    crackleVolume: 0.35,
    ...(ambient ?? {}),
  };
  const soundSetting = soundEnabled ?? true;
  const musicSetting = musicEnabled ?? false;
  // Per-preset chrome copy so the workspace/editor labels read as the active
  // world (e.g. "MAIN DISPLAY" on nostromo) instead of always-noir. Resolved
  // from the base aesthetic id; custom profiles inherit their base preset copy.
  const copy = getAestheticCopy(aestheticId);
  // Visual style tokens + material/screen effects for the active world. Emitted
  // as data-effect-* attributes + CSS custom props on the root so globals.css
  // can light up the right card material (paper/parchment/hologram/wireframe/
  // flat) and screen treatment (scanlines/phosphor) without per-aesthetic
  // duplication. Custom profiles inherit their base preset's tokens/effects via
  // the already-resolved base `aestheticId`.
  const styleTokens = getStyleTokens(aestheticId);
  const effects = getEffectsProfile(aestheticId);

  const getGridColsClass = () => {
    const cols: string[] = [];
    if (isEditorVisible) cols.push("var(--editor-w)");
    if (isTemplatesVisible) cols.push("280px");
    cols.push("1fr");
    if (isDictaphoneVisible) cols.push("380px");
    if (isEjectVisible) cols.push("400px");
    // Sidebar is now fixed position, not in grid - but reserve space with margin
    return `grid-cols-[${cols.join("_")}]`;
  };

  const gridColsClass = getGridColsClass();

  return (
    <div
      data-testid="desk-layout"
      data-aesthetic={aestheticId ?? "noir"}
      data-custom-profile={customProfileId || undefined}
      data-effect-card={effects.card}
      data-effect-stamp={effects.stamp}
      data-effect-screen={effects.screen}
      className={cn(
        "min-h-screen grid gap-0 bg-[var(--aesthetic-surface)] text-[var(--aesthetic-text)] relative isolate overflow-hidden film-grain vignette",
        gridColsClass,
        className
      )}
      style={
        {
          "--editor-w": `${editorWidth}px`,
          "--sidebar-w": `${sidebarWidth}px`,
          // Material/shape tokens consumed by globals.css data-effect-* rules:
          // card radius and accent-glow bloom scale. Custom profiles inherit
          // their base preset's values via the resolved base `aestheticId`.
          "--aesthetic-radius": styleTokens.radius,
          "--aesthetic-bloom": String(effects.bloom),
          // Reserve space for fixed sidebar
          marginRight: isSidebarVisible ? `${sidebarWidth}px` : undefined,
        } as React.CSSProperties
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--aesthetic-background)] focus:border focus:border-[var(--aesthetic-accent)] focus:text-[var(--aesthetic-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--aesthetic-accent)] font-typewriter text-sm uppercase tracking-widest rounded-sm"
      >
        Skip to main content
      </a>
      <NoirEffects
        ambient={ambientSettings}
        soundEnabled={soundSetting}
        musicEnabled={musicSetting}
        musicVolume={musicVolume}
        customMusicUrl={customMusicUrl}
        aestheticId={aestheticId}
      />
      <div
        data-testid="noir-rain-bg"
        className="absolute inset-0 bg-cover bg-top opacity-40 contrast-110 saturate-[0.85] brightness-90 pointer-events-none z-0"
        style={{ backgroundImage: "var(--aesthetic-bg-image)" }}
        aria-hidden="true"
      />
      {/* Vertical readability gradient: dark header + lit mid-field + dark
          lower gutter. color-mix keeps it theme-aware (works in the light
          "minimal" aesthetic too). */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(to bottom, " +
            "color-mix(in srgb, var(--aesthetic-surface) 92%, transparent) 0%, " +
            "color-mix(in srgb, var(--aesthetic-surface) 45%, transparent) 38%, " +
            "color-mix(in srgb, var(--aesthetic-surface) 42%, transparent) 62%, " +
            "color-mix(in srgb, var(--aesthetic-surface) 88%, transparent) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Desk-lamp rim glow, biased toward the evidence-board side so it reads
          in the default 3-pane layout. color-mix keeps it theme-aware (the
          accent replaces the old hardcoded amber), and the stop opacities are
          scaled by --aesthetic-glow-strength so minimal (0) goes dark while
          cyber-fixer (1.4) glows harder. Noir's strength is 1, so 10%/4% of the
          #ffbf00 accent matches the previous rgba(255,191,0) values. */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 50% at 38% 90%, " +
            "color-mix(in srgb, var(--aesthetic-accent) calc(10% * var(--aesthetic-glow-strength)), transparent), " +
            "color-mix(in srgb, var(--aesthetic-accent) calc(4% * var(--aesthetic-glow-strength)), transparent) 40%, " +
            "transparent 72%)",
        }}
      />
      {!isEditorVisible && onToggleEditor && (
        <button
          type="button"
          onClick={onToggleEditor}
          aria-label="Show editor"
          title="Show editor"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-[var(--aesthetic-background)]/70 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/80 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50 transition-colors p-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
      {sidebar && !isSidebarVisible && onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Show sidebar"
          title="Show sidebar"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-[var(--aesthetic-background)]/70 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/80 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50 transition-colors p-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      )}
      {/* Editor Pane (Left) */}
      {isEditorVisible && (
        <div
          data-testid="editor-pane"
          className="border-r border-[var(--aesthetic-border)]/30 p-4 overflow-hidden bg-[var(--aesthetic-background)]/50 relative z-10 flex flex-col min-h-0"
        >
          {onResizeEditor && (
            <ResizeHandle
              position="right"
              size={editorWidth}
              min={200}
              max={360}
              defaultSize={300}
              onChange={onResizeEditor}
            />
          )}
          <div
            data-testid="noir-case-file"
            className="absolute inset-0 bg-[length:75%] bg-left-bottom bg-no-repeat opacity-[0.07] pointer-events-none"
            style={{ backgroundImage: "var(--aesthetic-case-file-image)" }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col flex-1 min-h-0">
            <div className="mb-4 border-b border-[var(--aesthetic-border)]/20 pb-2 flex items-center justify-between gap-2">
              <h2 className="font-typewriter text-sm text-[var(--aesthetic-text)]/70">
                {copy.editorTitle}
              </h2>
              {onToggleEditor && (
                <button
                  type="button"
                  onClick={onToggleEditor}
                  aria-label="Hide editor"
                  title="Hide editor"
                  className="text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-accent)] transition-colors p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0">{editor}</div>
          </div>
        </div>
      )}

      {/* Template Panel */}
      {isTemplatesVisible && templatePanel && (
        <div className="h-full overflow-hidden border-r border-[var(--aesthetic-border)]/20 relative z-10">
          {templatePanel}
        </div>
      )}

      <div
        id="main-content"
        data-testid="evidence-board"
        className="bg-venetian relative flex flex-col min-h-screen z-10"
        tabIndex={-1}
      >
        <div className="sticky top-0 z-20 px-6 py-3 bg-[var(--aesthetic-background)]/30 border-b border-[var(--aesthetic-border)]/20 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-typewriter text-xs text-[var(--aesthetic-accent)]/60 uppercase tracking-[0.3em]">
              {copy.workspaceTitle}
            </span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {onToggleTemplates && (
                <button
                  type="button"
                  onClick={onToggleTemplates}
                  aria-label={showTemplates ? "Hide templates" : "Show templates"}
                  title={showTemplates ? "Hide templates" : "Browse templates"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                    showTemplates
                      ? "bg-[var(--aesthetic-accent)]/20 border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)]"
                      : "bg-[var(--aesthetic-background)]/50 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
                  )}
                >
                  <LayoutTemplate className="w-3 h-3" />
                  Templates
                </button>
              )}
              {onToggleEject && (
                <button
                  type="button"
                  onClick={onToggleEject}
                  aria-label={showEject ? "Hide code export" : "Show code export"}
                  title={showEject ? "Hide code export" : `Export to code (${ejectShortcut})`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                    showEject
                      ? "bg-[var(--aesthetic-accent)]/20 border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)]"
                      : "bg-[var(--aesthetic-background)]/50 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
                  )}
                >
                  <Code className="w-3 h-3" />
                  Eject
                </button>
              )}
              {onToggleDictaphone && (
                <button
                  type="button"
                  onClick={onToggleDictaphone}
                  aria-label={showDictaphone ? "Hide dictaphone log" : "Show dictaphone log"}
                  title={showDictaphone ? "Hide dictaphone log" : "Open dictaphone tape recorder"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
                    showDictaphone
                      ? "bg-[var(--aesthetic-accent)]/20 border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)]"
                      : "bg-[var(--aesthetic-background)]/50 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
                  )}
                >
                  <Disc
                    className={cn("w-3 h-3", showDictaphone && "animate-spin")}
                    style={{ animationDuration: "3s" }}
                  />
                  Dictaphone
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-8 flex flex-col items-center justify-start">
          {/* Constrain the generated surface to a per-aesthetic measure so it
              reads as a composed layout instead of stretching full-width into
              empty desk space (long lines tire the eye). The width is a CSS var
              per [data-aesthetic] in globals.css; mx-auto keeps it centered and
              w-full lets it shrink on narrow panes. */}
          <div className="mx-auto w-full max-w-[var(--aesthetic-max-width,72rem)]">{preview}</div>
        </div>
      </div>

      {isDictaphoneVisible && dictaphonePanel && (
        <div className="h-full overflow-hidden border-l border-[var(--aesthetic-border)]/20 relative z-10">
          {dictaphonePanel}
        </div>
      )}

      {isEjectVisible && ejectPanel && (
        <div className="h-full overflow-hidden relative z-10">{ejectPanel}</div>
      )}

      {/* Sidebar (Right) - Fixed position to follow scroll */}
      {isSidebarVisible && (
        <div
          data-testid="chat-sidebar"
          className="fixed top-0 right-0 h-screen overflow-hidden border-l border-[var(--aesthetic-border)]/20 bg-[var(--aesthetic-background)]/80 z-30"
          style={{ width: `${sidebarWidth}px` }}
        >
          {onResizeSidebar && (
            <ResizeHandle
              position="left"
              size={sidebarWidth}
              min={260}
              max={520}
              defaultSize={360}
              onChange={onResizeSidebar}
            />
          )}
          {sidebar}
        </div>
      )}
    </div>
  );
}
