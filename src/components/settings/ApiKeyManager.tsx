"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useA2UIStore } from "@/lib/store/useA2UIStore";

type TestStatus = "idle" | "testing" | "success" | "error";

interface ApiKeyInputProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onTest?: () => Promise<boolean>;
  placeholder?: string;
}

function ApiKeyInput({ label, value, onChange, onTest, placeholder }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");

  const handleTest = async () => {
    if (!onTest || !value) return;
    setTestStatus("testing");
    try {
      const success = await onTest();
      setTestStatus(success ? "success" : "error");
      setTimeout(() => setTestStatus("idle"), 3000);
    } catch {
      setTestStatus("error");
      setTimeout(() => setTestStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono text-[var(--aesthetic-text)]/60 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? "text" : "password"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "sk-..."}
            className="w-full px-3 py-2 pr-10 text-sm font-mono bg-[var(--aesthetic-surface)]/30 border border-[var(--aesthetic-border)]/30 rounded-sm text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)]/30 focus:outline-none focus:border-[var(--aesthetic-accent)] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] transition-colors"
            aria-label={showKey ? "Hide key" : "Show key"}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {onTest && (
          <button
            type="button"
            onClick={handleTest}
            disabled={!value || testStatus === "testing"}
            className={cn(
              "px-3 py-2 text-xs font-mono border rounded-sm transition-colors flex items-center gap-1.5 min-w-[80px] justify-center",
              testStatus === "success" && "border-green-500 text-green-500 bg-green-500/10",
              testStatus === "error" &&
                "border-[var(--aesthetic-error)] text-[var(--aesthetic-error)] bg-[var(--aesthetic-error)]/10",
              testStatus === "idle" &&
                "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text-muted)] hover:border-[var(--aesthetic-accent)] hover:text-[var(--aesthetic-accent)]",
              testStatus === "testing" &&
                "border-[var(--aesthetic-accent)]/50 text-[var(--aesthetic-accent)]",
              (!value || testStatus === "testing") && "opacity-50 cursor-not-allowed"
            )}
          >
            {testStatus === "testing" && <Loader2 className="w-3 h-3 animate-spin" />}
            {testStatus === "success" && <Check className="w-3 h-3" />}
            {testStatus === "error" && <X className="w-3 h-3" />}
            {testStatus === "idle"
              ? "Test"
              : testStatus === "testing"
                ? "..."
                : testStatus === "success"
                  ? "OK"
                  : "Fail"}
          </button>
        )}
      </div>
    </div>
  );
}

export function ApiKeyManager() {
  const { settings, updateSettings } = useA2UIStore();
  const apiKeys = settings.apiKeys || {};

  const handleElevenLabsChange = (value: string) => {
    updateSettings({
      apiKeys: {
        ...apiKeys,
        elevenlabs: value || undefined,
      },
    });
  };

  const handleOpenAIChange = (value: string) => {
    updateSettings({
      apiKeys: {
        ...apiKeys,
        openai: value || undefined,
      },
    });
  };

  const testElevenLabs = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/elevenlabs/status", {
        headers: apiKeys.elevenlabs ? { "x-elevenlabs-api-key": apiKeys.elevenlabs } : {},
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 bg-[var(--aesthetic-accent)]/5 border border-[var(--aesthetic-accent)]/20 rounded-sm">
        <AlertTriangle className="w-4 h-4 text-[var(--aesthetic-accent)]" />
        <p className="text-xs text-[var(--aesthetic-text-muted)]">
          API keys are stored locally in your browser. They are never sent to our servers.
        </p>
      </div>

      <ApiKeyInput
        label="ElevenLabs API Key"
        value={apiKeys.elevenlabs}
        onChange={handleElevenLabsChange}
        onTest={testElevenLabs}
        placeholder="xi-..."
      />

      <ApiKeyInput
        label="OpenAI API Key (Optional)"
        value={apiKeys.openai}
        onChange={handleOpenAIChange}
        placeholder="sk-..."
      />

      {(apiKeys.elevenlabs || apiKeys.openai) && (
        <button
          type="button"
          onClick={() => updateSettings({ apiKeys: {} })}
          className="w-full px-3 py-2 text-xs font-mono text-[var(--aesthetic-error)] border border-[var(--aesthetic-error)]/30 rounded-sm hover:bg-[var(--aesthetic-error)]/10 transition-colors"
        >
          Clear All Keys
        </button>
      )}
    </div>
  );
}
