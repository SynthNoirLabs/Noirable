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
  low: "text-noir-paper/50",
  normal: "text-noir-paper",
  high: "text-noir-amber",
  critical: "text-noir-red",
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

  useEffect(() => {
    if (effectiveSpeed === 0) {
      setDisplayedText(content);
      return;
    }

    let i = 0;
    setDisplayedText("");
    const timer = setInterval(() => {
      if (i < content.length) {
        setDisplayedText((prev) => prev + content.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setDisplayedText(content);
      }
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
      {displayedText}
      {showCursor && <span className="animate-pulse ml-1 opacity-50">_</span>}
    </motion.div>
  );
}
