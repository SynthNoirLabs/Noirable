import React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared noir "paper" surface recipe.
 *
 * This is the static base of the aged-dossier look (paper texture, worn edges,
 * ink-on-paper). It deliberately omits the rotation/hover transforms so it can
 * wrap arbitrary content without tilting it — DossierCard re-adds those via the
 * className argument, while the A2UI v0.9 Card renderer uses the flat frame.
 */
export const noirCardClass =
  "bg-paper p-6 relative border border-[var(--aesthetic-border)]/20 shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_0_40px_rgba(112,66,20,0.05)]";

interface PaperFrameProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A paper-textured frame with the signature coffee-stain accent. Used to give
 * generated content the same physical-evidence feel as the DossierCard, minus
 * the status stamp (which depends on a status the generic renderer lacks).
 */
export function PaperFrame({ children, className }: PaperFrameProps) {
  return (
    <div className={cn(noirCardClass, className)}>
      {/* Coffee stain */}
      <div
        className="coffee-stain absolute w-[60px] h-[60px] border-2 border-[#704214]/10 rounded-full top-[10%] right-[15%] rotate-12 pointer-events-none"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
