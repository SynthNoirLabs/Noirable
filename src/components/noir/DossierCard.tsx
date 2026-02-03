import React from "react";
import { cn } from "@/lib/utils";
import { TypewriterText } from "./TypewriterText";

interface DossierCardProps {
  title: string;
  description?: string;
  status?: "active" | "archived" | "missing" | "redacted";
  className?: string;
}

export function DossierCard({
  title,
  description,
  status = "active",
  className,
}: DossierCardProps) {
  return (
    <div
      className={cn(
        "bg-paper p-6 relative border border-[var(--aesthetic-border)]/20 rotate-[-1deg] max-w-md transition-transform hover:rotate-0 hover:scale-[1.01] duration-300",
        "shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_0_40px_rgba(112,66,20,0.05)]", // worn edges
        className
      )}
    >
      {/* Coffee Stain */}
      <div
        className="absolute w-[60px] h-[60px] border-2 border-[#704214]/10 rounded-full top-[10%] right-[15%] rotate-12 pointer-events-none"
        aria-hidden="true"
      />

      {/* Stamp */}
      <div
        className={cn(
          "absolute top-4 right-4 transform rotate-[15deg] border-[3px] px-3 py-1 font-typewriter font-bold opacity-80 text-xs tracking-widest mask-stamp",
          status === "active"
            ? "border-[var(--aesthetic-border)] text-[var(--aesthetic-border)]"
            : "border-[var(--aesthetic-error)] text-[var(--aesthetic-error)]"
        )}
      >
        {status.toUpperCase()}
      </div>

      <div className="border-b-2 border-[var(--aesthetic-border)]/10 pb-4 mb-4">
        <TypewriterText
          content={title}
          className="text-2xl font-bold text-[var(--aesthetic-border)]"
        />
      </div>

      {description && (
        <TypewriterText
          content={description}
          priority="low"
          className="text-sm leading-relaxed text-[var(--aesthetic-border)]/80"
        />
      )}
    </div>
  );
}
