"use client";

import { useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { injectProfileStyles } from "@/lib/customization/css-injection";
import type { ProfileColors, CustomProfile } from "@/lib/customization/types";
import type { CustomProfileId, BuiltInAestheticId } from "@/lib/aesthetic/types";

const PRESET_COLORS: Record<BuiltInAestheticId, Required<ProfileColors>> = {
  noir: {
    background: "#0f0f0f",
    surface: "#1a1a1a",
    surfaceAlt: "#2a2a2a",
    text: "#e0e0e0",
    textMuted: "#a0a0a0",
    accent: "#ffbf00",
    accentMuted: "#b5a642",
    border: "#2a2a2a",
    error: "#8a0000",
  },
  minimal: {
    background: "#ffffff",
    surface: "#f4f4f5",
    surfaceAlt: "#e4e4e7",
    text: "#18181b",
    textMuted: "#71717a",
    accent: "#2563eb",
    accentMuted: "#3b82f6",
    border: "#e4e4e7",
    error: "#dc2626",
  },
  "cyber-fixer": {
    background: "#0a0512",
    surface: "#140c24",
    surfaceAlt: "#251642",
    text: "#f0e6ff",
    textMuted: "#8b72af",
    accent: "#00ffcc",
    accentMuted: "#ff007f",
    border: "#3a1f66",
    error: "#ff3333",
  },
  "nostromo-console": {
    background: "#020804",
    surface: "#05160b",
    surfaceAlt: "#0a2815",
    text: "#33ff66",
    textMuted: "#1d8c3b",
    accent: "#33ff66",
    accentMuted: "#ff9900",
    border: "#0d3b1f",
    error: "#ff3300",
  },
  "gothic-manor": {
    background: "#08080a",
    surface: "#121217",
    surfaceAlt: "#22222b",
    text: "#e1e1e6",
    textMuted: "#82828c",
    accent: "#990011",
    accentMuted: "#4a0008",
    border: "#2a2a35",
    error: "#ff0011",
  },
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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only PNG, JPEG, GIF, and WEBP images are allowed.");
      setSuccess(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Max size is 10MB.");
      setSuccess(null);
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await response.json();

      const updatedProfile = {
        ...profile,
        backgroundImageUrl: url,
      };

      // Live update styles
      injectProfileStyles(updatedProfile);

      // Persist updates
      updateProfile(profile.id, { backgroundImageUrl: url });
      setSuccess("Background image updated successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong during upload.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    const updatedProfile = {
      ...profile,
      backgroundImageUrl: undefined,
    };
    injectProfileStyles(updatedProfile);
    updateProfile(profile.id, { backgroundImageUrl: undefined });
    setSuccess("Background image removed.");
    setError(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--aesthetic-text-muted)]">
        Background Image
      </h3>
      <div className="space-y-3">
        {profile.backgroundImageUrl ? (
          <div className="flex flex-col gap-2 p-3 bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)] rounded-sm">
            <span
              className="text-xs font-mono text-[var(--aesthetic-text-muted)] truncate"
              data-testid="bg-image-url"
            >
              Current: {profile.backgroundImageUrl}
            </span>
            <button
              onClick={handleRemove}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-mono uppercase tracking-wide bg-[var(--aesthetic-error)] hover:opacity-90 text-[var(--aesthetic-text)] transition-colors rounded-sm"
              data-testid="remove-bg-image"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <p className="text-xs text-[var(--aesthetic-text-muted)] italic">
            No custom background image uploaded.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label className="relative flex items-center justify-center border border-dashed border-[var(--aesthetic-border)] hover:border-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-surface)] p-6 rounded-sm cursor-pointer transition-all">
            <input
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              data-testid="bg-image-input"
            />
            <span className="text-sm font-mono text-[var(--aesthetic-text-muted)]">
              {isUploading ? "Uploading..." : "Click to upload background image (Max 10MB)"}
            </span>
          </label>
        </div>

        {error && (
          <p
            className="text-xs font-mono text-[var(--aesthetic-error)]"
            data-testid="bg-image-error"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            className="text-xs font-mono text-[var(--aesthetic-accent)]"
            data-testid="bg-image-success"
          >
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
