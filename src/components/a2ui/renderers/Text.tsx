"use client";

import type { SurfaceComponent } from "@/lib/a2ui/surfaces/manager";
import { getStyleTokens } from "@/lib/aesthetic/identity";
import type { StyleTokens } from "@/lib/aesthetic/types";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "../internal/context";
import { useResolve, useBaseAestheticId } from "../internal/binding";

/**
 * Map the preset's `headerCase` style token to a Tailwind case-transform class
 * applied to surface heading levels (h1–h5) only — body/caption text keeps its
 * authored casing. uppercase → noir/cyber/nostromo, titlecase → gothic,
 * normal → minimal.
 */
function headerCaseClass(headerCase: StyleTokens["headerCase"]): string {
  switch (headerCase) {
    case "uppercase":
      return "uppercase";
    case "titlecase":
      return "capitalize";
    default:
      return "normal-case";
  }
}

export function TextRenderer({ component }: ComponentProps) {
  const resolve = useResolve();
  const baseAestheticId = useBaseAestheticId();
  const text = component as SurfaceComponent & { text?: unknown; variant?: string };

  const content = String(resolve(text.text) ?? "");
  const variant = text.variant || "body";
  const baseClass = "text-[var(--aesthetic-text)] font-mono";
  // Heading case is data-driven from the active world's style tokens so each
  // preset's headings read in character (UPPERCASE noir, Title Gothic, normal
  // minimal) without per-aesthetic branches at the call site.
  const headingCase = headerCaseClass(getStyleTokens(baseAestheticId).headerCase);
  // `a2ui-heading` is the hook for the per-preset editorial heading treatment in
  // globals.css (letter-spacing + weight tuned to each aesthetic), so noir reads
  // as a wide stamped slug, cyber as a tight neon label, nostromo as a spaced
  // terminal banner, gothic as an airy engraved title, and minimal as a calm
  // sans — without swapping the loaded face (which would erase noir's signature
  // typewriter headers). It reaches custom profiles through their base preset.
  const headingClass = "a2ui-heading";

  switch (variant) {
    case "h1":
      return (
        <h1
          className={cn(
            baseClass,
            headingClass,
            headingCase,
            "text-3xl font-bold font-typewriter mb-4"
          )}
        >
          {content}
        </h1>
      );
    case "h2":
      return (
        <h2
          className={cn(
            baseClass,
            headingClass,
            headingCase,
            "text-2xl font-bold font-typewriter mb-3"
          )}
        >
          {content}
        </h2>
      );
    case "h3":
      return (
        <h3
          className={cn(
            baseClass,
            headingClass,
            headingCase,
            "text-xl font-bold font-typewriter mb-2"
          )}
        >
          {content}
        </h3>
      );
    case "h4":
      return (
        <h4 className={cn(baseClass, headingClass, headingCase, "text-lg font-semibold mb-2")}>
          {content}
        </h4>
      );
    case "h5":
      return (
        <h5 className={cn(baseClass, headingClass, headingCase, "text-base font-semibold mb-1")}>
          {content}
        </h5>
      );
    case "caption":
      return <span className={cn(baseClass, "text-xs opacity-70")}>{content}</span>;
    default:
      return <p className={cn(baseClass, "text-sm leading-relaxed")}>{content}</p>;
  }
}
