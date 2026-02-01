"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { X, FileText, LayoutGrid, CreditCard, Table, Columns } from "lucide-react";
import { TEMPLATES, type Template } from "@/lib/templates";
import type { A2UIInput } from "@/lib/protocol/schema";

interface TemplatePanelProps {
  onSelect: (data: A2UIInput) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<Template["category"], React.ReactNode> = {
  form: <FileText className="w-4 h-4" />,
  dashboard: <LayoutGrid className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  data: <Table className="w-4 h-4" />,
  layout: <Columns className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<Template["category"], string> = {
  form: "Forms",
  dashboard: "Dashboards",
  card: "Cards",
  data: "Data Display",
  layout: "Layouts",
};

export function TemplatePanel({ onSelect, onClose }: TemplatePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<Template["category"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    let result = TEMPLATES;

    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  const categories: Array<Template["category"] | "all"> = [
    "all",
    "form",
    "card",
    "dashboard",
    "data",
    "layout",
  ];

  return (
    <div className="h-full flex flex-col bg-noir-dark border-l border-noir-gray/20">
      {/* Header */}
      <div className="p-4 border-b border-noir-gray/20 flex items-center justify-between">
        <h2 className="font-typewriter text-sm text-noir-paper/70 uppercase tracking-widest">
          Template Library
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-noir-gray hover:text-noir-amber transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-noir-gray/20">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-noir-black/40 border border-noir-gray/40 rounded-sm text-noir-paper/90 text-xs font-mono placeholder:text-noir-paper/40 focus:outline-none focus:border-noir-amber/60 transition-colors"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b border-noir-gray/20 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors whitespace-nowrap",
              selectedCategory === cat
                ? "bg-noir-amber/20 text-noir-amber border border-noir-amber/40"
                : "text-noir-paper/60 hover:text-noir-amber border border-transparent"
            )}
          >
            {cat !== "all" && CATEGORY_ICONS[cat]}
            {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-noir-paper/50 font-typewriter text-xs uppercase tracking-wider">
            No templates found
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.data)}
              className="w-full text-left p-3 bg-noir-black/30 border border-noir-gray/30 rounded-sm hover:border-noir-amber/50 hover:bg-noir-black/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-noir-paper/40">{CATEGORY_ICONS[template.category]}</span>
                    <span className="font-typewriter text-sm text-noir-paper group-hover:text-noir-amber transition-colors">
                      {template.name}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-noir-paper/50 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>
                <span className="text-[9px] font-mono text-noir-amber/50 uppercase tracking-wider shrink-0">
                  {CATEGORY_LABELS[template.category]}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-noir-gray/20 text-[10px] font-mono text-noir-paper/40 text-center">
        {filteredTemplates.length} template
        {filteredTemplates.length !== 1 ? "s" : ""} available
      </div>
    </div>
  );
}
