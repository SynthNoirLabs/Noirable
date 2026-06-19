"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import type { AestheticId, BuiltInAestheticId, CustomProfileId } from "@/lib/aesthetic/types";
import { BUILT_IN_AESTHETIC_IDS, isBuiltInAestheticId } from "@/lib/aesthetic/types";
import { getAestheticDefinition, AESTHETIC_DEFINITIONS } from "@/lib/aesthetic/definitions";
import { WorldGalleryTile } from "@/components/settings/WorldGalleryTile";

interface DeskWorld {
  id: AestheticId;
  name: string;
  baseAestheticId: BuiltInAestheticId;
  isBuiltIn: boolean;
}

/**
 * A first-class, on-desk world switcher: a compact toolbar button that opens a
 * popover gallery of "living world tiles". Selecting one writes the active
 * aesthetic/profile to the stores; DetectiveWorkspace observes that via
 * useWorldSwitch and plays the SAME cinematic switch the rest of the app uses
 * (this component never reimplements the transition). Promotes the 5 worlds out
 * of the buried Customization dropdown onto the desk itself.
 */
export function WorldSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { settings, updateSettings } = useA2UIStore();
  const customProfiles = useCustomProfileStore((state) => state.customProfiles);
  const setActiveProfile = useCustomProfileStore((state) => state.setActiveProfile);

  const currentAestheticId: AestheticId = settings.aestheticId || "noir";
  const activeDefinition = getAestheticDefinition(currentAestheticId);
  const activeName =
    customProfiles.find((p) => p.id === currentAestheticId)?.name ?? activeDefinition.name;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const builtInWorlds: DeskWorld[] = BUILT_IN_AESTHETIC_IDS.map((id) => ({
    id,
    name: AESTHETIC_DEFINITIONS[id].name,
    baseAestheticId: id,
    isBuiltIn: true,
  }));
  const customWorlds: DeskWorld[] = customProfiles.map((p) => ({
    id: p.id as AestheticId,
    name: p.name,
    baseAestheticId: p.baseAestheticId,
    isBuiltIn: false,
  }));

  const handleSelect = (id: AestheticId) => {
    if (isBuiltInAestheticId(id)) {
      updateSettings({ aestheticId: id });
      setActiveProfile(null);
    } else {
      updateSettings({ aestheticId: id });
      setActiveProfile(id as CustomProfileId);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Switch world (current: ${activeName})`}
        title={`Switch world — currently ${activeName}`}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border rounded-sm transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]",
          isOpen
            ? "bg-[var(--aesthetic-accent)]/20 border-[var(--aesthetic-accent)]/40 text-[var(--aesthetic-accent)]"
            : "bg-[var(--aesthetic-background)]/50 border-[var(--aesthetic-border)]/40 text-[var(--aesthetic-text)]/60 hover:text-[var(--aesthetic-accent)] hover:border-[var(--aesthetic-accent)]/40"
        )}
      >
        <Globe className="w-3 h-3" />
        World
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-[320px] max-h-[60vh] overflow-y-auto rounded-sm border border-[var(--aesthetic-border)]/40 bg-[var(--aesthetic-surface)]/95 p-3 shadow-xl backdrop-blur-md space-y-3"
          role="listbox"
          aria-label="Choose a world"
        >
          <div className="px-1 text-[10px] font-mono text-[var(--aesthetic-text-muted)]/60 uppercase tracking-wider">
            Built-in
          </div>
          <div className="grid grid-cols-2 gap-2">
            {builtInWorlds.map((world) => (
              <WorldGalleryTile
                key={world.id}
                id={world.id}
                name={world.name}
                baseAestheticId={world.baseAestheticId}
                isActive={currentAestheticId === world.id}
                isBuiltIn
                onSelect={handleSelect}
              />
            ))}
          </div>
          {customWorlds.length > 0 && (
            <>
              <div className="px-1 text-[10px] font-mono text-[var(--aesthetic-text-muted)]/60 uppercase tracking-wider">
                Custom
              </div>
              <div className="grid grid-cols-2 gap-2">
                {customWorlds.map((world) => (
                  <WorldGalleryTile
                    key={world.id}
                    id={world.id}
                    name={world.name}
                    baseAestheticId={world.baseAestheticId}
                    isActive={currentAestheticId === world.id}
                    isBuiltIn={false}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
