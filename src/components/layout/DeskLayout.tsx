import React from "react";
import { cn } from "@/lib/utils";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  Code,
  LayoutTemplate,
} from "lucide-react";
import { ResizeHandle } from "./ResizeHandle";

interface DeskLayoutProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  sidebar?: React.ReactNode;
  ejectPanel?: React.ReactNode;
  templatePanel?: React.ReactNode;
  showEditor?: boolean;
  showSidebar?: boolean;
  showEject?: boolean;
  showTemplates?: boolean;
  editorWidth?: number;
  sidebarWidth?: number;
  onToggleEditor?: () => void;
  onToggleSidebar?: () => void;
  onToggleEject?: () => void;
  onToggleTemplates?: () => void;
  onResizeEditor?: (nextWidth: number) => void;
  onResizeSidebar?: (nextWidth: number) => void;
  className?: string;
}

export function DeskLayout({
  editor,
  preview,
  sidebar,
  ejectPanel,
  templatePanel,
  showEditor = true,
  showSidebar = true,
  showEject = false,
  showTemplates = false,
  editorWidth = 300,
  sidebarWidth = 360,
  onToggleEditor,
  onToggleSidebar,
  onToggleEject,
  onToggleTemplates,
  onResizeEditor,
  onResizeSidebar,
  className,
}: DeskLayoutProps) {
  const isEditorVisible = showEditor;
  const isSidebarVisible = Boolean(sidebar) && showSidebar;
  const isEjectVisible = Boolean(ejectPanel) && showEject;
  const isTemplatesVisible = Boolean(templatePanel) && showTemplates;

  const getGridColsClass = () => {
    const cols: string[] = [];
    if (isEditorVisible) cols.push("var(--editor-w)");
    if (isTemplatesVisible) cols.push("280px");
    cols.push("1fr");
    if (isEjectVisible) cols.push("400px");
    if (isSidebarVisible) cols.push("var(--sidebar-w)");
    return `grid-cols-[${cols.join("_")}]`;
  };

  const gridColsClass = getGridColsClass();

  return (
    <div
      className={cn(
        "min-h-screen grid gap-0 bg-noir-dark text-noir-paper relative isolate overflow-hidden",
        gridColsClass,
        className,
      )}
      style={
        {
          "--editor-w": `${editorWidth}px`,
          "--sidebar-w": `${sidebarWidth}px`,
        } as React.CSSProperties
      }
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

      {/* Template Panel */}
      {isTemplatesVisible && templatePanel && (
        <div className="h-full overflow-hidden border-r border-noir-gray/20 relative z-10">
          {templatePanel}
        </div>
      )}

      <div className="p-8 overflow-auto bg-venetian relative flex flex-col items-center justify-center min-h-screen z-10">
        <div className="absolute top-4 right-4 flex items-center gap-3">
          {onToggleTemplates && (
            <button
              type="button"
              onClick={onToggleTemplates}
              aria-label={showTemplates ? "Hide templates" : "Show templates"}
              title={showTemplates ? "Hide templates" : "Browse templates"}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors",
                showTemplates
                  ? "bg-noir-amber/20 border-noir-amber/40 text-noir-amber"
                  : "bg-noir-black/50 border-noir-gray/40 text-noir-paper/60 hover:text-noir-amber hover:border-noir-amber/40",
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
              title={showEject ? "Hide code export" : "Export to code (⌘E)"}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors",
                showEject
                  ? "bg-noir-amber/20 border-noir-amber/40 text-noir-amber"
                  : "bg-noir-black/50 border-noir-gray/40 text-noir-paper/60 hover:text-noir-amber hover:border-noir-amber/40",
              )}
            >
              <Code className="w-3 h-3" />
              Eject
            </button>
          )}
          <span className="font-typewriter text-xs text-noir-amber/50">
            EVIDENCE BOARD
          </span>
        </div>
        {preview}
      </div>

      {isEjectVisible && ejectPanel && (
        <div className="h-full overflow-hidden relative z-10">{ejectPanel}</div>
      )}

      {/* Sidebar (Right) */}
      {isSidebarVisible && (
        <div className="h-full overflow-hidden border-l border-noir-gray/20 bg-noir-black/80 relative z-10">
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
