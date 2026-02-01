import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { A2UIRenderer } from "@/components/renderer/A2UIRenderer";
import { Search, X } from "lucide-react";
import type { EvidenceEntry } from "@/lib/store/useA2UIStore";
import type { A2UIInput } from "@/lib/protocol/schema";

interface EvidenceBoardProps {
  entries: EvidenceEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  fallbackEvidence?: A2UIInput | null;
}

export function EvidenceBoard({
  entries,
  activeId,
  onSelect,
  fallbackEvidence,
}: EvidenceBoardProps) {
  const [view, setView] = useState<"grid" | "list" | "timeline">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.createdAt - a.createdAt),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return sortedEntries;
    const query = searchQuery.toLowerCase();
    return sortedEntries.filter(
      (entry) =>
        entry.label.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query) ||
        entry.status?.toLowerCase().includes(query)
    );
  }, [sortedEntries, searchQuery]);

  const activeEntry = entries.find((entry) => entry.id === activeId) ?? sortedEntries[0];
  const activeStamp = activeEntry?.status ?? "active";
  const stampStyle = (status?: string) => {
    switch (status) {
      case "missing":
        return "border-noir-red text-noir-red/90 bg-noir-red/10";
      case "archived":
        return "border-noir-gray/60 text-noir-paper/60 bg-noir-gray/20";
      case "redacted":
        return "border-noir-paper/40 text-noir-paper/70 bg-noir-paper/10";
      default:
        return "border-noir-amber/60 text-noir-amber/80 bg-noir-amber/10";
    }
  };

  const shouldShowFallback = sortedEntries.length === 0 && fallbackEvidence;

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6">
      {/* Only show search/view controls when there are entries */}
      {sortedEntries.length > 0 && (
        <div className="flex items-center justify-end gap-4 relative z-20 bg-noir-black/20 backdrop-blur-sm rounded-sm px-4 py-3 border border-noir-gray/20 mb-4">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-paper/50 pointer-events-none" />
            <input
              id="evidence-search"
              name="evidence-search"
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 h-10 pl-10 pr-9 bg-noir-black/50 border border-noir-gray/50 rounded text-noir-paper/90 text-sm font-mono placeholder:text-noir-paper/40 focus:outline-none focus:border-noir-amber/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-noir-paper/40 hover:text-noir-amber transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "px-3 py-1.5 border rounded transition-colors",
                view === "grid"
                  ? "border-noir-amber/70 text-noir-amber bg-noir-amber/10"
                  : "border-noir-gray/70 text-noir-paper bg-noir-black/30 hover:text-noir-amber hover:border-noir-amber/40"
              )}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 border rounded transition-colors",
                view === "list"
                  ? "border-noir-amber/70 text-noir-amber bg-noir-amber/10"
                  : "border-noir-gray/70 text-noir-paper bg-noir-black/30 hover:text-noir-amber hover:border-noir-amber/40"
              )}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={cn(
                "px-3 py-1.5 border rounded transition-colors",
                view === "timeline"
                  ? "border-noir-amber/70 text-noir-amber bg-noir-amber/10"
                  : "border-noir-gray/70 text-noir-paper bg-noir-black/30 hover:text-noir-amber hover:border-noir-amber/40"
              )}
            >
              Timeline
            </button>
          </div>
        </div>
      )}

      {filteredEntries.length === 0 ? (
        searchQuery ? (
          <div className="text-noir-paper/50 font-typewriter text-xs uppercase tracking-[0.2em] text-center py-12">
            No evidence matches &quot;{searchQuery}&quot;
          </div>
        ) : shouldShowFallback ? (
          <div className="w-full flex justify-center">
            <A2UIRenderer data={fallbackEvidence} />
          </div>
        ) : (
          <div className="text-noir-paper/50 font-typewriter text-xs uppercase tracking-[0.2em] text-center py-12">
            No evidence on record.
          </div>
        )
      ) : view === "timeline" ? (
        <div className="relative border-l border-noir-amber/20 pl-6 space-y-4">
          {filteredEntries.map((entry) => {
            const isActive = entry.id === activeEntry?.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry.id)}
                className={cn(
                  "relative text-left border rounded-sm p-3 bg-noir-black/40 hover:border-noir-amber/60 transition-colors w-full",
                  isActive
                    ? "border-noir-amber/70 shadow-[0_0_12px_rgba(255,191,0,0.15)]"
                    : "border-noir-gray/40"
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[30px] top-4 w-3 h-3 rounded-full border",
                    isActive
                      ? "border-noir-amber bg-noir-amber/30"
                      : "border-noir-gray/40 bg-noir-black"
                  )}
                  aria-hidden="true"
                />
                <div className="text-[10px] font-mono text-noir-paper/50 uppercase tracking-[0.2em]">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-typewriter text-sm text-noir-paper/90">{entry.label}</span>
                  {entry.status && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-noir-amber/70">
                      {entry.status}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            view === "grid" ? "grid-cols-[repeat(auto-fit,minmax(220px,1fr))]" : "grid-cols-1"
          )}
        >
          {filteredEntries.map((entry) => {
            const isActive = entry.id === activeEntry?.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry.id)}
                className={cn(
                  "text-left border rounded-sm p-3 bg-noir-black/40 hover:border-noir-amber/60 transition-colors",
                  isActive
                    ? "border-noir-amber/70 shadow-[0_0_12px_rgba(255,191,0,0.15)]"
                    : "border-noir-gray/40"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-typewriter text-sm text-noir-paper/90">{entry.label}</span>
                  {entry.status && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-noir-amber/70">
                      {entry.status}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-noir-paper/50 mt-2 uppercase tracking-[0.2em]">
                  Evidence {entry.id.slice(0, 6)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeEntry && (
        <div className="w-full flex flex-col items-center relative mt-6">
          <div
            className={cn(
              "absolute -top-5 right-8 rotate-[-6deg] px-3 py-1 border-2 text-[10px] font-mono uppercase tracking-[0.4em] backdrop-blur-sm z-10",
              stampStyle(activeStamp)
            )}
            data-testid="evidence-stamp"
          >
            {activeStamp}
          </div>
          <div className="w-full">
            <A2UIRenderer data={activeEntry.data} />
          </div>
        </div>
      )}
    </div>
  );
}
