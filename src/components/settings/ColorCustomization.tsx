"use client";

import { useState, useCallback } from "react";
import { RotateCcw, ShieldCheck, ShieldAlert, Wand2 } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";
import {
  contrastRatio,
  passesAA,
  nudgeToAA,
  paletteFromAccent,
} from "@/lib/customization/contrast";
import { cn } from "@/lib/utils";
import { FileUploadField } from "@/components/shared/FileUploadField";
import type { ProfileColors, CustomProfile } from "@/lib/customization/types";
import type { CustomProfileId, BuiltInAestheticId } from "@/lib/aesthetic/types";
import { BUILT_IN_AESTHETIC_IDS } from "@/lib/aesthetic/types";
import { AESTHETIC_DEFINITIONS } from "@/lib/aesthetic/definitions";

// Derived from the single source of truth in definitions.ts (ThemeColors and
// ProfileColors share the same nine keys), so a preset's swatches can never
// drift from its definition again.
const PRESET_COLORS: Record<BuiltInAestheticId, Required<ProfileColors>> = Object.fromEntries(
  BUILT_IN_AESTHETIC_IDS.map((id) => [id, AESTHETIC_DEFINITIONS[id].theme.colors])
) as Record<BuiltInAestheticId, Required<ProfileColors>>;

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
  defaultColors: Required<ProfileColors>;
  profileId: CustomProfileId;
  onUpdate: (colors: Required<ProfileColors> | undefined) => void;
}

function ColorEditor({ initialColors, defaultColors, onUpdate }: ColorEditorProps) {
  const [colors, setColors] = useState<Required<ProfileColors>>(initialColors);

  const handleColorChange = (key: keyof ProfileColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    onUpdate(newColors);
  };

  const handleReset = () => {
    setColors(defaultColors);
    onUpdate(undefined); // undefined means "use defaults"
  };

  // WCAG guardrail: body text over the page background. A failing pair is the
  // most common legibility trap when users hand-pick a palette.
  const textRatio = contrastRatio(colors.text, colors.background);
  const textPasses = passesAA(textRatio);

  const handleFixTextToAA = () => {
    const fixed = nudgeToAA(colors.text, colors.background);
    handleColorChange("text", fixed);
  };

  const handleGenerateFromAccent = () => {
    const generated = paletteFromAccent(colors.accent);
    setColors(generated);
    onUpdate(generated);
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

      {/* Contrast guardrail + harmony helpers */}
      <div className="space-y-3 border-t border-[var(--aesthetic-border)]/30 pt-6">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--aesthetic-text-muted)]">
          Accessibility
        </h3>
        <div
          data-testid="contrast-readout"
          className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-sm border text-xs font-mono",
            textPasses
              ? "border-green-500/40 bg-green-500/5 text-green-500"
              : "border-yellow-500/40 bg-yellow-500/5 text-yellow-500"
          )}
        >
          <span className="flex items-center gap-2">
            {textPasses ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            Text on Background: {textRatio.toFixed(2)}:1{" "}
            {textPasses ? "(AA pass)" : "(below AA 4.5:1)"}
          </span>
          {!textPasses && (
            <button
              onClick={handleFixTextToAA}
              data-testid="fix-to-aa"
              className="px-2 py-1 rounded-sm border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 uppercase tracking-wide transition-colors"
            >
              Fix to AA
            </button>
          )}
        </div>

        <button
          onClick={handleGenerateFromAccent}
          data-testid="generate-from-accent"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm border border-[var(--aesthetic-accent)]/50 text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/10 hover:border-[var(--aesthetic-accent)] transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Generate Palette from Accent
        </button>
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

  const baseAestheticId = activeProfile.baseAestheticId || "noir";
  const defaultColors = PRESET_COLORS[baseAestheticId];

  const initialColors = {
    ...defaultColors,
    ...activeProfile.colors,
  };

  return (
    <div className="space-y-8">
      <ColorEditor
        key={activeProfile.id}
        initialColors={initialColors}
        defaultColors={defaultColors}
        profileId={activeProfile.id}
        onUpdate={handleUpdate}
      />
      <div className="border-t border-[var(--aesthetic-border)] pt-6">
        <BackgroundImageCustomizer profile={activeProfile} updateProfile={updateProfile} />
      </div>
    </div>
  );
}

interface BackgroundImageCustomizerProps {
  profile: CustomProfile;
  updateProfile: (
    id: CustomProfileId,
    updates: Partial<Omit<CustomProfile, "id" | "createdAt">>
  ) => void;
}

function BackgroundImageCustomizer({ profile, updateProfile }: BackgroundImageCustomizerProps) {
  const handleUploadSuccess = (url: string) => {
    const updatedProfile = {
      ...profile,
      backgroundImageUrl: url,
    };
    // Live update styles
    injectProfileStyles(updatedProfile);
    // Persist updates
    updateProfile(profile.id, { backgroundImageUrl: url });
  };

  const handleRemove = () => {
    const updatedProfile = {
      ...profile,
      backgroundImageUrl: undefined,
    };
    injectProfileStyles(updatedProfile);
    updateProfile(profile.id, { backgroundImageUrl: undefined });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--aesthetic-text-muted)]">
        Background Image
      </h3>
      <FileUploadField
        acceptTypes={["image/png", "image/jpeg", "image/gif", "image/webp"]}
        maxSizeBytes={10 * 1024 * 1024}
        label="Click to upload background image"
        onUploadSuccess={handleUploadSuccess}
        currentUrl={profile.backgroundImageUrl}
        onRemove={handleRemove}
        testIdPrefix="bg-image"
      />
    </div>
  );
}
