import React from "react";
import { type ComponentRendererProps } from "../registry";
import { type Video as VideoNode } from "@/lib/a2ui/catalog/components";
import { getCommonStyles } from "../layout/utils";
import { cn } from "@/lib/utils";

// Helper
const resolveText = (text: unknown): string => {
  if (typeof text === "string") return text;
  return "";
};

export const Video: React.FC<ComponentRendererProps> = ({ node, theme = "noir" }) => {
  const videoNode = node as unknown as VideoNode;
  const nodeAsRecord = node as unknown as Record<string, unknown>;
  const src = resolveText(videoNode.url);
  // Support poster if passed via extra props or binding (not in standard schema yet)
  const poster = nodeAsRecord.poster;
  const style = nodeAsRecord.style;

  return (
    <div
      data-testid="video-container"
      className={cn(
        "relative rounded-md overflow-hidden bg-black",
        getCommonStyles({ style: style as Record<string, unknown> | undefined }),
        "border border-[var(--aesthetic-border)]/20 shadow-lg"
      )}
    >
      <video
        data-testid="video-element"
        src={src}
        poster={typeof poster === "string" ? poster : undefined}
        controls
        className="w-full h-auto"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
