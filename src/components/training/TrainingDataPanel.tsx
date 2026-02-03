"use client";

import { useCallback, useMemo } from "react";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { exportToJSONL, exportToJSON, computeDatasetStats } from "@/lib/training";

interface TrainingDataPanelProps {
  onClose: () => void;
}

export function TrainingDataPanel({ onClose }: TrainingDataPanelProps) {
  const { trainingExamples, removeTrainingExample, clearTrainingExamples, rateTrainingExample } =
    useA2UIStore();

  const stats = useMemo(() => computeDatasetStats(trainingExamples), [trainingExamples]);

  const handleExportJSONL = useCallback(() => {
    const content = exportToJSONL(trainingExamples);
    const blob = new Blob([content], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `synthnoirui-training-${Date.now()}.jsonl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [trainingExamples]);

  const handleExportJSON = useCallback(() => {
    const content = exportToJSON(trainingExamples);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `synthnoirui-training-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [trainingExamples]);

  const handleClear = useCallback(() => {
    if (
      window.confirm(
        `Clear all ${trainingExamples.length} training examples? This cannot be undone.`
      )
    ) {
      clearTrainingExamples();
    }
  }, [clearTrainingExamples, trainingExamples.length]);

  return (
    <div className="h-full flex flex-col bg-[var(--aesthetic-background)]/95 text-[var(--aesthetic-text)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--aesthetic-border)]/30">
        <div>
          <h2 className="font-typewriter text-[var(--aesthetic-accent)] text-lg tracking-wider">
            TRAINING DATA ARCHIVE
          </h2>
          <p className="text-[var(--aesthetic-text)]/60 font-mono text-xs mt-1">
            Phase 1: Data Collection Pipeline
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)] transition-colors text-xl"
          aria-label="Close training panel"
        >
          ×
        </button>
      </div>

      {/* Stats Summary */}
      <div className="p-4 border-b border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-background)]/50">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-typewriter text-[var(--aesthetic-accent)]">
              {stats.totalExamples}
            </div>
            <div className="text-xs text-[var(--aesthetic-text)]/60 font-mono">EXAMPLES</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-typewriter text-[var(--aesthetic-accent)]">
              {stats.ratedExamples}
            </div>
            <div className="text-xs text-[var(--aesthetic-text)]/60 font-mono">RATED</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-typewriter text-[var(--aesthetic-accent)]">
              {Object.keys(stats.byCategory).length}
            </div>
            <div className="text-xs text-[var(--aesthetic-text)]/60 font-mono">CATEGORIES</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-typewriter text-[var(--aesthetic-accent)]">
              {stats.avgComponentTypes.toFixed(1)}
            </div>
            <div className="text-xs text-[var(--aesthetic-text)]/60 font-mono">AVG TYPES</div>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(stats.byCategory).length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--aesthetic-border)]/20">
            <div className="text-xs text-[var(--aesthetic-text)]/60 font-mono mb-2">
              BY CATEGORY:
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <span
                  key={category}
                  className="px-2 py-1 bg-[var(--aesthetic-surface-alt)]/20 rounded text-xs font-mono"
                >
                  {category}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="p-4 border-b border-[var(--aesthetic-border)]/30 flex gap-3">
        <button
          type="button"
          onClick={handleExportJSONL}
          disabled={trainingExamples.length === 0}
          className="px-4 py-2 bg-[var(--aesthetic-accent)]/20 border border-[var(--aesthetic-accent)]/50 text-[var(--aesthetic-accent)] font-typewriter text-xs uppercase tracking-wider rounded-sm hover:bg-[var(--aesthetic-accent)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export JSONL
        </button>
        <button
          type="button"
          onClick={handleExportJSON}
          disabled={trainingExamples.length === 0}
          className="px-4 py-2 bg-[var(--aesthetic-surface-alt)]/20 border border-[var(--aesthetic-border)]/50 text-[var(--aesthetic-text)]/80 font-typewriter text-xs uppercase tracking-wider rounded-sm hover:bg-[var(--aesthetic-surface-alt)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export JSON
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleClear}
          disabled={trainingExamples.length === 0}
          className="px-4 py-2 bg-[var(--aesthetic-error)]/10 border border-[var(--aesthetic-error)]/50 text-[var(--aesthetic-error)] font-typewriter text-xs uppercase tracking-wider rounded-sm hover:bg-[var(--aesthetic-error)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>

      {/* Examples List */}
      <div className="flex-1 overflow-y-auto p-4">
        {trainingExamples.length === 0 ? (
          <div className="text-center py-12 text-[var(--aesthetic-text)]/50">
            <div className="font-typewriter text-lg mb-2">NO DATA COLLECTED</div>
            <p className="font-mono text-xs">
              Training examples will appear here as you use the AI to generate UI.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainingExamples
              .slice()
              .reverse()
              .map((example) => (
                <div
                  key={example.id}
                  className="p-3 bg-[var(--aesthetic-surface-alt)]/10 border border-[var(--aesthetic-border)]/20 rounded-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--aesthetic-text)]/60 font-mono mb-1">
                        {new Date(example.metadata.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-[var(--aesthetic-text)]/90 font-sans truncate">
                        &ldquo;{example.prompt}&rdquo;
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-[var(--aesthetic-accent)]/20 text-[var(--aesthetic-accent)] text-xs font-mono rounded">
                          {example.metadata.category}
                        </span>
                        <span className="px-2 py-0.5 bg-[var(--aesthetic-surface-alt)]/30 text-[var(--aesthetic-text)]/70 text-xs font-mono rounded">
                          {example.metadata.complexity}
                        </span>
                        <span className="px-2 py-0.5 bg-[var(--aesthetic-surface-alt)]/20 text-[var(--aesthetic-text)]/50 text-xs font-mono rounded">
                          {example.metadata.componentsUsed.length} types
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Quality Rating */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => rateTrainingExample(example.id, score)}
                            className={`w-5 h-5 text-xs rounded ${
                              example.metadata.qualityScore === score
                                ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)]"
                                : "bg-[var(--aesthetic-surface-alt)]/30 text-[var(--aesthetic-text)]/50 hover:bg-[var(--aesthetic-surface-alt)]/50"
                            } transition-colors`}
                            title={`Rate ${score}/5`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeTrainingExample(example.id)}
                        className="text-[var(--aesthetic-error)]/60 hover:text-[var(--aesthetic-error)] text-xs font-mono transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--aesthetic-border)]/30 text-center">
        <p className="text-[var(--aesthetic-text)]/40 font-mono text-xs">
          Export JSONL for OpenAI fine-tuning • JSON for backup/analysis
        </p>
      </div>
    </div>
  );
}
