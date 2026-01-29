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
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.createdAt - a.createdAt),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return sortedEntries;
    const query = searchQuery.toLowerCase();
    return sortedEntries.filter(
      (entry) =>
        entry.label.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query) ||
        entry.status?.toLowerCase().includes(query),
    );
  }, [sortedEntries, searchQuery]);

  const activeEntry =
    entries.find((entry) => entry.id === activeId) ?? sortedEntries[0];

  const shouldShowFallback = sortedEntries.length === 0 && fallbackEvidence;

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-typewriter uppercase tracking-[0.3em] text-noir-amber/60">
          Evidence Board
        </div>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-noir-paper/40" />
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 pl-7 pr-7 py-1 bg-noir-black/40 border border-noir-gray/40 rounded-sm text-noir-paper/90 text-xs font-mono placeholder:text-noir-paper/40 focus:outline-none focus:border-noir-amber/60 transition-colors"
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
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "px-2 py-1 border rounded-sm transition-colors",
                view === "grid"
                  ? "border-noir-amber/70 text-noir-amber bg-noir-amber/10"
                  : "border-noir-gray/40 text-noir-paper/60 hover:text-noir-amber",
              )}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "px-2 py-1 border rounded-sm transition-colors",
                view === "list"
                  ? "border-noir-amber/70 text-noir-amber bg-noir-amber/10"
                  : "border-noir-gray/40 text-noir-paper/60 hover:text-noir-amber",
              )}
            >
              List
            </button>
          </div>
        </div>
      </div>

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
      ) : (
        <div
          className={cn(
            "grid gap-4",
            view === "grid"
              ? "grid-cols-[repeat(auto-fit,minmax(220px,1fr))]"
              : "grid-cols-1",
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
                    : "border-noir-gray/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-typewriter text-sm text-noir-paper/90">
                    {entry.label}
                  </span>
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
        <div className="w-full flex justify-center">
          <A2UIRenderer data={activeEntry.data} />
        </div>
      )}
    </div>
  );
}
