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
        "bg-paper shadow-lg p-6 relative border border-noir-gray/20 rotate-[-1deg] max-w-md",
        className,
      )}
    >
      {/* Stamp */}
      <div
        className={cn(
          "absolute top-4 right-4 transform rotate-[15deg] border-2 px-2 py-1 font-typewriter font-bold opacity-80 text-xs",
          status === "active"
            ? "border-noir-ink text-noir-ink"
            : "border-noir-red text-noir-red",
        )}
      >
        {status.toUpperCase()}
      </div>

      <div className="border-b-2 border-noir-ink/10 pb-4 mb-4">
        <TypewriterText
          content={title}
          className="text-2xl font-bold text-noir-ink"
        />
      </div>

      {description && (
        <TypewriterText
          content={description}
          priority="low"
          className="text-sm leading-relaxed text-noir-ink/80"
        />
      )}
    </div>
  );
}
