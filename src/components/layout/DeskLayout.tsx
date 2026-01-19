import React from 'react'
import { cn } from '@/lib/utils'

interface DeskLayoutProps {
  editor: React.ReactNode
  preview: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

export function DeskLayout({ editor, preview, sidebar, className }: DeskLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen grid gap-0 bg-noir-dark text-noir-paper",
      sidebar ? "grid-cols-[1fr_1fr_350px]" : "grid-cols-2",
      className
    )}>
      {/* Editor Pane (Left) */}
      <div className="border-r border-noir-gray/30 p-4 overflow-auto bg-noir-black/50">
        <h2 className="font-typewriter text-sm text-noir-paper/70 mb-4 border-b border-noir-gray/20 pb-2">
          CASE FILE // JSON DATA
        </h2>
        {editor}
      </div>
      
      {/* Preview Pane (Middle) */}
      <div className="p-8 overflow-auto bg-venetian relative flex flex-col items-center justify-center min-h-screen">
         <div className="absolute top-4 right-4 font-typewriter text-xs text-noir-amber/50">
           EVIDENCE BOARD
         </div>
        {preview}
      </div>

      {/* Sidebar (Right) */}
      {sidebar && (
        <div className="h-full overflow-hidden border-l border-noir-gray/20 bg-noir-black/80">
          {sidebar}
        </div>
      )}
    </div>
  )
}
