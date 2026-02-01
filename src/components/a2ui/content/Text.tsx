import React from "react";
import { type ComponentRendererProps } from "../registry";
import { type Text as TextNode } from "@/lib/a2ui/catalog/components";
import { getCommonStyles } from "../layout/utils";
import { cn } from "@/lib/utils";

// Helper to resolve dynamic string (basic implementation)
const resolveText = (text: unknown): string => {
  if (typeof text === "string") return text;
  if (typeof text === "number") return String(text);
  return ""; // Handle objects/bindings gracefully or fallback
};

export const Text: React.FC<ComponentRendererProps> = ({ node, theme = "noir" }) => {
  const textNode = node as unknown as TextNode;
  const nodeAsRecord = node as unknown as Record<string, unknown>;

  // Resolve content: prefer v0.9 'text', fallback to v0.8 'content', then 'text' property from legacy nodes
  const content = resolveText(textNode.text || nodeAsRecord.content || nodeAsRecord.text);

  // Resolve variant: v0.9 'variant', fallback to 'level' mapping for headings, or default to 'body'
  let variant = textNode.variant;
  if (!variant) {
    const level = nodeAsRecord.level;
    if (level) {
      variant = `h${level}` as unknown as typeof textNode.variant;
    } else if (nodeAsRecord.type === "heading") {
      variant = "h2"; // Default heading level
    } else if (nodeAsRecord.type === "caption") {
      // assuming caption might exist as type
      variant = "caption";
    } else {
      variant = "body";
    }
  }

  // Support style prop even if not strictly in v0.9 schema yet
  const style = nodeAsRecord.style;

  const commonClasses = cn(
    getCommonStyles({ style: style as Record<string, unknown> | undefined }),
    theme === "noir" ? "text-noir-paper" : "text-gray-900"
  );

  switch (variant) {
    case "h1":
      return (
        <h1 className={cn("text-3xl font-bold font-typewriter mb-4", commonClasses)}>{content}</h1>
      );
    case "h2":
      return (
        <h2 className={cn("text-2xl font-bold font-typewriter mb-3", commonClasses)}>{content}</h2>
      );
    case "h3":
      return (
        <h3 className={cn("text-xl font-bold font-typewriter mb-2", commonClasses)}>{content}</h3>
      );
    case "h4":
      return (
        <h4 className={cn("text-lg font-bold font-typewriter mb-2", commonClasses)}>{content}</h4>
      );
    case "h5":
      return (
        <h5 className={cn("text-base font-bold font-typewriter mb-1", commonClasses)}>{content}</h5>
      );
    case "caption":
      return <span className={cn("text-xs font-mono opacity-70", commonClasses)}>{content}</span>;
    case "body":
    default:
      return <p className={cn("text-sm font-mono leading-relaxed", commonClasses)}>{content}</p>;
  }
};
