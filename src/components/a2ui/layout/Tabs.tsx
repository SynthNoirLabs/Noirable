/* eslint-disable react-hooks/static-components -- Dynamic component registry pattern */
import React, { useState, useMemo } from "react";
import { type ComponentRendererProps, getComponent } from "../registry";
import { widthMap } from "./utils";
import { cn } from "@/lib/utils";
import type { A2UIInput } from "@/lib/protocol/schema";

type TabsNode = Extract<A2UIInput, { type: "tabs" }>;

const TabsContent: React.FC<{
  node: TabsNode;
  theme?: "noir" | "standard";
}> = ({ node, theme }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeTab = node.tabs[activeIndex];
  const ChildComponent = useMemo(
    () => (activeTab ? getComponent(activeTab.content.type) : null),
    [activeTab]
  );

  return (
    <div
      className={cn(
        "w-full border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-background)]/35 rounded-sm",
        node.style?.width ? widthMap[node.style.width] : null,
        node.style?.className
      )}
    >
      <div className="flex gap-2 border-b border-[var(--aesthetic-border)]/30 px-2 overflow-x-auto">
        {node.tabs.map((tab, index) => (
          <button
            key={`${tab.label}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-typewriter border-b-2 transition-colors whitespace-nowrap",
              index === activeIndex
                ? "text-[var(--aesthetic-accent)] border-[var(--aesthetic-accent)]"
                : "text-[var(--aesthetic-text)]/60 border-transparent hover:text-[var(--aesthetic-text)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {activeTab && ChildComponent && <ChildComponent node={activeTab.content} theme={theme} />}
      </div>
    </div>
  );
};

export const Tabs: React.FC<ComponentRendererProps> = ({ node, theme }) => {
  const tabsNode = node as TabsNode;

  if (tabsNode.type !== "tabs") return null;

  return <TabsContent node={tabsNode} theme={theme} />;
};
