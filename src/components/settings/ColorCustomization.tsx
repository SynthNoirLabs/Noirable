"use client";

import { useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";
import type { ProfileColors } from "@/lib/customization/types";
import type { CustomProfileId } from "@/lib/aesthetic/types";

const DEFAULT_COLORS: Required<ProfileColors> = {
  background: "#0f0f0f",
  surface: "#1a1a1a",
  surfaceAlt: "#2a2a2a",
  text: "#e0e0e0",
  textMuted: "#a0a0a0",
  accent: "#ffbf00",
  accentMuted: "#b5a642",
  border: "#2a2a2a",
  error: "#8a0000",
};

const COLOR_GROUPS = [
  {
    label: "Background & Surface",
    keys: ["background", "surface", "surfaceAlt"] as const,
  },
  {
    label: "Text",
    keys: ["text", "textMuted"] as const,
  },
  {
    label: "Accent",
    keys: ["accent", "accentMuted"] as const,
  },
  {
    label: "Other",
    keys: ["border", "error"] as const,
  },
];

function formatLabel(key: string) {
  const withSpaces = key.replace(/([A-Z])/g, " $1").trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

interface ColorEditorProps {
  initialColors: Required<ProfileColors>;
  profileId: CustomProfileId;
  onUpdate: (colors: Required<ProfileColors> | undefined) => void;
}

function ColorEditor({ initialColors, onUpdate }: ColorEditorProps) {
  const [colors, setColors] = useState<Required<ProfileColors>>(initialColors);

  const handleColorChange = (key: keyof ProfileColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    onUpdate(newColors);
  };

  const handleReset = () => {
    setColors(DEFAULT_COLORS);
    onUpdate(undefined); // undefined means "use defaults"
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-[var(--aesthetic-text-muted)] hover:text-[var(--aesthetic-text)] hover:bg-[var(--aesthetic-surface)] transition-colors rounded-sm"
          title="Reset to defaults"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      <div className="space-y-6">
        {COLOR_GROUPS.map((group) => (
          <div key={group.label} className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--aesthetic-text-muted)]">
              {group.label}
            </h3>
            <div className="grid gap-3">
              {group.keys.map((key) => (
                <div key={key} className="flex items-center justify-between group">
                  <label
                    htmlFor={`color-${key}`}
                    className="text-sm font-mono text-[var(--aesthetic-text)] group-hover:text-[var(--aesthetic-accent)] transition-colors cursor-pointer"
                  >
                    {formatLabel(key)}
                  </label>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--aesthetic-text-muted)] uppercase">
                      {colors[key]}
                    </span>
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[var(--aesthetic-border)] overflow-hidden">
                      <input
                        id={`color-${key}`}
                        type="color"
                        value={colors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="absolute inset-[-50%] w-[200%] h-[200%] p-0 m-0 border-0 cursor-pointer outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColorCustomization() {
  const { getActiveProfile, updateProfile, activeCustomProfileId } = useCustomProfileStore();

  const activeProfile = getActiveProfile();

  const handleUpdate = useCallback(
    (newColors: Required<ProfileColors> | undefined) => {
      if (activeProfile) {
        const updatedProfile = {
          ...activeProfile,
          colors: newColors,
        };

        // Inject immediately for live preview
        injectProfileStyles(updatedProfile);

        // Persist to store
        updateProfile(activeProfile.id, { colors: newColors });
      }
    },
    [activeProfile, updateProfile]
  );

  if (!activeCustomProfileId || !activeProfile) {
    return (
      <div className="p-4 text-center border border-dashed border-[var(--aesthetic-border)] rounded-sm">
        <p className="text-sm text-[var(--aesthetic-text-muted)]">
          Create or select a custom profile to customize colors.
        </p>
      </div>
    );
  }

  const initialColors = {
    ...DEFAULT_COLORS,
    ...activeProfile.colors,
  };

  return (
    <ColorEditor
      key={activeProfile.id}
      initialColors={initialColors}
      profileId={activeProfile.id}
      onUpdate={handleUpdate}
    />
  );
}
