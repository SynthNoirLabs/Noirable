"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import type { BuiltInAestheticId, CustomProfileId, AestheticId } from "@/lib/aesthetic/types";
import { BUILT_IN_AESTHETIC_IDS, isBuiltInAestheticId } from "@/lib/aesthetic/types";
import { AESTHETIC_DEFINITIONS } from "@/lib/aesthetic/definitions";
import { WorldGalleryTile } from "./WorldGalleryTile";

interface WorldOption {
  id: AestheticId;
  name: string;
  /** Built-in id this tile derives its palette/font from. */
  baseAestheticId: BuiltInAestheticId;
  isBuiltIn: boolean;
}

const BUILT_IN_WORLDS: WorldOption[] = BUILT_IN_AESTHETIC_IDS.map((id) => ({
  id,
  name: AESTHETIC_DEFINITIONS[id].name,
  baseAestheticId: id,
  isBuiltIn: true,
}));

/**
 * The world picker, promoted from a flat dropdown to a GALLERY of living world
 * tiles: each tile previews its world's real palette + display font so the
 * choice previews itself. Custom/AI-generated profiles appear alongside the
 * built-ins. Selecting a tile drives settings (and the active custom profile),
 * which DetectiveWorkspace observes via useWorldSwitch to play the same
 * cinematic switch the rest of the app uses.
 */
export function ProfileSelector() {
  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileBase, setNewProfileBase] = useState<BuiltInAestheticId>("noir");

  const { customProfiles, createProfile, deleteProfile, cloneProfile, setActiveProfile } =
    useCustomProfileStore();
  const { settings, updateSettings } = useA2UIStore();

  const currentAestheticId = settings.aestheticId || "noir";

  const customWorlds: WorldOption[] = customProfiles.map((p) => ({
    id: p.id as AestheticId,
    name: p.name,
    baseAestheticId: p.baseAestheticId,
    isBuiltIn: false,
  }));

  const handleSelectProfile = (id: AestheticId) => {
    if (isBuiltInAestheticId(id)) {
      updateSettings({ aestheticId: id });
      setActiveProfile(null);
    } else {
      updateSettings({ aestheticId: id });
      setActiveProfile(id as CustomProfileId);
    }
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const profile = createProfile(newProfileName.trim(), newProfileBase);
    handleSelectProfile(profile.id);
    setNewProfileName("");
    setShowNewProfileDialog(false);
  };

  const handleCloneProfile = (sourceId: AestheticId, e: React.MouseEvent) => {
    e.stopPropagation();
    const sourceName = customWorlds.find((p) => p.id === sourceId)?.name || "Profile";
    const cloned = cloneProfile(sourceId as CustomProfileId, `${sourceName} (Copy)`);
    if (cloned) {
      handleSelectProfile(cloned.id);
    }
  };

  const handleDeleteProfile = (id: AestheticId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this profile? This cannot be undone.")) {
      deleteProfile(id as CustomProfileId);
      if (currentAestheticId === id) {
        handleSelectProfile("noir");
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-mono text-[var(--aesthetic-text)]/60 uppercase tracking-wider">
        Active Profile
      </label>

      {/* Built-in worlds */}
      <div className="px-1 text-[10px] font-mono text-[var(--aesthetic-text-muted)]/60 uppercase tracking-wider">
        Built-in
      </div>
      <div role="listbox" aria-label="Built-in worlds" className="grid grid-cols-2 gap-2">
        {BUILT_IN_WORLDS.map((world) => (
          <WorldGalleryTile
            key={world.id}
            id={world.id}
            name={world.name}
            baseAestheticId={world.baseAestheticId}
            isActive={currentAestheticId === world.id}
            isBuiltIn
            onSelect={handleSelectProfile}
          />
        ))}
      </div>

      {/* Custom / AI-generated worlds */}
      {customWorlds.length > 0 && (
        <>
          <div className="px-1 text-[10px] font-mono text-[var(--aesthetic-text-muted)]/60 uppercase tracking-wider">
            Custom
          </div>
          <div role="listbox" aria-label="Custom worlds" className="grid grid-cols-2 gap-2">
            {customWorlds.map((world) => (
              <WorldGalleryTile
                key={world.id}
                id={world.id}
                name={world.name}
                baseAestheticId={world.baseAestheticId}
                isActive={currentAestheticId === world.id}
                isBuiltIn={false}
                onSelect={handleSelectProfile}
                onClone={handleCloneProfile}
                onDelete={handleDeleteProfile}
              />
            ))}
          </div>
        </>
      )}

      {/* Create new */}
      <button
        type="button"
        onClick={() => setShowNewProfileDialog(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono text-[var(--aesthetic-accent)] border border-[var(--aesthetic-border)]/30 hover:bg-[var(--aesthetic-accent)]/10 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
      >
        <Plus className="w-3.5 h-3.5" />
        Create New Profile
      </button>

      {/* New Profile Dialog */}
      <AnimatePresence>
        {showNewProfileDialog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border border-[var(--aesthetic-border)]/30 rounded-sm space-y-3 bg-[var(--aesthetic-surface)]/30">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Profile name..."
                className="w-full px-3 py-2 text-sm bg-transparent border border-[var(--aesthetic-border)]/30 rounded-sm text-[var(--aesthetic-text)] placeholder:text-[var(--aesthetic-text-muted)]/50 focus:outline-none focus:border-[var(--aesthetic-accent)]"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={newProfileBase}
                  onChange={(e) => setNewProfileBase(e.target.value as BuiltInAestheticId)}
                  className="flex-1 px-3 py-2 text-xs bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm text-[var(--aesthetic-text)] focus:outline-none focus:border-[var(--aesthetic-accent)]"
                >
                  {BUILT_IN_AESTHETIC_IDS.map((id) => (
                    <option key={id} value={id}>
                      Based on {AESTHETIC_DEFINITIONS[id].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewProfileDialog(false)}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-[var(--aesthetic-border)]/30 rounded-sm text-[var(--aesthetic-text-muted)] hover:bg-[var(--aesthetic-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim()}
                  title={
                    !newProfileName.trim() ? "Enter a profile name to create" : "Create profile"
                  }
                  className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] rounded-sm hover:bg-[var(--aesthetic-accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aesthetic-accent)]"
                >
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
