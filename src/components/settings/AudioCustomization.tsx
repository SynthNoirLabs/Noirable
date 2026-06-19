"use client";

import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { cn } from "@/lib/utils";
import { Play, Volume2, Music, CloudRain } from "lucide-react";
import { getAudioPack } from "@/lib/aesthetic/audio-packs";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { FileUploadField } from "@/components/shared/FileUploadField";
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

  const toggleLiveScore = () => {
    updateSettings({ liveScoreEnabled: !settings.liveScoreEnabled });
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--aesthetic-text)]/60">
              Living score (Lyria RealTime, experimental)
            </span>
            <button
              onClick={toggleLiveScore}
              data-testid="live-score-toggle"
              className={cn(
                "text-[10px] px-2 py-1 rounded border transition-colors font-mono",
                settings.liveScoreEnabled
                  ? "bg-[var(--aesthetic-accent)] text-[var(--aesthetic-bg)] border-[var(--aesthetic-accent)]"
                  : "border-[var(--aesthetic-text)]/30 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-text)]"
              )}
            >
              {settings.liveScoreEnabled ? "ON" : "OFF"}
            </button>
          </div>
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
  const handleUploadSuccess = (url: string) => {
    const updatedAudio = {
      ...(profile.audio || {}),
      customMusicUrl: url,
    };
    updateProfile(profile.id, { audio: updatedAudio });
  };

  const handleRemove = () => {
    const updatedAudio = {
      ...(profile.audio || {}),
    };
    delete updatedAudio.customMusicUrl;

    updateProfile(profile.id, { audio: updatedAudio });
  };

  const currentMusic = profile.audio?.customMusicUrl;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--aesthetic-text-muted)] flex items-center gap-2">
        <Music className="w-4 h-4" />
        Custom Music
      </h3>
      <FileUploadField
        acceptTypes={["audio/mp3", "audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"]}
        maxSizeBytes={20 * 1024 * 1024}
        label="Click to upload music file"
        onUploadSuccess={handleUploadSuccess}
        currentUrl={currentMusic}
        onRemove={handleRemove}
        testIdPrefix="music"
      />
    </div>
  );
}
