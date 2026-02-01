import React, { useState } from "react";
import { type ComponentRendererProps } from "../registry";
import { type Image as ImageNode } from "@/lib/a2ui/catalog/components";
import { getCommonStyles } from "../layout/utils";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

// Resolve dynamic string helper (duplicate from Text, maybe move to utils later)
const resolveText = (text: unknown): string => {
  if (typeof text === "string") return text;
  if (typeof text === "number") return String(text);
  if (typeof text === "object" && text !== null && "label" in text) {
    return resolveText((text as Record<string, unknown>).label);
  }
  return "";
};

export const Image: React.FC<ComponentRendererProps> = ({ node, theme = "noir" }) => {
  const imageNode = node as unknown as ImageNode;
  const nodeAsRecord = node as unknown as Record<string, unknown>;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fallback to 'src' for v0.8
  const src = resolveText(imageNode.url || nodeAsRecord.src);
  // Prioritize accessibility.label for alt text, fallback to alt prop
  const alt = resolveText(imageNode.accessibility?.label || nodeAsRecord.alt) || "Image";

  const fit = imageNode.fit || "cover";

  // Support style prop
  const style = nodeAsRecord.style;

  const objectFitClass =
    {
      contain: "object-contain",
      cover: "object-cover",
      fill: "object-fill",
      none: "object-none",
      "scale-down": "object-scale-down",
    }[fit] || "object-cover";

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 rounded-md p-8 text-gray-400",
          theme === "noir" && "bg-noir-black/45 text-noir-gray/40 border border-noir-gray/20",
          getCommonStyles({ style: style as Record<string, unknown> | undefined })
        )}
      >
        <div className="text-center">
          <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <span className="text-xs font-mono">IMAGE CORRUPTED</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        getCommonStyles({ style: style as Record<string, unknown> | undefined })
      )}
    >
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse",
            theme === "noir" ? "bg-noir-gray/20" : "bg-gray-200"
          )}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-auto transition-opacity duration-300",
          objectFitClass,
          isLoading ? "opacity-0" : "opacity-100",
          theme === "noir" && "sepia-[0.3] grayscale-[0.2]" // Noir vibe
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};
