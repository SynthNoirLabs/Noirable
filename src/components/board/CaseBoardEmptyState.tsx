"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useResolvedAesthetic } from "@/lib/aesthetic/useResolvedAesthetic";
import { getSamplePrompts } from "@/lib/aesthetic/identity";

interface CaseBoardEmptyStateProps {
  /**
   * Called with the chosen sample prompt when a lead chip is clicked. Wired to
   * the same send path as a typed message so a click "files" the prompt.
   */
  onSelectPrompt?: (prompt: string) => void;
}

/**
 * First-run "case board" placeholder shown before any evidence exists.
 *
 * Replaces the old accidental "Evidence #1" store seed with an inviting,
 * on-theme prompt that tells a brand-new detective exactly what to do. The
 * leads are per-preset (themed sample prompts) and clickable — clicking one
 * sends it exactly as if the user had typed it into the Interrogation Log.
 *
 * Chips stagger in via framer-motion, gated by `useReducedMotion()` so
 * reduced-motion users get the static layout with no animation.
 */
export function CaseBoardEmptyState({ onSelectPrompt }: CaseBoardEmptyStateProps) {
  const { baseId } = useResolvedAesthetic();
  const samplePrompts = getSamplePrompts(baseId);
  const reduceMotion = useReducedMotion();

  const listVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
    },
  };

  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 6 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
      };

  return (
    <div className="border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/30 rounded-sm p-8 max-w-2xl backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <h2 className="text-[var(--aesthetic-accent)]/70 font-typewriter uppercase tracking-[0.3em] text-sm">
        Case File // Unopened
      </h2>
      <p className="text-[var(--aesthetic-text)]/70 font-mono text-xs mt-4 leading-relaxed">
        The board is clean. Describe the interface you want built and the detective will track it
        down — every component lands here as evidence.
      </p>

      <div className="mt-6 border-t border-[var(--aesthetic-border)]/20 pt-4">
        <span className="text-[var(--aesthetic-text)]/40 font-typewriter text-[10px] uppercase tracking-[0.3em]">
          Leads to pursue
        </span>
        <motion.ul
          className="mt-3 space-y-1"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {samplePrompts.map((prompt) => (
            <motion.li key={prompt} variants={itemVariants}>
              <button
                type="button"
                onClick={() => onSelectPrompt?.(prompt)}
                className="group flex w-full items-center gap-2 rounded-sm border-l-2 border-l-transparent py-1.5 pl-1 pr-2 text-left font-mono text-xs text-[var(--aesthetic-text)]/60 transition-colors duration-200 hover:border-l-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/5 hover:pl-2 hover:text-[var(--aesthetic-accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aesthetic-accent)]/40 cursor-pointer"
              >
                <span className="text-[var(--aesthetic-accent)]/50 transition-colors duration-200 group-hover:text-[var(--aesthetic-accent)]">
                  &gt;
                </span>
                <span className="flex-1">{prompt}</span>
                <ArrowRight
                  className="w-3 h-3 flex-shrink-0 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-70 group-hover:translate-x-0"
                  aria-hidden="true"
                />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[var(--aesthetic-accent)]/50 font-typewriter text-[10px] uppercase tracking-[0.3em]">
        Begin in the Interrogation Log
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
    </div>
  );
}
