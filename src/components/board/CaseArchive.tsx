"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchivedCase } from "@/lib/store/useA2UIStore";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";

export interface CaseArchiveProps {
  /** Persisted, newest-first archived generations. */
  cases: ArchivedCase[];
  /** Whether the drawer is open (driven by the desk toolbar button). */
  isOpen: boolean;
  onClose: () => void;
  /** Restore a case into the live surface (reuses the variant-restore path). */
  onRestore: (entry: ArchivedCase) => void;
  /** Remove a single case from the archive. */
  onRemove: (id: string) => void;
}

/** Short, stable timestamp label for a pinned case file. */
function formatStamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The Case Archive: a slide-up film-strip of restorable "case file" cards along
 * the board's bottom edge. Each pinned card shows its derived title + prompt +
 * timestamp; clicking it restores that surface via the existing variant-restore
 * path. A lightweight text filter searches across the archived prompt text.
 * On-theme: typewriter labels, pinned-card vibe.
 */
export function CaseArchive({ cases, isOpen, onClose, onRestore, onRemove }: CaseArchiveProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) => c.prompt.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    );
  }, [cases, query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          data-testid="case-archive"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "tween", duration: 0.22 }}
          role="region"
          aria-label="Case archive"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--aesthetic-accent)]/30 bg-[var(--aesthetic-background)]/95 backdrop-blur-md shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-2 border-b border-[var(--aesthetic-border)]/20">
            <span className="flex items-center gap-2 font-typewriter text-xs uppercase tracking-[0.3em] text-[var(--aesthetic-accent)]/70">
              <Archive className="w-3.5 h-3.5" />
              Case Archive
              <span className="text-[var(--aesthetic-text-muted)]/50">({cases.length})</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--aesthetic-text-muted)]/50" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the files..."
                  aria-label="Search the files"
                  className="w-44 pl-7 pr-2 py-1 text-xs font-mono bg-[var(--aesthetic-surface)]/60 border border-[var(--aesthetic-border)]/30 rounded-sm text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)]/50 focus:outline-none focus:border-[var(--aesthetic-accent)]"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close case archive"
                title="Close case archive"
                className="p-1 text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-accent)] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-5 py-3">
            {cases.length === 0 ? (
              <p className="font-typewriter text-xs text-[var(--aesthetic-text-muted)]/60 py-6 text-center">
                No case files yet. Every generation pins itself here.
              </p>
            ) : filtered.length === 0 ? (
              <p className="font-typewriter text-xs text-[var(--aesthetic-text-muted)]/60 py-6 text-center">
                No files match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {filtered.map((entry) => {
                  const accent = getAestheticDefinition(entry.aestheticId).theme.colors.accent;
                  return (
                    <div
                      key={entry.id}
                      className="group relative shrink-0 w-52"
                      data-testid="case-archive-card"
                    >
                      <button
                        type="button"
                        onClick={() => onRestore(entry)}
                        aria-label={`Restore case ${entry.title}`}
                        title={entry.prompt}
                        className={cn(
                          "flex w-full flex-col gap-2 rounded-sm border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-surface)]/70 p-3 text-left transition-all hover:border-[var(--aesthetic-accent)]/60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
                        )}
                      >
                        <span
                          className="h-1 w-8 rounded-full"
                          style={{ backgroundColor: accent }}
                          aria-hidden="true"
                        />
                        <span className="font-typewriter text-xs text-[var(--aesthetic-text)] line-clamp-2">
                          {entry.title}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--aesthetic-text-muted)]/60">
                          {formatStamp(entry.archivedAt)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(entry.id)}
                        aria-label={`Remove case ${entry.title}`}
                        title={`Remove case ${entry.title}`}
                        className="absolute right-1.5 top-1.5 p-1 opacity-0 transition-opacity text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-error)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-error)] rounded-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
