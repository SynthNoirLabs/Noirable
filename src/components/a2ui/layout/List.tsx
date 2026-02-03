import React from "react";
import { type ComponentRendererProps } from "../registry";
import { getCommonStyles } from "./utils";
import { cn } from "@/lib/utils";
import type { A2UIInput } from "@/lib/protocol/schema";

type ListNode = Extract<A2UIInput, { type: "list" }>;

export const List: React.FC<ComponentRendererProps> = ({ node }) => {
  const listNode = node as ListNode;
  if (listNode.type !== "list") return null;

  const isOrdered = listNode.ordered;
  const Component = isOrdered ? "ol" : "ul";

  return (
    <Component
      className={cn(
        "flex flex-col gap-2 list-inside",
        isOrdered ? "list-decimal" : "list-disc",
        getCommonStyles(listNode)
      )}
    >
      {listNode.items.map((item, index) => (
        <li key={index} className="text-[var(--aesthetic-text)]/90 font-mono text-sm">
          {item}
        </li>
      ))}
    </Component>
  );
};
