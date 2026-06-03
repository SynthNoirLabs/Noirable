import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * First-run "case board" placeholder shown before any evidence exists.
 *
 * Replaces the old accidental "Evidence #1" store seed with an inviting,
 * on-theme prompt that tells a brand-new detective exactly what to do: type a
 * command in the Interrogation Log. Static (no animation) so it is inherently
 * reduced-motion safe.
 */
const LEADS = [
  "Build a suspect profile card",
  "Lay out a case dashboard",
  "Draft a witness contact form",
];

export function CaseBoardEmptyState() {
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
        <ul className="mt-3 space-y-2">
          {LEADS.map((lead) => (
            <li
              key={lead}
              className="flex items-center gap-2 text-[var(--aesthetic-text)]/60 font-mono text-xs"
            >
              <span className="text-[var(--aesthetic-accent)]/50">&gt;</span>
              {lead}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[var(--aesthetic-accent)]/50 font-typewriter text-[10px] uppercase tracking-[0.3em]">
        Begin in the Interrogation Log
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
    </div>
  );
}
