import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Server, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelConfig, AIProviderType, AVAILABLE_MODELS } from "@/lib/store/useA2UIStore";

interface ModelSelectorProps {
  modelConfig: ModelConfig;
  onConfigChange: (config: ModelConfig) => void;
}

const PROVIDERS: { id: AIProviderType; label: string }[] = [
  { id: "auto", label: "Auto-Detect" },
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google Gemini" },
  { id: "openai-compatible", label: "Custom (OpenAI Compatible)" },
];

export function ModelSelector({ modelConfig, onConfigChange }: ModelSelectorProps) {
  const [activeDropdown, setActiveDropdown] = useState<"provider" | "model" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProviderChange = (provider: AIProviderType) => {
    const defaultModel =
      provider === "auto"
        ? ""
        : provider === "openai-compatible"
          ? ""
          : AVAILABLE_MODELS[provider]?.[0] || "";

    onConfigChange({
      provider,
      model: defaultModel,
    });
    setActiveDropdown(null);
  };

  const handleModelChange = (model: string) => {
    onConfigChange({
      ...modelConfig,
      model,
    });
    setActiveDropdown(null);
  };

  const isCustomProvider = modelConfig.provider === "openai-compatible";
  const isAutoProvider = modelConfig.provider === "auto";
  const currentProviderLabel =
    PROVIDERS.find((p) => p.id === modelConfig.provider)?.label || modelConfig.provider;

  const availableModels =
    !isCustomProvider && !isAutoProvider ? AVAILABLE_MODELS[modelConfig.provider] || [] : [];

  return (
    <div className="space-y-4 py-2" ref={containerRef}>
      <div className="flex items-center gap-2 mb-1 opacity-50">
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
        <span className="text-[10px] font-mono text-[var(--aesthetic-accent)] uppercase tracking-widest">
          Neural Link
        </span>
        <div className="h-px bg-[var(--aesthetic-border)]/30 flex-1" />
      </div>

      <div className="space-y-1.5 relative">
        <label className="text-[10px] font-typewriter text-[var(--aesthetic-text)]/60 uppercase tracking-wider flex items-center gap-1.5">
          <Server className="w-3 h-3 text-[var(--aesthetic-accent)]/70" />
          Provider Protocol
        </label>

        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === "provider" ? null : "provider")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-all duration-200",
              "bg-[var(--aesthetic-surface)]/50 border rounded-sm outline-none focus:ring-1 focus:ring-[var(--aesthetic-accent)]/30",
              activeDropdown === "provider"
                ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/5"
                : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text)] hover:border-[var(--aesthetic-border)]/60 hover:bg-[var(--aesthetic-text)]/5"
            )}
          >
            <span className="truncate">{currentProviderLabel}</span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-200 opacity-70",
                activeDropdown === "provider" && "rotate-180 text-[var(--aesthetic-accent)]"
              )}
            />
          </button>

          <AnimatePresence>
            {activeDropdown === "provider" && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "circOut" }}
                className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/95 shadow-xl backdrop-blur-md"
              >
                <div className="max-h-[200px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[var(--aesthetic-border)]/20">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderChange(provider.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between group transition-colors",
                        modelConfig.provider === provider.id
                          ? "bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-accent)] border-l-2 border-l-[var(--aesthetic-accent)] pl-[10px]"
                          : "text-[var(--aesthetic-text)]/80 hover:bg-[var(--aesthetic-text)]/5 hover:text-[var(--aesthetic-text)] border-l-2 border-l-transparent"
                      )}
                    >
                      <span>{provider.label}</span>
                      {modelConfig.provider === provider.id && (
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

      <div className="space-y-1.5 relative">
        <label className="text-[10px] font-typewriter text-[var(--aesthetic-text)]/60 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-[var(--aesthetic-accent)]/70" />
          Model Architecture
        </label>

        {isAutoProvider ? (
          <div className="w-full px-3 py-2 text-xs font-mono text-[var(--aesthetic-text-muted)]/50 bg-[var(--aesthetic-background)]/30 border border-[var(--aesthetic-border)]/10 rounded-sm flex items-center gap-2 cursor-not-allowed italic">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--aesthetic-accent)]/30 animate-pulse" />
            Auto-Detecting Optimal Model...
          </div>
        ) : isCustomProvider ? (
          <div className="relative group">
            <input
              type="text"
              value={modelConfig.model}
              onChange={(e) => handleModelChange(e.target.value)}
              placeholder="Enter model ID (e.g. llama-3-70b)"
              className="w-full bg-transparent border-b border-[var(--aesthetic-border)]/30 py-2 pl-0 pr-8 text-xs font-mono text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)]/30 focus:outline-none focus:border-[var(--aesthetic-accent)] transition-colors"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-[var(--aesthetic-text-muted)]/40 pointer-events-none group-focus-within:text-[var(--aesthetic-accent)]/70 transition-colors uppercase tracking-tight">
              Custom ID
            </div>
            <div className="absolute bottom-0 left-0 w-0 h-px bg-[var(--aesthetic-accent)] transition-all duration-300 group-focus-within:w-full" />
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "model" ? null : "model")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-all duration-200",
                "bg-[var(--aesthetic-surface)]/50 border rounded-sm outline-none focus:ring-1 focus:ring-[var(--aesthetic-accent)]/30",
                activeDropdown === "model"
                  ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/5"
                  : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text)] hover:border-[var(--aesthetic-border)]/60 hover:bg-[var(--aesthetic-text)]/5"
              )}
            >
              <span className="truncate">{modelConfig.model || "Select Model..."}</span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform duration-200 opacity-70",
                  activeDropdown === "model" && "rotate-180 text-[var(--aesthetic-accent)]"
                )}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === "model" && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "circOut" }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/95 shadow-xl backdrop-blur-md"
                >
                  <div className="max-h-[200px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[var(--aesthetic-border)]/20">
                    {availableModels.length > 0 ? (
                      availableModels.map((model) => (
                        <button
                          key={model}
                          onClick={() => handleModelChange(model)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between group transition-colors",
                            modelConfig.model === model
                              ? "bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-accent)] border-l-2 border-l-[var(--aesthetic-accent)] pl-[10px]"
                              : "text-[var(--aesthetic-text)]/80 hover:bg-[var(--aesthetic-text)]/5 hover:text-[var(--aesthetic-text)] border-l-2 border-l-transparent"
                          )}
                        >
                          <span className="truncate">{model}</span>
                          {modelConfig.model === model && (
                            <Check className="w-3 h-3 text-[var(--aesthetic-accent)]" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-[var(--aesthetic-text-muted)]/50 italic text-[10px]">
                        No known models available
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--aesthetic-border)]/20 to-transparent mt-2" />
    </div>
  );
}
