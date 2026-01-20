import React from "react";
import { cn } from "@/lib/utils";

interface DeskLayoutProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DeskLayout({
  editor,
  preview,
  sidebar,
  className,
}: DeskLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen grid gap-0 bg-noir-dark text-noir-paper relative isolate overflow-hidden",
        sidebar ? "grid-cols-[1fr_1fr_420px]" : "grid-cols-2",
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
      {/* Editor Pane (Left) */}
      <div className="border-r border-noir-gray/30 p-4 overflow-auto bg-noir-black/50 relative z-10">
        <div
          data-testid="noir-case-file"
          className="absolute inset-0 bg-[url('/assets/noir/case-file.jpg')] bg-contain bg-left-bottom bg-no-repeat opacity-10 pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <h2 className="font-typewriter text-sm text-noir-paper/70 mb-4 border-b border-noir-gray/20 pb-2">
            CASE FILE // JSON DATA
          </h2>
          {editor}
        </div>
      </div>

      {/* Preview Pane (Middle) */}
      <div className="p-8 overflow-auto bg-venetian relative flex flex-col items-center justify-center min-h-screen z-10">
        <div className="absolute top-4 right-4 font-typewriter text-xs text-noir-amber/50">
          EVIDENCE BOARD
        </div>
        {preview}
      </div>

      {/* Sidebar (Right) */}
      {sidebar && (
        <div className="h-full overflow-hidden border-l border-noir-gray/20 bg-noir-black/80 relative z-10">
          {sidebar}
        </div>
      )}
    </div>
  );
}
