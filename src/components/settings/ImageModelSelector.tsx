"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageGenerationModels } from "@/lib/ai/model-registry";

interface ImageModelSelectorProps {
  imageModel: string | undefined;
  onImageModelChange: (model: string | undefined) => void;
}

export function ImageModelSelector({ imageModel, onImageModelChange }: ImageModelSelectorProps) {
  const [activeDropdown, setActiveDropdown] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableModels = getImageGenerationModels();

  const handleModelChange = (modelId: string | undefined) => {
    onImageModelChange(modelId);
    setActiveDropdown(false);
  };

  const currentModel = imageModel ? availableModels.find((m) => m.id === imageModel) : null;

  const currentLabel = currentModel ? currentModel.name : "Auto-Detect";

  return (
    <div
      className="space-y-4 py-2 border-t border-[var(--aesthetic-border)]/30 pt-4"
      ref={containerRef}
    >
      <div className="space-y-1.5 relative">
        <label className="text-[10px] font-typewriter text-[var(--aesthetic-text)]/60 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[var(--aesthetic-accent)]/70" aria-hidden="true" />
          Image Generation Model
        </label>

        <div className="relative">
          <button
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={activeDropdown}
            aria-controls="image-model-listbox"
            onClick={() => setActiveDropdown(!activeDropdown)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-all duration-200",
              "bg-[var(--aesthetic-surface)]/50 border rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)] focus-visible:outline-none",
              activeDropdown
                ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/5"
                : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text)] hover:border-[var(--aesthetic-border)]/60 hover:bg-[var(--aesthetic-text)]/5"
            )}
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "w-3 h-3 transition-transform duration-200 opacity-70",
                activeDropdown && "rotate-180 text-[var(--aesthetic-accent)]"
              )}
            />
          </button>

          <AnimatePresence>
            {activeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "circOut" }}
                className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/95 shadow-xl backdrop-blur-md"
              >
                <div
                  id="image-model-listbox"
                  role="listbox"
                  aria-label="Image Generation Model"
                  className="max-h-[220px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[var(--aesthetic-border)]/20"
                >
                  <button
                    role="option"
                    aria-selected={!imageModel || imageModel === "auto"}
                    onClick={() => handleModelChange(undefined)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between group transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aesthetic-accent)] focus-visible:outline-none",
                      !imageModel || imageModel === "auto"
                        ? "bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-accent)] border-l-2 border-l-[var(--aesthetic-accent)] pl-[10px]"
                        : "text-[var(--aesthetic-text)]/80 hover:bg-[var(--aesthetic-text)]/5 hover:text-[var(--aesthetic-text)] border-l-2 border-l-transparent"
                    )}
                  >
                    <span>Auto-Detect (Best Available Key)</span>
                    {(!imageModel || imageModel === "auto") && (
                      <Check className="w-3 h-3 text-[var(--aesthetic-accent)]" />
                    )}
                  </button>

                  <div className="h-px bg-[var(--aesthetic-border)]/20 my-1" />

                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      role="option"
                      aria-selected={imageModel === model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between group transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aesthetic-accent)] focus-visible:outline-none",
                        imageModel === model.id
                          ? "bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-accent)] border-l-2 border-l-[var(--aesthetic-accent)] pl-[10px]"
                          : "text-[var(--aesthetic-text)]/80 hover:bg-[var(--aesthetic-text)]/5 hover:text-[var(--aesthetic-text)] border-l-2 border-l-transparent"
                      )}
                    >
                      <span className="truncate">
                        {model.name}{" "}
                        <span className="opacity-40 text-[9px] uppercase">({model.provider})</span>
                      </span>
                      {imageModel === model.id && (
                        <Check className="w-3 h-3 text-[var(--aesthetic-accent)]" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
