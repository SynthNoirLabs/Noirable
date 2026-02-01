import React from "react";
import { type ComponentRendererProps, getComponent } from "../registry";
import { getCommonStyles } from "./utils";
import { cn } from "@/lib/utils";
import type { A2UIInput } from "@/lib/protocol/schema";

type ColumnNode = Extract<A2UIInput, { type: "column" }>;

export const Column: React.FC<ComponentRendererProps> = ({ node, theme }) => {
  const colNode = node as ColumnNode;
  if (colNode.type !== "column") return null;

  return (
    <div className={cn("flex flex-col", getCommonStyles(colNode))}>
      {colNode.children?.map((child, index) => {
        const ChildComponent = getComponent(child.type);
        return <ChildComponent key={index} node={child} theme={theme} />;
      })}
    </div>
  );
};
