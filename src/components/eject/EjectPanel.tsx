"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  exportA2UI,
  exportA2UIAsJSON,
  exportA2UIMultiFile,
  type ExportFile,
} from "@/lib/eject/exportA2UI";
import type { A2UIInput } from "@/lib/protocol/schema";
import { Copy, Check, Code, FileJson, X, FolderOpen } from "lucide-react";

interface EjectPanelProps {
  evidence: A2UIInput | null;
  onClose?: () => void;
  className?: string;
}

type TabType = "react" | "json" | "multifile";

export function EjectPanel({ evidence, onClose, className }: EjectPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("react");
  const [copied, setCopied] = useState(false);

  const reactCode = evidence ? exportA2UI(evidence) : "";
  const jsonCode = evidence ? exportA2UIAsJSON(evidence) : "";
  const multiFiles = evidence ? exportA2UIMultiFile(evidence, "Evidence") : [];

  const getMultiFileContent = (files: ExportFile[]): string => {
    return files.map((f) => `// === ${f.path} ===\n${f.content}`).join("\n\n");
  };

  const currentCode =
    activeTab === "react"
      ? reactCode
      : activeTab === "json"
        ? jsonCode
        : getMultiFileContent(multiFiles);

  const handleCopy = useCallback(async () => {
    if (!currentCode) return;
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  }, [currentCode]);

  if (!evidence) {
    return (
      <div
        className={cn(
          "flex flex-col h-full bg-noir-black/90 border-l border-noir-gray/30",
          className,
        )}
      >
        <div className="p-4 border-b border-noir-gray/30 flex items-center justify-between">
          <h2 className="font-typewriter text-sm text-noir-paper/70 uppercase tracking-widest">
            Eject Mode
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-noir-gray hover:text-noir-amber transition-colors"
              aria-label="Close eject panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-noir-amber/40 mb-4">
              <Code className="w-12 h-12 mx-auto" />
            </div>
            <p className="font-typewriter text-noir-paper/50 text-sm">
              NO EVIDENCE LOADED
            </p>
            <p className="font-mono text-xs text-noir-paper/30 mt-2">
              Generate UI via chat to enable code export
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-noir-black/90 border-l border-noir-gray/30",
        className,
      )}
    >
      <div className="p-4 border-b border-noir-gray/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-typewriter text-sm text-noir-paper/70 uppercase tracking-widest">
            Eject Mode
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-noir-gray hover:text-noir-amber transition-colors"
              aria-label="Close eject panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("react")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest font-typewriter rounded-t-sm border border-b-0 transition-colors",
              activeTab === "react"
                ? "bg-noir-dark border-noir-gray/40 text-noir-amber"
                : "bg-transparent border-transparent text-noir-paper/50 hover:text-noir-paper",
            )}
          >
            <Code className="w-3 h-3" />
            React
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("json")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest font-typewriter rounded-t-sm border border-b-0 transition-colors",
              activeTab === "json"
                ? "bg-noir-dark border-noir-gray/40 text-noir-amber"
                : "bg-transparent border-transparent text-noir-paper/50 hover:text-noir-paper",
            )}
          >
            <FileJson className="w-3 h-3" />
            JSON
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("multifile")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest font-typewriter rounded-t-sm border border-b-0 transition-colors",
              activeTab === "multifile"
                ? "bg-noir-dark border-noir-gray/40 text-noir-amber"
                : "bg-transparent border-transparent text-noir-paper/50 hover:text-noir-paper",
            )}
          >
            <FolderOpen className="w-3 h-3" />
            Multi-File
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-all",
            copied
              ? "bg-noir-amber/20 border-noir-amber/40 text-noir-amber"
              : "bg-noir-dark/80 border-noir-gray/40 text-noir-paper/70 hover:text-noir-amber hover:border-noir-amber/40",
          )}
          aria-label={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>

        <div className="h-full overflow-auto p-4 pt-12">
          <pre className="font-mono text-xs leading-relaxed text-noir-paper/85 whitespace-pre-wrap break-words">
            <code>{currentCode}</code>
          </pre>
        </div>

        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          }}
          aria-hidden="true"
        />
      </div>

      <div className="p-3 border-t border-noir-gray/30 bg-noir-black/50">
        <div className="flex items-center justify-between text-xs font-mono text-noir-paper/40">
          <span>
            {activeTab === "react"
              ? "React + Tailwind"
              : activeTab === "json"
                ? "A2UI JSON"
                : `Multi-File (${multiFiles.length} files)`}
          </span>
          <span>{currentCode.length} chars</span>
        </div>
      </div>
    </div>
  );
}
