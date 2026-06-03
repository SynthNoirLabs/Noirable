"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  content: string;
  priority?: "low" | "normal" | "high" | "critical";
  className?: string;
  speed?: number;
  glow?: boolean;
  showCursor?: boolean;
}

const priorityMap = {
  low: "text-[var(--aesthetic-text)]/50",
  normal: "text-[var(--aesthetic-text)]",
  high: "text-[var(--aesthetic-accent)]",
  critical: "text-[var(--aesthetic-error)]",
};

export function TypewriterText({
  content,
  priority = "normal",
  className,
  speed,
  glow = true,
  showCursor = true,
}: TypewriterTextProps) {
  // Default to 0 in tests to avoid async rendering issues
  const defaultSpeed = process.env.NODE_ENV === "test" ? 0 : 30;
  const [reducedMotion, setReducedMotion] = useState(false);
  const effectiveSpeed = reducedMotion ? 0 : (speed ?? defaultSpeed);

  const [displayedText, setDisplayedText] = useState(effectiveSpeed === 0 ? content : "");
  const [prevContent, setPrevContent] = useState(content);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(media.matches);
    handleChange();
    media.addEventListener?.("change", handleChange);
    // Legacy Safari fallback
    media.addListener?.(handleChange);
    return () => {
      media.removeEventListener?.("change", handleChange);
      media.removeListener?.(handleChange);
    };
  }, []);

  // Adjust state during render if content changed
  if (content !== prevContent) {
    setPrevContent(content);
    if (effectiveSpeed === 0) {
      setDisplayedText(content);
    } else {
      // If content is not a continuation of what's displayed, reset.
      if (!content.startsWith(displayedText)) {
        setDisplayedText("");
      }
    }
  }

  useEffect(() => {
    if (effectiveSpeed === 0) {
      return;
    }

    const timer = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < content.length) {
          if (content.startsWith(prev)) {
            return prev + content.charAt(prev.length);
          } else {
            // Content changed drastically mid-stream? Reset.
            return "";
          }
        }
        return prev;
      });
    }, effectiveSpeed);

    return () => clearInterval(timer);
  }, [content, effectiveSpeed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "font-typewriter text-lg tracking-wide",
        glow && "crt-glow",
        priorityMap[priority],
        className
      )}
    >
      <span className="sr-only" data-testid="typewriter-full-text">
        {content}
      </span>
      <span aria-hidden="true">{displayedText}</span>
      {showCursor && (
        <span
          aria-hidden="true"
          className={cn(
            "ml-1 text-[var(--aesthetic-accent)]",
            !reducedMotion && "animate-[typewriter-blink_1.06s_steps(1,end)_infinite]"
          )}
        >
          ▏
        </span>
      )}
    </motion.div>
  );
}
