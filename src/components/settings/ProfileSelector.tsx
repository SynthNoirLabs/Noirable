"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Plus, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomProfileStore } from "@/lib/store/useCustomProfileStore";
import { useA2UIStore } from "@/lib/store/useA2UIStore";
import type { CustomProfileId, AestheticId } from "@/lib/aesthetic/types";
import { isBuiltInAestheticId } from "@/lib/aesthetic/types";

interface ProfileOption {
  id: AestheticId;
  name: string;
  isBuiltIn: boolean;
}

const BUILT_IN_PROFILES: ProfileOption[] = [
  { id: "noir", name: "Noir Detective", isBuiltIn: true },
  { id: "minimal", name: "Minimal", isBuiltIn: true },
];

export function ProfileSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileBase, setNewProfileBase] = useState<"noir" | "minimal">("noir");
  const containerRef = useRef<HTMLDivElement>(null);

  const { customProfiles, createProfile, deleteProfile, cloneProfile, setActiveProfile } =
    useCustomProfileStore();
  const { settings, updateSettings } = useA2UIStore();

  const currentAestheticId = settings.aestheticId || "noir";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Combine built-in and custom profiles
  const allProfiles: ProfileOption[] = [
    ...BUILT_IN_PROFILES,
    ...customProfiles.map((p) => ({
      id: p.id as AestheticId,
      name: p.name,
      isBuiltIn: false,
    })),
  ];

  const currentProfile =
    allProfiles.find((p) => p.id === currentAestheticId) || BUILT_IN_PROFILES[0];

  const handleSelectProfile = (id: AestheticId) => {
    if (isBuiltInAestheticId(id)) {
      updateSettings({ aestheticId: id });
      setActiveProfile(null);
    } else {
      updateSettings({ aestheticId: id });
      setActiveProfile(id as CustomProfileId);
    }
    setIsOpen(false);
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
    const sourceName = allProfiles.find((p) => p.id === sourceId)?.name || "Profile";
    const cloned = cloneProfile(sourceId as CustomProfileId, `${sourceName} (Copy)`);
    if (cloned) {
      handleSelectProfile(cloned.id);
    }
  };

  const handleDeleteProfile = (id: CustomProfileId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this profile? This cannot be undone.")) {
      deleteProfile(id);
      if (currentAestheticId === id) {
        handleSelectProfile("noir");
      }
    }
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <label className="text-[10px] font-mono text-[var(--aesthetic-text)]/60 uppercase tracking-wider">
        Active Profile
      </label>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 text-sm font-mono transition-all",
            "bg-[var(--aesthetic-surface)]/50 border rounded-sm",
            isOpen
              ? "border-[var(--aesthetic-accent)] text-[var(--aesthetic-accent)]"
              : "border-[var(--aesthetic-border)]/30 text-[var(--aesthetic-text)] hover:border-[var(--aesthetic-border)]/60"
          )}
        >
          <span className="truncate">{currentProfile.name}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 z-50 rounded-sm border border-[var(--aesthetic-border)]/30 bg-[var(--aesthetic-surface)]/95 shadow-xl backdrop-blur-md overflow-hidden"
            >
              <div className="max-h-[280px] overflow-y-auto">
                {/* Built-in profiles */}
                <div className="px-2 py-1.5 text-[10px] font-mono text-[var(--aesthetic-text-muted)]/60 uppercase tracking-wider border-b border-[var(--aesthetic-border)]/10">
                  Built-in
                </div>
                {BUILT_IN_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm font-mono transition-colors group",
                      currentAestheticId === profile.id
                        ? "bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-accent)]"
                        : "text-[var(--aesthetic-text)]/80 hover:bg-[var(--aesthetic-text)]/5"
                    )}
                  >
                    <span>{profile.name}</span>
                    <div className="flex items-center gap-1">
                      {currentAestheticId === profile.id && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                ))}

                {/* Custom profiles */}
                {customProfiles.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-mono text-[var(--aesthetic-text-muted)]/60 uppercase tracking-wider border-b border-t border-[var(--aesthetic-border)]/10">
                      Custom
                    </div>
                    {customProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm font-mono transition-colors group",
                          currentAestheticId === profile.id
                            ? "bg-[var(--aesthetic-accent)]/10 text-[var(--aesthetic-accent)]"
                            : "text-[var(--aesthetic-text)]/80 hover:bg-[var(--aesthetic-text)]/5"
                        )}
                      >
                        <button
                          onClick={() => handleSelectProfile(profile.id)}
                          className="flex-1 text-left truncate mr-2 focus:outline-none"
                        >
                          {profile.name}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleCloneProfile(profile.id, e)}
                            className="p-1 hover:text-[var(--aesthetic-accent)]"
                            title="Clone profile"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProfile(profile.id, e)}
                            className="p-1 hover:text-[var(--aesthetic-error)]"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {currentAestheticId === profile.id && (
                            <Check className="w-3.5 h-3.5 ml-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Create new button */}
              <div className="border-t border-[var(--aesthetic-border)]/20 p-2">
                <button
                  onClick={() => setShowNewProfileDialog(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono text-[var(--aesthetic-accent)] hover:bg-[var(--aesthetic-accent)]/10 rounded-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Profile
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                  onChange={(e) => setNewProfileBase(e.target.value as "noir" | "minimal")}
                  className="flex-1 px-3 py-2 text-xs bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/30 rounded-sm text-[var(--aesthetic-text)] focus:outline-none focus:border-[var(--aesthetic-accent)]"
                >
                  <option value="noir">Based on Noir</option>
                  <option value="minimal">Based on Minimal</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewProfileDialog(false)}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-[var(--aesthetic-border)]/30 rounded-sm text-[var(--aesthetic-text-muted)] hover:bg-[var(--aesthetic-surface)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim()}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--aesthetic-accent)] text-[var(--aesthetic-background)] rounded-sm hover:bg-[var(--aesthetic-accent)]/90 transition-colors disabled:opacity-50"
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
