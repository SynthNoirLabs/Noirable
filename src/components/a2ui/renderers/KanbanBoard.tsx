"use client";

import { motion } from "framer-motion";
import { UserCircle } from "lucide-react";
import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getEffectsProfile } from "@/lib/aesthetic/identity";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { useResolve, useBaseAestheticId } from "../internal/binding";
import { useInternalEntrance } from "../internal/motion";

export function KanbanBoardRenderer({ component }: ComponentProps) {
  const board = component as SurfaceComponent & {
    title?: unknown;
    columns?: Array<{
      id: string;
      title: string;
      cards: Array<{
        id: string;
        title: string;
        description?: string;
        assignee?: string;
        tags?: string[];
      }>;
    }>;
  };

  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const entrance = useInternalEntrance();
  const boardTitle = board.title ? String(resolve(board.title)) : "";
  const columns = board.columns || [];

  // Shared, var-driven base styling. Color comes entirely from the aesthetic
  // CSS vars, so noir/minimal/gothic and every custom profile adapt for free
  // without their own switch arm. Decoration is now driven by the effects
  // profile rather than a hardcoded preset id, so a custom profile whose base
  // is nostromo/cyber (or whose effects use scanlines/phosphor/hologram) gets
  // the matching treatment too. Glows are color-mixes of the ACTIVE accent —
  // never literal hexes, which had drifted to Tailwind cyan/green that matched
  // no world's palette.
  const effects = getEffectsProfile(baseAestheticId);
  const scanlines = effects.screen === "scanlines";
  const phosphor = effects.screen === "phosphor";
  const hologram = effects.card === "hologram";
  const wireframe = effects.card === "wireframe";

  const containerClass = cn(
    "font-mono text-[var(--aesthetic-text)] p-4 bg-[var(--aesthetic-background)] border border-[var(--aesthetic-border)]/40 rounded-sm",
    scanlines && "crt-scanlines",
    phosphor && "crt-glow",
    hologram &&
      "shadow-[0_0_10px_color-mix(in_srgb,var(--aesthetic-accent)_60%,transparent),inset_0_0_5px_color-mix(in_srgb,var(--aesthetic-accent)_45%,transparent)]"
  );
  const columnClass = cn(
    "bg-[var(--aesthetic-surface)]/40 border border-[var(--aesthetic-border)]/20 rounded-sm p-3 min-w-[280px] max-w-[320px]",
    hologram && "shadow-[0_0_5px_color-mix(in_srgb,var(--aesthetic-accent)_12%,transparent)]"
  );
  const cardClass = cn(
    "bg-[var(--aesthetic-surface)]/80 border border-[var(--aesthetic-border)]/30 p-3 rounded-sm text-[var(--aesthetic-text)] break-words whitespace-normal shadow-sm hover:border-[var(--aesthetic-accent)]/55 hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-200",
    wireframe && "shadow-[0_0_4px_color-mix(in_srgb,var(--aesthetic-accent)_25%,transparent)]",
    hologram &&
      "border-[var(--aesthetic-accent-muted)]/60 shadow-[0_0_8px_color-mix(in_srgb,var(--aesthetic-accent)_50%,transparent)] hover:shadow-[0_0_12px_color-mix(in_srgb,var(--aesthetic-accent)_60%,transparent)]"
  );
  const textClass = "text-xs text-[var(--aesthetic-text)]/75 leading-relaxed font-typewriter";
  const titleClass = "font-bold text-sm text-[var(--aesthetic-accent)] mb-1 font-typewriter";
  const headerClass =
    "font-typewriter font-bold text-lg mb-4 text-[var(--aesthetic-text)] uppercase tracking-widest border-b border-[var(--aesthetic-border)]/30 pb-2";

  // Handle zero columns or zero cards gracefully
  if (columns.length === 0) {
    return (
      <div className={containerClass}>
        {boardTitle && <div className={headerClass}>{boardTitle}</div>}
        <div className="text-center py-8 opacity-65 text-xs">Empty board state</div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {boardTitle && <div className={headerClass}>{boardTitle}</div>}
      <div className="flex flex-row gap-4 overflow-x-auto pb-4 items-start">
        {columns.map((column, columnIndex) => {
          const columnBody = (
            <>
              <div className={cn(titleClass, "font-bold border-b pb-1 mb-3 border-current/25")}>
                {column.title} ({column.cards?.length || 0})
              </div>
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {!column.cards || column.cards.length === 0 ? (
                  <div className="text-center py-6 opacity-50 text-xs italic">No cards</div>
                ) : (
                  column.cards.map((card, cardIndex) => {
                    const cardBody = (
                      <>
                        <div className="font-bold text-sm leading-snug mb-1.5 break-words whitespace-normal">
                          {card.title}
                        </div>
                        {card.description && (
                          <p className={cn(textClass, "mb-2 break-words whitespace-normal")}>
                            {card.description}
                          </p>
                        )}
                        {card.assignee && (
                          <div className="text-[10px] opacity-75 mt-1 font-mono break-words whitespace-normal flex items-center gap-1">
                            <UserCircle className="w-3 h-3 text-[var(--aesthetic-accent)]" />
                            <span>{card.assignee}</span>
                          </div>
                        )}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide bg-current/10 text-current break-words whitespace-normal"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    );
                    // Cards deal onto the column with the world's entrance
                    // physics, offset by the column index so the board reads
                    // left-to-right, top-to-bottom.
                    return entrance ? (
                      <motion.div
                        key={card.id}
                        initial={entrance.hidden}
                        animate={entrance.show}
                        transition={entrance.transition(columnIndex * 2 + cardIndex)}
                        className={cardClass}
                      >
                        {cardBody}
                      </motion.div>
                    ) : (
                      <div key={card.id} className={cardClass}>
                        {cardBody}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          );
          return entrance ? (
            <motion.div
              key={column.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={entrance.transition(columnIndex)}
              className={columnClass}
            >
              {columnBody}
            </motion.div>
          ) : (
            <div key={column.id} className={columnClass}>
              {columnBody}
            </div>
          );
        })}
      </div>
    </div>
  );
}
