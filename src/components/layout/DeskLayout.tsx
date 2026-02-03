import React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  Code,
  LayoutTemplate,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NoirEffects } from "@/components/noir/NoirEffects";
import { formatShortcut } from "@/lib/hooks/useKeyboardShortcuts";
import type { AmbientSettings, AestheticId } from "@/lib/store/useA2UIStore";
import { ResizeHandle } from "./ResizeHandle";

interface DeskLayoutProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  sidebar?: React.ReactNode;
  ejectPanel?: React.ReactNode;
  templatePanel?: React.ReactNode;
  trainingPanel?: React.ReactNode;
  showEditor?: boolean;
  showSidebar?: boolean;
  showEject?: boolean;
  showTemplates?: boolean;
  showTraining?: boolean;
  editorWidth?: number;
  sidebarWidth?: number;
  onToggleEditor?: () => void;
  onToggleSidebar?: () => void;
  onToggleEject?: () => void;
  onToggleTemplates?: () => void;
  onToggleTraining?: () => void;
  onResizeEditor?: (nextWidth: number) => void;
  onResizeSidebar?: (nextWidth: number) => void;
  ambient?: AmbientSettings;
  soundEnabled?: boolean;
  musicEnabled?: boolean;
  /** Active aesthetic profile ID */
  aestheticId?: AestheticId;
  className?: string;
}

export function DeskLayout({
  editor,
  preview,
  sidebar,
  ejectPanel,
  templatePanel,
  trainingPanel,
  showEditor = true,
  showSidebar = true,
  showEject = false,
  showTemplates = false,
  showTraining = false,
  editorWidth = 300,
  sidebarWidth = 360,
  onToggleEditor,
  onToggleSidebar,
  onToggleEject,
  onToggleTemplates,
  onToggleTraining,
  onResizeEditor,
  onResizeSidebar,
  ambient,
  soundEnabled,
  musicEnabled,
  aestheticId,
  className,
}: DeskLayoutProps) {
  const isEditorVisible = showEditor;
  const isSidebarVisible = Boolean(sidebar) && showSidebar;
  const isEjectVisible = Boolean(ejectPanel) && showEject;
  const isTemplatesVisible = Boolean(templatePanel) && showTemplates;
  const isTrainingVisible = Boolean(trainingPanel) && showTraining;
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

  const getGridColsClass = () => {
    const cols: string[] = [];
    if (isEditorVisible) cols.push("var(--editor-w)");
    if (isTemplatesVisible) cols.push("280px");
    cols.push("1fr");
    if (isEjectVisible) cols.push("400px");
    if (isTrainingVisible) cols.push("420px");
    // Sidebar is now fixed position, not in grid - but reserve space with margin
    return `grid-cols-[${cols.join("_")}]`;
  };

  const gridColsClass = getGridColsClass();

  return (
    <div
      data-testid="desk-layout"
      data-aesthetic={aestheticId ?? "noir"}
      className={cn(
        "min-h-screen grid gap-0 bg-[var(--aesthetic-surface)] text-[var(--aesthetic-text)] relative isolate overflow-hidden film-grain vignette",
        gridColsClass,
        className
      )}
      style={
        {
          "--editor-w": `${editorWidth}px`,
          "--sidebar-w": `${sidebarWidth}px`,
          // Reserve space for fixed sidebar
          marginRight: isSidebarVisible ? `${sidebarWidth}px` : undefined,
        } as React.CSSProperties
      }
    >
      <NoirEffects
        ambient={ambientSettings}
        soundEnabled={soundSetting}
        musicEnabled={musicSetting}
        aestheticId={aestheticId}
      />
      <div
        data-testid="noir-rain-bg"
        className="absolute inset-0 bg-[url('/assets/noir/rainy-bg.jpg')] bg-cover bg-top opacity-15 grayscale contrast-125 pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[var(--aesthetic-surface)]/80 pointer-events-none z-0"
        aria-hidden="true"
      />
      {!isEditorVisible && onToggleEditor && (
        <button
          type="button"
          onClick={onToggleEditor}
          aria-label="Show editor"
          title="Show editor"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-[var(--aesthetic-background)]/70 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/80 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50 transition-colors p-2 rounded-sm"
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
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-[var(--aesthetic-background)]/70 border border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/80 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/50 transition-colors p-2 rounded-sm"
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
            className="absolute inset-0 bg-[url('/assets/noir/Gemini_Generated_Image_hgsjjdhgsjjdhgsj.jpeg')] bg-[length:75%] bg-left-bottom bg-no-repeat opacity-[0.07] pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col flex-1 min-h-0">
            <div className="mb-4 border-b border-[var(--aesthetic-border)]/20 pb-2 flex items-center justify-between gap-2">
              <h2 className="font-typewriter text-sm text-[var(--aesthetic-text)]/70">
                CASE FILE // JSON DATA
              </h2>
              {onToggleEditor && (
                <button
                  type="button"
                  onClick={onToggleEditor}
                  aria-label="Hide editor"
                  title="Hide editor"
                  className="text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-accent)] transition-colors p-1"
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
        data-testid="evidence-board"
        className="bg-venetian relative flex flex-col min-h-screen z-10"
      >
        <div className="sticky top-0 z-20 px-6 py-3 bg-[var(--aesthetic-background)]/30 border-b border-[var(--aesthetic-border)]/20 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-typewriter text-xs text-[var(--aesthetic-accent)]/60 uppercase tracking-[0.3em]">
              Evidence Board
            </span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {onToggleTraining && (
                <button
                  type="button"
                  onClick={onToggleTraining}
                  aria-label={showTraining ? "Hide training data" : "Show training data"}
                  title={showTraining ? "Hide training data" : "Training data archive"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors shrink-0",
                    showTraining
                      ? "bg-[var(--aesthetic-accent)]/20 border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)]"
                      : "bg-[var(--aesthetic-background)]/50 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
                  )}
                >
                  <Database className="w-3 h-3" />
                  Training
                </button>
              )}
              {onToggleTemplates && (
                <button
                  type="button"
                  onClick={onToggleTemplates}
                  aria-label={showTemplates ? "Hide templates" : "Show templates"}
                  title={showTemplates ? "Hide templates" : "Browse templates"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors shrink-0",
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
                    "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors shrink-0",
                    showEject
                      ? "bg-[var(--aesthetic-accent)]/20 border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)]"
                      : "bg-[var(--aesthetic-background)]/50 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
                  )}
                >
                  <Code className="w-3 h-3" />
                  Eject
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-8 flex flex-col items-center justify-start">
          {preview}
        </div>
      </div>

      {isEjectVisible && ejectPanel && (
        <div className="h-full overflow-hidden relative z-10">{ejectPanel}</div>
      )}

      {/* Training Panel */}
      {isTrainingVisible && trainingPanel && (
        <div className="h-full overflow-hidden relative z-10">{trainingPanel}</div>
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
