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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ChildComponent = useMemo(
    () => (activeTab ? getComponent(activeTab.content.type) : null),
    [activeTab?.content.type]
  );

  return (
    <div
      className={cn(
        "w-full border border-noir-gray/40 bg-noir-black/35 rounded-sm",
        node.style?.width ? widthMap[node.style.width] : null,
        node.style?.className
      )}
    >
      <div className="flex gap-2 border-b border-noir-gray/30 px-2 overflow-x-auto">
        {node.tabs.map((tab, index) => (
          <button
            key={`${tab.label}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-typewriter border-b-2 transition-colors whitespace-nowrap",
              index === activeIndex
                ? "text-noir-amber border-noir-amber"
                : "text-noir-paper/60 border-transparent hover:text-noir-paper"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {/* eslint-disable-next-line react-hooks/static-components */}
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
