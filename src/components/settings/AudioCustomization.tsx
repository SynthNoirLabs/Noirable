"use client";

import React, { useState } from "react";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { cn } from "@/lib/utils";
import { Play, Volume2, Music, CloudRain } from "lucide-react";
import { getAudioPack } from "@/lib/aesthetic/audio-packs";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import type { CustomProfile, SfxVolumes } from "@/lib/customization/types";
import type { CustomProfileId } from "@/lib/aesthetic/types";

interface AudioCustomizationProps {
  className?: string;
}

const Slider = ({
  label,
  value,
  onChange,
  onPreview,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  onPreview: () => void;
}) => (
  <div className="text-xs font-mono mb-4">
    <div className="flex items-center justify-between text-[var(--aesthetic-text)]/70 mb-2">
      <span className="flex items-center gap-2">{label}</span>
      <div className="flex items-center gap-3">
        <span>{Math.round(value * 100)}%</span>
        <button
          onClick={onPreview}
          className="p-1 hover:bg-[var(--aesthetic-text)]/10 rounded transition-colors"
          title={`Preview ${label}`}
          aria-label={`Preview ${label}`}
        >
          <Play className="w-3 h-3" />
        </button>
      </div>
    </div>
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(value * 100)}
      onChange={(e) => onChange(Number(e.currentTarget.value) / 100)}
      aria-label={`${label} volume`}
      className="w-full accent-[var(--aesthetic-accent)] h-1 bg-[var(--aesthetic-text)]/20 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

export function AudioCustomization({ className }: AudioCustomizationProps) {
  const { settings, updateSettings } = useA2UIStore();

  const { getActiveProfile, updateProfile } = useCustomProfileStore();
  const activeProfile = getActiveProfile();

  // When a custom profile is active, read/write its audio overrides so tuning
  // survives export and profile switching. Otherwise fall back to the global
  // session settings. Mirrors VoiceCustomization's dual-branch persistence.
  const profileAudio = activeProfile?.audio;

  const sfxVolume = (type: "typewriter" | "thunder" | "phone") =>
    profileAudio?.sfxVolumes?.[type] ?? settings.sfxVolumes?.[type] ?? 1;
  const musicVolumeValue = profileAudio?.musicVolume ?? settings.musicVolume ?? 0.5;
  const rainVolumeValue = profileAudio?.ambientRainVolume ?? settings.ambient.rainVolume;
  const crackleVolumeValue = profileAudio?.ambientCrackleVolume ?? settings.ambient.crackleVolume;

  const handlePreview = (
    type: "typewriter" | "thunder" | "phone" | "music" | "rain" | "crackle"
  ) => {
    const audioPack = getAudioPack(
      activeProfile?.baseAestheticId ?? settings.aestheticId ?? "noir"
    );
    let src = "";
    let baseVolume = 1;
    let userVolume = 1;

    if (type === "typewriter" || type === "thunder" || type === "phone") {
      const sfx = audioPack.sfx[type];
      src = sfx.src;
      baseVolume = sfx.volume;
      userVolume = sfxVolume(type);
    } else if (type === "music") {
      src = audioPack.music.src;
      baseVolume = audioPack.music.volume;
      userVolume = musicVolumeValue;
    } else if (type === "rain" && audioPack.ambient.rain) {
      src = audioPack.ambient.rain.src;
      const intensity = settings.ambient.intensity || "medium";
      baseVolume = audioPack.ambient.rain.intensityVolume[intensity];
      userVolume = rainVolumeValue;
    } else if (type === "crackle" && audioPack.ambient.crackle) {
      src = audioPack.ambient.crackle.src;
      baseVolume = audioPack.ambient.crackle.volume;
      userVolume = crackleVolumeValue;
    }

    if (src && typeof Audio !== "undefined") {
      const audio = new Audio(src);
      audio.volume = baseVolume * userVolume;
      audio.play().catch((err) => console.error("Preview failed:", err));
    }
  };

  const updateSfxVolume = (type: "typewriter" | "thunder" | "phone", value: number) => {
    if (activeProfile) {
      // sfxVolumes is a Record over the SFX enum; profile overrides are often
      // partial (one slider touched), so build and assert the merged map.
      const sfxVolumes = {
        ...profileAudio?.sfxVolumes,
        [type]: value,
      } as SfxVolumes;
      updateProfile(activeProfile.id, {
        audio: {
          ...profileAudio,
          sfxVolumes,
        },
      });
      return;
    }

    const currentVolumes = settings.sfxVolumes || {
      typewriter: 1,
      thunder: 1,
      phone: 1,
    };

    updateSettings({
      sfxVolumes: {
        ...currentVolumes,
        [type]: value,
      },
    });
  };

  const updateMusicVolume = (value: number) => {
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        audio: {
          ...profileAudio,
          musicVolume: value,
        },
      });
      return;
    }
    updateSettings({ musicVolume: value });
  };

  const updateAmbientVolume = (type: "rain" | "crackle", value: number) => {
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        audio: {
          ...profileAudio,
          [type === "rain" ? "ambientRainVolume" : "ambientCrackleVolume"]: value,
        },
      });
      return;
    }
    updateSettings({
      ambient: {
        ...settings.ambient,
        [type === "rain" ? "rainVolume" : "crackleVolume"]: value,
      },
    });
  };

  // Enabled toggles remain session-global: the profile schema only stores
  // volumes, and an "off" state is best left to the live session.
  const toggleAmbient = (type: "rain" | "crackle") => {
    updateSettings({
      ambient: {
        ...settings.ambient,
        [type === "rain" ? "rainEnabled" : "crackleEnabled"]:
          !settings.ambient[type === "rain" ? "rainEnabled" : "crackleEnabled"],
      },
    });
  };

  const toggleMusic = () => {
    updateSettings({ musicEnabled: !settings.musicEnabled });
  };

  return (
    <div className={cn("space-y-8 p-4", className)}>
      {/* SFX Section */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-[var(--aesthetic-text)] mb-4 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          SOUND EFFECTS
        </h3>
        <div className="space-y-2">
          <Slider
            label="TYPEWRITER"
            value={sfxVolume("typewriter")}
            onChange={(v) => updateSfxVolume("typewriter", v)}
            onPreview={() => handlePreview("typewriter")}
          />
          <Slider
            label="THUNDER"
            value={sfxVolume("thunder")}
            onChange={(v) => updateSfxVolume("thunder", v)}
            onPreview={() => handlePreview("thunder")}
          />
          <Slider
            label="PHONE"
            value={sfxVolume("phone")}
            onChange={(v) => updateSfxVolume("phone", v)}
            onPreview={() => handlePreview("phone")}
          />
        </div>
      </section>

      {/* Music Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-wider text-[var(--aesthetic-text)] flex items-center gap-2">
            <Music className="w-4 h-4" />
            MUSIC
          </h3>
          <button
            onClick={toggleMusic}
            className={cn(
              "text-[10px] px-2 py-1 rounded border transition-colors font-mono",
              settings.musicEnabled
                ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
                : "border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
            )}
          >
            {settings.musicEnabled ? "ON" : "OFF"}
          </button>
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            !settings.musicEnabled && "opacity-50 pointer-events-none"
          )}
        >
          <Slider
            label="MUSIC VOLUME"
            value={musicVolumeValue}
            onChange={updateMusicVolume}
            onPreview={() => handlePreview("music")}
          />
        </div>
      </section>

      {/* Ambient Section */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-[var(--aesthetic-text)] mb-4 flex items-center gap-2">
          <CloudRain className="w-4 h-4" />
          AMBIENT
        </h3>

        <div className="space-y-6">
          {/* Rain Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[var(--aesthetic-text)]/70">RAIN</span>
              <button
                onClick={() => toggleAmbient("rain")}
                className={cn(
                  "text-[10px] px-2 py-1 rounded border transition-colors font-mono",
                  settings.ambient.rainEnabled
                    ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
                    : "border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
                )}
              >
                {settings.ambient.rainEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div
              className={cn(
                "transition-opacity duration-200",
                !settings.ambient.rainEnabled && "opacity-50 pointer-events-none"
              )}
            >
              <Slider
                label="INTENSITY"
                value={rainVolumeValue}
                onChange={(v) => updateAmbientVolume("rain", v)}
                onPreview={() => handlePreview("rain")}
              />
            </div>
          </div>

          {/* Crackle Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[var(--aesthetic-text)]/70">CRACKLE</span>
              <button
                onClick={() => toggleAmbient("crackle")}
                className={cn(
                  "text-[10px] px-2 py-1 rounded border transition-colors font-mono",
                  settings.ambient.crackleEnabled
                    ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
                    : "border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
                )}
              >
                {settings.ambient.crackleEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div
              className={cn(
                "transition-opacity duration-200",
                !settings.ambient.crackleEnabled && "opacity-50 pointer-events-none"
              )}
            >
              <Slider
                label="VOLUME"
                value={crackleVolumeValue}
                onChange={(v) => updateAmbientVolume("crackle", v)}
                onPreview={() => handlePreview("crackle")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Custom Music Upload Section */}
      {activeProfile && (
        <div className="border-t border-[var(--aesthetic-border)]/20 pt-6">
          <CustomMusicCustomizer profile={activeProfile} updateProfile={updateProfile} />
        </div>
      )}
    </div>
  );
}

interface CustomMusicCustomizerProps {
  profile: CustomProfile;
  updateProfile: (
    id: CustomProfileId,
    updates: Partial<Omit<CustomProfile, "id" | "createdAt">>
  ) => void;
}

function CustomMusicCustomizer({ profile, updateProfile }: CustomMusicCustomizerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only MP3, WAV, WEBM, and OGG audio are allowed.");
      setSuccess(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Max size is 20MB.");
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

      const updatedAudio = {
        ...(profile.audio || {}),
        customMusicUrl: url,
      };

      // Persist updates
      updateProfile(profile.id, { audio: updatedAudio });
      setSuccess("Custom music track updated successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong during upload.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    const updatedAudio = {
      ...(profile.audio || {}),
    };
    delete updatedAudio.customMusicUrl;

    updateProfile(profile.id, { audio: updatedAudio });
    setSuccess("Custom music track removed.");
    setError(null);
  };

  const currentMusic = profile.audio?.customMusicUrl;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--aesthetic-text-muted)] flex items-center gap-2">
        <Music className="w-4 h-4" />
        Custom Music
      </h3>
      <div className="space-y-3">
        {currentMusic ? (
          <div className="flex flex-col gap-2 p-3 bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)] rounded-sm">
            <span
              className="text-xs font-mono text-[var(--aesthetic-text-muted)] truncate"
              data-testid="music-url"
            >
              Current: {currentMusic}
            </span>
            <button
              onClick={handleRemove}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-mono uppercase tracking-wide bg-[var(--aesthetic-error)] hover:opacity-90 text-[var(--aesthetic-text)] transition-colors rounded-sm"
              data-testid="remove-music"
            >
              Remove Music
            </button>
          </div>
        ) : (
          <p className="text-xs text-[var(--aesthetic-text-muted)] italic">
            No custom music track uploaded for this profile.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label className="relative flex items-center justify-center border border-dashed border-[var(--aesthetic-border)] hover:border-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-surface)] p-6 rounded-sm cursor-pointer transition-all">
            <input
              type="file"
              accept="audio/mp3, audio/mpeg, audio/wav, audio/webm, audio/ogg"
              onChange={handleFileChange}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              data-testid="music-input"
            />
            <span className="text-sm font-mono text-[var(--aesthetic-text-muted)]">
              {isUploading ? "Uploading..." : "Click to upload music file (Max 20MB)"}
            </span>
          </label>
        </div>

        {error && (
          <p className="text-xs font-mono text-[var(--aesthetic-error)]" data-testid="music-error">
            {error}
          </p>
        )}
        {success && (
          <p
            className="text-xs font-mono text-[var(--aesthetic-accent)]"
            data-testid="music-success"
          >
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
