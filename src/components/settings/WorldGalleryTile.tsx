"use client";

import { Check, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AestheticId } from "@/lib/aesthetic/types";
import { getAestheticDefinition } from "@/lib/aesthetic/definitions";

/**
 * One "living world tile": previews a world by painting its REAL palette
 * swatches and rendering its display name in its display (heading) font, so the
 * choice previews itself instead of reading as a flat dropdown row. Custom
 * profiles resolve their palette/font through their base aesthetic definition.
 */
export interface WorldGalleryTileProps {
  id: AestheticId;
  /** Display name (built-in preset name or custom profile name). */
  name: string;
  /**
   * The world this tile derives its look from: a built-in id for presets, or a
   * custom profile's baseAestheticId. Drives the palette + heading font.
   */
  baseAestheticId: AestheticId;
  isActive: boolean;
  isBuiltIn: boolean;
  onSelect: (id: AestheticId) => void;
  onClone?: (id: AestheticId, e: React.MouseEvent) => void;
  onDelete?: (id: AestheticId, e: React.MouseEvent) => void;
}

export function WorldGalleryTile({
  id,
  name,
  baseAestheticId,
  isActive,
  isBuiltIn,
  onSelect,
  onClone,
  onDelete,
}: WorldGalleryTileProps) {
  const definition = getAestheticDefinition(baseAestheticId);
  const { colors, fonts } = definition.theme;

  return (
    <div
      role="option"
      aria-selected={isActive}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-sm border transition-all",
        isActive
          ? "border-[var(--aesthetic-accent)] ring-1 ring-[var(--aesthetic-accent)]/50"
          : "border-[var(--aesthetic-border)]/40 hover:border-[var(--aesthetic-accent)]/60"
      )}
      style={{ backgroundColor: colors.surface }}
    >
      {/* The whole tile is the select target; clone/delete sit on top of it as
          siblings (not nested buttons) to keep the markup valid. */}
      <button
        type="button"
        aria-label={`Switch to ${name}`}
        onClick={() => onSelect(id)}
        className="flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
      >
        {/* Palette preview band — the world paints its own swatch row. */}
        <span className="flex h-12 w-full" aria-hidden="true">
          <span className="flex-[2]" style={{ backgroundColor: colors.background }} />
          <span className="flex-1" style={{ backgroundColor: colors.surfaceAlt }} />
          <span className="flex-1" style={{ backgroundColor: colors.accent }} />
          <span className="flex-1" style={{ backgroundColor: colors.accentMuted }} />
        </span>

        {/* Name in the world's display font + accent, over the world's surface. */}
        <span className="flex items-center gap-2 px-3 py-2">
          <span
            className="truncate text-sm"
            style={{ color: colors.accent, fontFamily: fonts.heading }}
          >
            {name}
          </span>
          {isActive && <Check className="h-4 w-4 shrink-0" style={{ color: colors.accent }} />}
        </span>
      </button>

      {!isBuiltIn && (onClone || onDelete) && (
        <span className="absolute right-2 top-[3.25rem] flex items-center gap-1">
          {onClone && (
            <button
              type="button"
              onClick={(e) => onClone(id, e)}
              aria-label={`Clone world ${name}`}
              title={`Clone world ${name}`}
              className="p-1 opacity-0 transition-opacity hover:text-[var(--aesthetic-accent)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] group-hover:opacity-100"
              style={{ color: colors.textMuted }}
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => onDelete(id, e)}
              aria-label={`Delete world ${name}`}
              title={`Delete world ${name}`}
              className="p-1 opacity-0 transition-opacity hover:text-[var(--aesthetic-error)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-error)] group-hover:opacity-100"
              style={{ color: colors.textMuted }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </span>
      )}
    </div>
  );
}
