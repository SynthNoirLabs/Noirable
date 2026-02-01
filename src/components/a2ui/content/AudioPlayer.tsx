import React from "react";
import { type ComponentRendererProps } from "../registry";
import { type AudioPlayer as AudioNode } from "@/lib/a2ui/catalog/components";
import { getCommonStyles } from "../layout/utils";
import { cn } from "@/lib/utils";
import { Music } from "lucide-react";

// Helper
const resolveText = (text: unknown): string => {
  if (typeof text === "string") return text;
  return "";
};

export const AudioPlayer: React.FC<ComponentRendererProps> = ({ node, theme = "noir" }) => {
  const audioNode = node as unknown as AudioNode;
  const nodeAsRecord = node as unknown as Record<string, unknown>;
  const src = resolveText(audioNode.url);
  const description = resolveText(audioNode.description);
  const style = nodeAsRecord.style;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-md",
        theme === "noir" ? "bg-noir-black/45 border border-noir-gray/20" : "bg-gray-100",
        getCommonStyles({ style: style as Record<string, unknown> | undefined })
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full",
          theme === "noir" ? "bg-noir-amber/10 text-noir-amber" : "bg-white text-gray-500"
        )}
      >
        <Music className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        {description && (
          <div
            className={cn(
              "text-xs font-mono mb-1 truncate",
              theme === "noir" ? "text-noir-paper/80" : "text-gray-700"
            )}
          >
            {description}
          </div>
        )}
        <audio src={src} controls className="w-full h-8" />
      </div>
    </div>
  );
};
