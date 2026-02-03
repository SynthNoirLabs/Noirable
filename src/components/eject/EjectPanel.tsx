"use client";

import React, { useState, useCallback, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import {
  exportA2UI,
  exportA2UIAsJSON,
  exportA2UIMultiFile,
  type ExportFile,
} from "@/lib/eject/exportA2UI";
import type { A2UIInput } from "@/lib/protocol/schema";
import { Copy, Check, Code, FileJson, X, FolderOpen, Play, Download } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Lazy load Sandpack for performance
const SandpackPreview = lazy(() =>
  import("./SandpackPreview").then((m) => ({ default: m.SandpackPreview }))
);

interface EjectPanelProps {
  evidence: A2UIInput | null;
  onClose?: () => void;
  className?: string;
}

type TabType = "react" | "json" | "multifile" | "sandbox";

export function EjectPanel({ evidence, onClose, className }: EjectPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("react");
  const [copied, setCopied] = useState(false);

  const reactCode = evidence ? exportA2UI(evidence) : "";
  const jsonCode = evidence ? exportA2UIAsJSON(evidence) : "";
  const multiFiles = React.useMemo(
    () => (evidence ? exportA2UIMultiFile(evidence, "Evidence") : []),
    [evidence]
  );

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

  const handleDownloadSingle = useCallback(() => {
    if (!reactCode) return;
    const blob = new Blob([reactCode], { type: "text/typescript" });
    saveAs(blob, "EvidenceComponent.tsx");
  }, [reactCode]);

  const handleDownloadZip = useCallback(async () => {
    if (multiFiles.length === 0) return;
    const zip = new JSZip();
    const folder = zip.folder("Evidence");
    if (folder) {
      for (const file of multiFiles) {
        // Remove the folder prefix from path
        const fileName = file.path.replace(/^Evidence\//, "");
        folder.file(fileName, file.content);
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "Evidence.zip");
  }, [multiFiles]);

  if (!evidence) {
    return (
      <div
        className={cn(
          "flex flex-col h-full bg-[var(--aesthetic-background)]/90 border-l border-[var(--aesthetic-border)]/30",
          className
        )}
      >
        <div className="p-4 border-b border-[var(--aesthetic-border)]/30 flex items-center justify-between">
          <h2 className="font-typewriter text-sm text-[var(--aesthetic-text)]/70 uppercase tracking-widest">
            Eject Mode
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-accent)] transition-colors"
              aria-label="Close eject panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-[var(--aesthetic-accent)]/40 mb-4">
              <Code className="w-12 h-12 mx-auto" />
            </div>
            <p className="font-typewriter text-[var(--aesthetic-text)]/50 text-sm">
              NO EVIDENCE LOADED
            </p>
            <p className="font-mono text-xs text-[var(--aesthetic-text)]/30 mt-2">
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
        "flex flex-col h-full bg-[var(--aesthetic-background)]/90 border-l border-[var(--aesthetic-border)]/30",
        className
      )}
    >
      <div className="p-4 border-b border-[var(--aesthetic-border)]/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-typewriter text-sm text-[var(--aesthetic-text)]/70 uppercase tracking-widest">
            Eject Mode
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-accent)] transition-colors"
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
                ? "bg-[var(--aesthetic-surface)] border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-accent)]"
                : "bg-transparent border-transparent text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
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
                ? "bg-[var(--aesthetic-surface)] border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-accent)]"
                : "bg-transparent border-transparent text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
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
                ? "bg-[var(--aesthetic-surface)] border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-accent)]"
                : "bg-transparent border-transparent text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
            )}
          >
            <FolderOpen className="w-3 h-3" />
            Multi-File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sandbox")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest font-typewriter rounded-t-sm border border-b-0 transition-colors",
              activeTab === "sandbox"
                ? "bg-[var(--aesthetic-surface)] border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-accent)]"
                : "bg-transparent border-transparent text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
            )}
          >
            <Play className="w-3 h-3" />
            Sandbox
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === "sandbox" ? (
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-[var(--aesthetic-text)]/50 font-typewriter text-xs uppercase tracking-wider">
                Loading sandbox...
              </div>
            }
          >
            <SandpackPreview evidence={evidence} />
          </Suspense>
        ) : (
          <>
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              {(activeTab === "react" || activeTab === "multifile") && (
                <button
                  type="button"
                  onClick={activeTab === "multifile" ? handleDownloadZip : handleDownloadSingle}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-all bg-[var(--aesthetic-surface)]/80 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
                  aria-label={activeTab === "multifile" ? "Download ZIP" : "Download file"}
                >
                  <Download className="w-3 h-3" />
                  {activeTab === "multifile" ? "ZIP" : "File"}
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-all",
                  copied
                    ? "bg-[var(--aesthetic-accent)]/20 border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)]"
                    : "bg-[var(--aesthetic-surface)]/80 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/70 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
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
            </div>

            <div className="h-full overflow-auto p-4 pt-12">
              <pre className="font-mono text-xs leading-relaxed text-[var(--aesthetic-text)]/85 whitespace-pre-wrap break-words">
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
          </>
        )}
      </div>

      <div className="p-3 border-t border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-background)]/50">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--aesthetic-text)]/40">
          <span>
            {activeTab === "react"
              ? "React + Tailwind"
              : activeTab === "json"
                ? "A2UI JSON"
                : activeTab === "multifile"
                  ? `Multi-File (${multiFiles.length} files)`
                  : "Live Preview"}
          </span>
          <span>{activeTab === "sandbox" ? "Sandpack" : `${currentCode.length} chars`}</span>
        </div>
      </div>
    </div>
  );
}
