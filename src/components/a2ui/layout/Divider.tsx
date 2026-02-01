import React from "react";
import { type ComponentRendererProps } from "../registry";
import { getCommonStyles } from "./utils";
import { cn } from "@/lib/utils";
import type { A2UIInput } from "@/lib/protocol/schema";

type DividerNode = Extract<A2UIInput, { type: "divider" }>;

export const Divider: React.FC<ComponentRendererProps> = ({ node }) => {
  const divNode = node as DividerNode;
  if (divNode.type !== "divider") return null;

  return (
    <div className={cn("w-full flex items-center gap-4 py-2", getCommonStyles(divNode))}>
      <div className="h-px bg-noir-gray/30 flex-1" />
      {divNode.label && (
        <span className="text-xs uppercase tracking-widest text-noir-paper/50 font-typewriter">
          {divNode.label}
        </span>
      )}
      {divNode.label && <div className="h-px bg-noir-gray/30 flex-1" />}
    </div>
  );
};
