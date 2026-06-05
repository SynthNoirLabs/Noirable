"use client";

import { useState } from "react";
import { Brain, RotateCcw, Save, AlertCircle } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import type { CustomProfile } from "@/lib/customization/types";
import { cn } from "@/lib/utils";

interface PersonaEditorProps {
  activeProfile: CustomProfile;
  updateProfile: (
    id: CustomProfile["id"],
    updates: Partial<Omit<CustomProfile, "id" | "createdAt">>
  ) => void;
}

function PersonaEditor({ activeProfile, updateProfile }: PersonaEditorProps) {
  const [promptValue, setPromptValue] = useState(activeProfile.systemPrompt || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateProfile(activeProfile.id, {
      systemPrompt: promptValue.trim() || undefined,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset the AI persona to the base aesthetic's default?")) {
      setPromptValue("");
      updateProfile(activeProfile.id, { systemPrompt: undefined });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="system-prompt-editor"
          className="text-[10px] font-mono text-[var(--aesthetic-text)]/60 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Brain className="w-3 h-3 text-[var(--aesthetic-accent)]/70" />
          AI System Prompt
        </label>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] hover:bg-[var(--aesthetic-surface)] transition-colors rounded-sm"
          title="Reset to default persona"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Reset Default
        </button>
      </div>

      <div className="relative">
        <textarea
          id="system-prompt-editor"
          value={promptValue}
          onChange={(e) => {
            setPromptValue(e.target.value);
            setIsSaved(false);
          }}
          placeholder="Override the AI's core instructions. E.g. 'You are a cyberpunk tech dealer. Use slang like flatlined, chombatta, chrome...'"
          rows={10}
          className="w-full bg-[var(--aesthetic-surface)]/30 border border-[var(--aesthetic-border)]/30 rounded-sm p-3 text-xs font-mono text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)]/30 focus:outline-none focus:border-[var(--aesthetic-accent)] focus-visible:ring-1 focus-visible:ring-[var(--aesthetic-accent)] resize-y leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--aesthetic-text-muted)] font-mono leading-tight">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--aesthetic-accent)]/70 shrink-0" />
          <span>Keep core directives in mind: the AI must use the generate_ui tool.</span>
        </div>

        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm border transition-colors shrink-0",
            isSaved
              ? "border-green-500 text-green-500 bg-green-500/10"
              : "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/10"
          )}
        >
          <Save className="w-3.5 h-3.5" />
          {isSaved ? "Saved" : "Save Overrides"}
        </button>
      </div>
    </div>
  );
}

export function PersonaCustomization() {
  const { getActiveProfile, updateProfile, activeCustomProfileId } = useCustomProfileStore();
  const activeProfile = getActiveProfile();

  if (!activeCustomProfileId || !activeProfile) {
    return (
      <div className="p-4 text-center border border-dashed border-[var(--aesthetic-border)] rounded-sm">
        <p className="text-sm text-[var(--aesthetic-text-muted)]">
          Create or select a custom profile to customize the AI persona.
        </p>
      </div>
    );
  }

  return (
    <PersonaEditor
      key={activeProfile.id}
      activeProfile={activeProfile}
      updateProfile={updateProfile}
    />
  );
}
