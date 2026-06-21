import type { StateCreator } from "zustand";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";

/**
 * A persisted, restorable snapshot of one COMPLETED generation. Mirrors the
 * in-memory CapturedVariant shape (catalogId + theme + components + dataModel)
 * the variant picker already restores into the surface store, and adds the
 * archive metadata (prompt text, derived title, world id, timestamp) the Case
 * Archive UI needs to label and filter the strip. (Persisted, capped.)
 */
export interface ArchivedCase {
  id: string;
  /** When this generation completed (ms epoch). */
  archivedAt: number;
  /** The user prompt that produced this surface. */
  prompt: string;
  /** A short, human-readable title derived from the prompt. */
  title: string;
  /** The active aesthetic id (built-in or custom-) when generated. */
  aestheticId: string;
  /** The surface catalog this take was built against. */
  catalogId: string;
  /** A2UI v0.9 theme: string id or inline theme object. */
  theme?: string | Record<string, unknown>;
  /** The frozen component tree, restored verbatim into a fresh surface. */
  components: SurfaceComponent[];
  /** The data model template/list children resolve from; restored at "/". */
  dataModel: Record<string, unknown>;
}

/** Newest-first cap: the strip keeps the most recent N cases, evicting oldest. */
const MAX_ARCHIVE = 24;

/** Distill a prompt into a short typewriter-label title (first line, clamped). */
function deriveTitle(prompt: string): string {
  const firstLine = prompt.trim().split("\n")[0]?.trim() ?? "";
  if (!firstLine) return "Untitled Case";
  return firstLine.length > 48 ? `${firstLine.slice(0, 47).trimEnd()}…` : firstLine;
}

export interface ArchiveSlice {
  archive: ArchivedCase[];
  /**
   * Snapshot a completed generation onto the front of the archive. Accepts the
   * already-captured surface fields plus the prompt; derives title/timestamp/id
   * here so callers stay thin. Evicts the oldest once over MAX_ARCHIVE.
   */
  addToArchive: (entry: {
    prompt: string;
    aestheticId: string;
    catalogId: string;
    theme?: string | Record<string, unknown>;
    components: SurfaceComponent[];
    dataModel: Record<string, unknown>;
  }) => void;
  removeFromArchive: (id: string) => void;
  clearArchive: () => void;
}

export const createArchiveSlice: StateCreator<ArchiveSlice, [], [], ArchiveSlice> = (set) => ({
  archive: [],
  addToArchive: (entry) =>
    set((state) => {
      const archived: ArchivedCase = {
        id:
          globalThis.crypto?.randomUUID() ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        archivedAt: Date.now(),
        prompt: entry.prompt,
        title: deriveTitle(entry.prompt),
        aestheticId: entry.aestheticId,
        catalogId: entry.catalogId,
        theme: entry.theme,
        components: entry.components,
        dataModel: entry.dataModel,
      };
      // Newest-first, oldest-eviction once the strip overflows.
      return { archive: [archived, ...state.archive].slice(0, MAX_ARCHIVE) };
    }),
  removeFromArchive: (id) =>
    set((state) => ({ archive: state.archive.filter((c) => c.id !== id) })),
  clearArchive: () => set({ archive: [] }),
});
