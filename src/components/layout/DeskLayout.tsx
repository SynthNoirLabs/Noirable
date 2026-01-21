import React from "react";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, PanelRightOpen } from "lucide-react";

interface DeskLayoutProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  sidebar?: React.ReactNode;
  showEditor?: boolean;
  showSidebar?: boolean;
  onToggleEditor?: () => void;
  onToggleSidebar?: () => void;
  className?: string;
}

export function DeskLayout({
  editor,
  preview,
  sidebar,
  showEditor = true,
  showSidebar = true,
  onToggleEditor,
  onToggleSidebar,
  className,
}: DeskLayoutProps) {
  const isEditorVisible = showEditor;
  const isSidebarVisible = Boolean(sidebar) && showSidebar;

  const gridColsClass = isEditorVisible
    ? isSidebarVisible
      ? "grid-cols-[clamp(280px,28vw,360px)_1fr_clamp(320px,24vw,420px)]"
      : "grid-cols-[clamp(280px,28vw,360px)_1fr]"
    : isSidebarVisible
      ? "grid-cols-[1fr_clamp(320px,24vw,420px)]"
      : "grid-cols-1";

  return (
    <div
      className={cn(
        "min-h-screen grid gap-0 bg-noir-dark text-noir-paper relative isolate overflow-hidden",
        gridColsClass,
        className,
      )}
    >
      <div
        data-testid="noir-rain-bg"
        className="absolute inset-0 bg-[url('/assets/noir/rainy-bg.jpg')] bg-cover bg-top opacity-15 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-noir-dark/80 pointer-events-none"
        aria-hidden="true"
      />
      {!isEditorVisible && onToggleEditor && (
        <button
          type="button"
          onClick={onToggleEditor}
          aria-label="Show editor"
          title="Show editor"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-noir-black/70 border border-noir-gray/40 text-noir-paper/80 hover:text-noir-amber hover:border-noir-amber/50 transition-colors p-2 rounded-sm"
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
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-noir-black/70 border border-noir-gray/40 text-noir-paper/80 hover:text-noir-amber hover:border-noir-amber/50 transition-colors p-2 rounded-sm"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      )}
      {/* Editor Pane (Left) */}
      {isEditorVisible && (
        <div className="border-r border-noir-gray/30 p-4 overflow-hidden bg-noir-black/50 relative z-10 flex flex-col min-h-0">
          <div
            data-testid="noir-case-file"
            className="absolute inset-0 bg-[url('/assets/noir/Gemini_Generated_Image_hgsjjdhgsjjdhgsj.jpeg')] bg-[length:75%] bg-left-bottom bg-no-repeat opacity-[0.07] pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col flex-1 min-h-0">
            <div className="mb-4 border-b border-noir-gray/20 pb-2 flex items-center justify-between gap-2">
              <h2 className="font-typewriter text-sm text-noir-paper/70">
                CASE FILE // JSON DATA
              </h2>
              {onToggleEditor && (
                <button
                  type="button"
                  onClick={onToggleEditor}
                  aria-label="Hide editor"
                  title="Hide editor"
                  className="text-noir-gray hover:text-noir-amber transition-colors p-1"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0">{editor}</div>
          </div>
        </div>
      )}

      {/* Preview Pane (Middle) */}
      <div className="p-8 overflow-auto bg-venetian relative flex flex-col items-center justify-center min-h-screen z-10">
        <div className="absolute top-4 right-4 font-typewriter text-xs text-noir-amber/50">
          EVIDENCE BOARD
        </div>
        {preview}
      </div>

      {/* Sidebar (Right) */}
      {isSidebarVisible && (
        <div className="h-full overflow-hidden border-l border-noir-gray/20 bg-noir-black/80 relative z-10">
          {sidebar}
        </div>
      )}
    </div>
  );
}
