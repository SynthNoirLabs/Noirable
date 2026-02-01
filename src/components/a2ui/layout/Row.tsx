import React from "react";
import { type ComponentRendererProps } from "../registry";
import { getComponent } from "../registry";
import { getCommonStyles } from "./utils";
import { cn } from "@/lib/utils";
import type { A2UIInput } from "@/lib/protocol/schema";

// Define strict type for Row node to access row-specific properties
type RowNode = Extract<A2UIInput, { type: "row" }>;

export const Row: React.FC<ComponentRendererProps> = ({ node, theme }) => {
  // Cast node to RowNode to access children and style
  const rowNode = node as RowNode;

  if (rowNode.type !== "row") return null;

  return (
    <div
      className={cn(
        "flex flex-row flex-wrap",
        getCommonStyles(rowNode)
        // Row might have justify in style? Schema has align but not justify in style object.
        // Wait, schema `rowSchema` (line 235) only has `style` and `children`.
        // It does NOT have `justify` or `align` as direct props in the OLD schema.
        // But `styleSchema` has `align`. It doesn't have `justify`.
        // So justify is currently NOT supported in the old schema for Row?
        // Let's check schema.ts again.
      )}
    >
      {rowNode.children?.map((child, index) => {
        const ChildComponent = getComponent(child.type);
        return <ChildComponent key={index} node={child} theme={theme} />;
      })}
    </div>
  );
};
