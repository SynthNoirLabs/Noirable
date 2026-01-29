"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface EvidenceSkeletonProps {
  className?: string;
}

export function EvidenceSkeleton({ className }: EvidenceSkeletonProps) {
  return (
    <div className={cn("w-full max-w-2xl mx-auto animate-pulse", className)}>
      {/* Card skeleton */}
      <div className="bg-noir-black/40 border border-noir-gray/30 rounded-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-5 bg-noir-gray/30 rounded w-1/3" />
          <div className="h-4 bg-noir-amber/20 rounded w-16" />
        </div>

        {/* Divider */}
        <div className="h-px bg-noir-gray/20" />

        {/* Content lines */}
        <div className="space-y-3">
          <div className="h-4 bg-noir-gray/20 rounded w-full" />
          <div className="h-4 bg-noir-gray/20 rounded w-5/6" />
          <div className="h-4 bg-noir-gray/20 rounded w-4/6" />
        </div>

        {/* Image placeholder */}
        <div className="h-32 bg-noir-gray/20 rounded flex items-center justify-center">
          <div className="text-noir-gray/40 text-xs font-typewriter uppercase tracking-wider">
            Generating...
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 bg-noir-gray/20 rounded w-24" />
          <div className="h-3 bg-noir-gray/20 rounded w-16" />
        </div>
      </div>

      {/* Typing indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-noir-amber/60">
        <span
          className="w-2 h-2 rounded-full bg-noir-amber/50 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-noir-amber/50 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-noir-amber/50 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
        <span className="ml-2 text-xs font-typewriter uppercase tracking-wider">
          Compiling evidence
        </span>
      </div>
    </div>
  );
}
