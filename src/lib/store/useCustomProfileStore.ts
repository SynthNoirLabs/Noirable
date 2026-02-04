import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CustomProfile } from "@/lib/customization/types";
import type { CustomProfileId } from "@/lib/aesthetic/types";
import {
  saveCustomProfile,
  loadCustomProfiles,
  deleteCustomProfile as deleteFromStorage,
  generateProfileId,
} from "@/lib/customization/storage";

interface CustomProfileState {
  // State
  customProfiles: CustomProfile[];
  activeCustomProfileId: CustomProfileId | null;
  editingProfileId: CustomProfileId | null;

  // Actions
  loadProfiles: () => void;
  createProfile: (name: string, baseAestheticId: "noir" | "minimal") => CustomProfile;
  updateProfile: (
    id: CustomProfileId,
    updates: Partial<Omit<CustomProfile, "id" | "createdAt">>
  ) => void;
  deleteProfile: (id: CustomProfileId) => boolean;
  setActiveProfile: (id: CustomProfileId | null) => void;
  cloneProfile: (sourceId: CustomProfileId, newName: string) => CustomProfile | null;
  setEditingProfile: (id: CustomProfileId | null) => void;

  // Selectors
  getActiveProfile: () => CustomProfile | null;
  getProfileById: (id: CustomProfileId) => CustomProfile | null;
  getProfileList: () => Array<{
    id: CustomProfileId;
    name: string;
    baseAestheticId: "noir" | "minimal";
  }>;
}

export const useCustomProfileStore = create<CustomProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      customProfiles: [],
      activeCustomProfileId: null,
      editingProfileId: null,

      // Load profiles from localStorage
      loadProfiles: () => {
        const profiles = loadCustomProfiles();
        set({ customProfiles: profiles });
      },

      // Create new profile
      createProfile: (name, baseAestheticId) => {
        const now = Date.now();
        const profile: CustomProfile = {
          id: generateProfileId(),
          name,
          baseAestheticId,
          createdAt: now,
          updatedAt: now,
        };

        saveCustomProfile(profile);
        set((state) => ({
          customProfiles: [...state.customProfiles, profile],
        }));

        return profile;
      },

      // Update existing profile
      updateProfile: (id, updates) => {
        set((state) => {
          const profileIndex = state.customProfiles.findIndex((p) => p.id === id);
          if (profileIndex === -1) return state;

          const updatedProfile: CustomProfile = {
            ...state.customProfiles[profileIndex],
            ...updates,
            updatedAt: Date.now(),
          };

          saveCustomProfile(updatedProfile);

          const newProfiles = [...state.customProfiles];
          newProfiles[profileIndex] = updatedProfile;
          return { customProfiles: newProfiles };
        });
      },

      // Delete profile
      deleteProfile: (id) => {
        const state = get();
        const exists = state.customProfiles.some((p) => p.id === id);
        if (!exists) return false;

        deleteFromStorage(id);
        set((state) => ({
          customProfiles: state.customProfiles.filter((p) => p.id !== id),
          activeCustomProfileId:
            state.activeCustomProfileId === id ? null : state.activeCustomProfileId,
          editingProfileId: state.editingProfileId === id ? null : state.editingProfileId,
        }));

        return true;
      },

      // Set active profile
      setActiveProfile: (id) => {
        set({ activeCustomProfileId: id });
      },

      // Clone profile
      cloneProfile: (sourceId, newName) => {
        const state = get();
        const source = state.customProfiles.find((p) => p.id === sourceId);
        if (!source) return null;

        const now = Date.now();
        const cloned: CustomProfile = {
          ...source,
          id: generateProfileId(),
          name: newName,
          createdAt: now,
          updatedAt: now,
        };

        saveCustomProfile(cloned);
        set((state) => ({
          customProfiles: [...state.customProfiles, cloned],
        }));

        return cloned;
      },

      // Set editing profile
      setEditingProfile: (id) => {
        set({ editingProfileId: id });
      },

      // Get active profile
      getActiveProfile: () => {
        const state = get();
        if (!state.activeCustomProfileId) return null;
        return state.customProfiles.find((p) => p.id === state.activeCustomProfileId) ?? null;
      },

      // Get profile by ID
      getProfileById: (id) => {
        return get().customProfiles.find((p) => p.id === id) ?? null;
      },

      // Get profile list (for dropdowns)
      getProfileList: () => {
        return get().customProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          baseAestheticId: p.baseAestheticId,
        }));
      },
    }),
    {
      name: "custom-profiles-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeCustomProfileId: state.activeCustomProfileId,
        // Note: customProfiles are stored separately via storage.ts
        // We only persist the active ID here
      }),
    }
  )
);
