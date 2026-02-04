import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useCustomProfileStore } from "./useCustomProfileStore";
import type { CustomProfileId } from "@/lib/aesthetic/types";

// Mock the storage module
const mockProfiles = new Map<string, unknown>();

vi.mock("@/lib/customization/storage", () => {
  return {
    saveCustomProfile: vi.fn((profile) => mockProfiles.set(profile.id, profile)),
    loadCustomProfiles: vi.fn(() => Array.from(mockProfiles.values())),
    deleteCustomProfile: vi.fn((id) => mockProfiles.delete(id)),
    generateProfileId: vi.fn(
      () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    ),
  };
});

describe("useCustomProfileStore", () => {
  beforeEach(() => {
    // Reset store state
    useCustomProfileStore.setState({
      customProfiles: [],
      activeCustomProfileId: null,
      editingProfileId: null,
    });
    // Clear mock storage
    mockProfiles.clear();
    vi.clearAllMocks();
  });

  describe("createProfile", () => {
    it("creates a new profile with generated ID", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("My Theme", "noir");

      expect(profile.id).toMatch(/^custom-/);
      expect(profile.name).toBe("My Theme");
      expect(profile.baseAestheticId).toBe("noir");
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it("adds profile to customProfiles array", () => {
      const store = useCustomProfileStore.getState();
      store.createProfile("Theme 1", "noir");
      store.createProfile("Theme 2", "minimal");

      const state = useCustomProfileStore.getState();
      expect(state.customProfiles).toHaveLength(2);
    });

    it("creates profile with minimal base aesthetic", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Minimal Theme", "minimal");

      expect(profile.baseAestheticId).toBe("minimal");
    });
  });

  describe("updateProfile", () => {
    it("updates profile properties", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Original", "noir");

      store.updateProfile(profile.id, {
        name: "Updated",
        colors: { accent: "#ff0000" },
      });

      const updated = useCustomProfileStore.getState().getProfileById(profile.id);
      expect(updated?.name).toBe("Updated");
      expect(updated?.colors?.accent).toBe("#ff0000");
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(profile.updatedAt);
    });

    it("does nothing for non-existent profile", () => {
      const store = useCustomProfileStore.getState();
      store.updateProfile("custom-nonexistent" as CustomProfileId, { name: "Test" });

      expect(useCustomProfileStore.getState().customProfiles).toHaveLength(0);
    });

    it("preserves createdAt when updating", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");
      const originalCreatedAt = profile.createdAt;

      store.updateProfile(profile.id, { name: "Updated" });

      const updated = useCustomProfileStore.getState().getProfileById(profile.id);
      expect(updated?.createdAt).toBe(originalCreatedAt);
    });

    it("updates multiple properties at once", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");

      store.updateProfile(profile.id, {
        name: "New Name",
        description: "New Description",
        colors: { accent: "#ff0000", background: "#000000" },
      });

      const updated = useCustomProfileStore.getState().getProfileById(profile.id);
      expect(updated?.name).toBe("New Name");
      expect(updated?.description).toBe("New Description");
      expect(updated?.colors?.accent).toBe("#ff0000");
      expect(updated?.colors?.background).toBe("#000000");
    });
  });

  describe("deleteProfile", () => {
    it("removes profile from store", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("To Delete", "noir");

      const deleted = store.deleteProfile(profile.id);

      expect(deleted).toBe(true);
      expect(useCustomProfileStore.getState().customProfiles).toHaveLength(0);
    });

    it("clears activeCustomProfileId if deleted profile was active", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Active", "noir");
      store.setActiveProfile(profile.id);

      store.deleteProfile(profile.id);

      expect(useCustomProfileStore.getState().activeCustomProfileId).toBeNull();
    });

    it("clears editingProfileId if deleted profile was being edited", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Editing", "noir");
      store.setEditingProfile(profile.id);

      store.deleteProfile(profile.id);

      expect(useCustomProfileStore.getState().editingProfileId).toBeNull();
    });

    it("returns false for non-existent profile", () => {
      const store = useCustomProfileStore.getState();
      const deleted = store.deleteProfile("custom-nonexistent" as CustomProfileId);

      expect(deleted).toBe(false);
    });

    it("preserves other profiles when deleting one", () => {
      const store = useCustomProfileStore.getState();
      const profile1 = store.createProfile("Profile 1", "noir");
      const profile2 = store.createProfile("Profile 2", "minimal");

      store.deleteProfile(profile1.id);

      const state = useCustomProfileStore.getState();
      expect(state.customProfiles).toHaveLength(1);
      expect(state.customProfiles[0].id).toBe(profile2.id);
    });
  });

  describe("cloneProfile", () => {
    it("creates a copy with new ID and name", () => {
      const store = useCustomProfileStore.getState();
      const original = store.createProfile("Original", "noir");
      store.updateProfile(original.id, { colors: { accent: "#ff0000" } });

      const cloned = store.cloneProfile(original.id, "Cloned Theme");

      expect(cloned).not.toBeNull();
      expect(cloned?.id).not.toBe(original.id);
      expect(cloned?.name).toBe("Cloned Theme");
      expect(cloned?.colors?.accent).toBe("#ff0000");
    });

    it("returns null for non-existent source", () => {
      const store = useCustomProfileStore.getState();
      const cloned = store.cloneProfile("custom-nonexistent" as CustomProfileId, "Clone");

      expect(cloned).toBeNull();
    });

    it("preserves all customization properties when cloning", () => {
      const store = useCustomProfileStore.getState();
      const original = store.createProfile("Original", "noir");
      store.updateProfile(original.id, {
        colors: { accent: "#ff0000" },
        fonts: { body: "serif" },
        audio: { musicVolume: 0.5 },
      });

      const cloned = store.cloneProfile(original.id, "Clone");

      expect(cloned?.colors?.accent).toBe("#ff0000");
      expect(cloned?.fonts?.body).toBe("serif");
      expect(cloned?.audio?.musicVolume).toBe(0.5);
    });

    it("adds cloned profile to store", () => {
      const store = useCustomProfileStore.getState();
      const original = store.createProfile("Original", "noir");

      store.cloneProfile(original.id, "Clone");

      const state = useCustomProfileStore.getState();
      expect(state.customProfiles).toHaveLength(2);
    });

    it("preserves baseAestheticId when cloning", () => {
      const store = useCustomProfileStore.getState();
      const original = store.createProfile("Original", "minimal");

      const cloned = store.cloneProfile(original.id, "Clone");

      expect(cloned?.baseAestheticId).toBe("minimal");
    });
  });

  describe("setActiveProfile", () => {
    it("sets the active profile ID", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");

      store.setActiveProfile(profile.id);

      expect(useCustomProfileStore.getState().activeCustomProfileId).toBe(profile.id);
    });

    it("can set to null", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");
      store.setActiveProfile(profile.id);

      store.setActiveProfile(null);

      expect(useCustomProfileStore.getState().activeCustomProfileId).toBeNull();
    });

    it("can switch between profiles", () => {
      const store = useCustomProfileStore.getState();
      const profile1 = store.createProfile("Profile 1", "noir");
      const profile2 = store.createProfile("Profile 2", "minimal");

      store.setActiveProfile(profile1.id);
      expect(useCustomProfileStore.getState().activeCustomProfileId).toBe(profile1.id);

      store.setActiveProfile(profile2.id);
      expect(useCustomProfileStore.getState().activeCustomProfileId).toBe(profile2.id);
    });
  });

  describe("setEditingProfile", () => {
    it("sets the editing profile ID", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");

      store.setEditingProfile(profile.id);

      expect(useCustomProfileStore.getState().editingProfileId).toBe(profile.id);
    });

    it("can set to null", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");
      store.setEditingProfile(profile.id);

      store.setEditingProfile(null);

      expect(useCustomProfileStore.getState().editingProfileId).toBeNull();
    });
  });

  describe("getActiveProfile", () => {
    it("returns the active profile", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Active", "noir");
      store.setActiveProfile(profile.id);

      const active = store.getActiveProfile();

      expect(active?.id).toBe(profile.id);
      expect(active?.name).toBe("Active");
    });

    it("returns null when no active profile", () => {
      const store = useCustomProfileStore.getState();
      expect(store.getActiveProfile()).toBeNull();
    });

    it("returns null when active profile ID is null", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");
      store.setActiveProfile(profile.id);
      store.setActiveProfile(null);

      expect(store.getActiveProfile()).toBeNull();
    });
  });

  describe("getProfileById", () => {
    it("returns profile by ID", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test", "noir");

      const retrieved = store.getProfileById(profile.id);

      expect(retrieved?.id).toBe(profile.id);
      expect(retrieved?.name).toBe("Test");
    });

    it("returns null for non-existent ID", () => {
      const store = useCustomProfileStore.getState();
      const retrieved = store.getProfileById("custom-nonexistent" as CustomProfileId);

      expect(retrieved).toBeNull();
    });
  });

  describe("getProfileList", () => {
    it("returns simplified profile list", () => {
      const store = useCustomProfileStore.getState();
      store.createProfile("Theme A", "noir");
      store.createProfile("Theme B", "minimal");

      const list = store.getProfileList();

      expect(list).toHaveLength(2);
      expect(list[0]).toHaveProperty("id");
      expect(list[0]).toHaveProperty("name");
      expect(list[0]).toHaveProperty("baseAestheticId");
    });

    it("returns empty array when no profiles", () => {
      const store = useCustomProfileStore.getState();
      const list = store.getProfileList();

      expect(list).toEqual([]);
    });

    it("includes correct profile data in list", () => {
      const store = useCustomProfileStore.getState();
      const profile = store.createProfile("Test Theme", "noir");

      const list = store.getProfileList();

      expect(list[0].id).toBe(profile.id);
      expect(list[0].name).toBe("Test Theme");
      expect(list[0].baseAestheticId).toBe("noir");
    });

    it("does not include full profile data in list", () => {
      const store = useCustomProfileStore.getState();
      store.createProfile("Test", "noir");

      const list = store.getProfileList();

      expect(list[0]).not.toHaveProperty("createdAt");
      expect(list[0]).not.toHaveProperty("updatedAt");
      expect(list[0]).not.toHaveProperty("colors");
    });
  });

  describe("loadProfiles", () => {
    it("loads profiles from storage", () => {
      const store = useCustomProfileStore.getState();
      // Create a profile (which saves to mocked storage)
      store.createProfile("Saved Profile", "noir");

      // Reset store state
      useCustomProfileStore.setState({ customProfiles: [] });

      // Load profiles
      store.loadProfiles();

      const state = useCustomProfileStore.getState();
      expect(state.customProfiles).toHaveLength(1);
      expect(state.customProfiles[0].name).toBe("Saved Profile");
    });
  });

  describe("integration scenarios", () => {
    it("handles complete workflow: create, update, set active, clone, delete", () => {
      const store = useCustomProfileStore.getState();

      // Create
      const original = store.createProfile("Original", "noir");
      expect(useCustomProfileStore.getState().customProfiles).toHaveLength(1);

      // Update
      store.updateProfile(original.id, { name: "Updated Original" });
      expect(useCustomProfileStore.getState().customProfiles[0].name).toBe("Updated Original");

      // Set active
      store.setActiveProfile(original.id);
      expect(useCustomProfileStore.getState().activeCustomProfileId).toBe(original.id);

      // Clone
      const cloned = store.cloneProfile(original.id, "Cloned");
      expect(useCustomProfileStore.getState().customProfiles).toHaveLength(2);
      expect(cloned?.name).toBe("Cloned");

      // Delete original
      store.deleteProfile(original.id);
      expect(useCustomProfileStore.getState().customProfiles).toHaveLength(1);
      expect(useCustomProfileStore.getState().activeCustomProfileId).toBeNull();
    });

    it("maintains consistency when deleting active and editing profiles", () => {
      const store = useCustomProfileStore.getState();
      const profile1 = store.createProfile("Profile 1", "noir");
      const profile2 = store.createProfile("Profile 2", "minimal");

      store.setActiveProfile(profile1.id);
      store.setEditingProfile(profile2.id);

      // Delete active profile
      store.deleteProfile(profile1.id);
      expect(useCustomProfileStore.getState().activeCustomProfileId).toBeNull();
      expect(useCustomProfileStore.getState().editingProfileId).toBe(profile2.id);

      // Delete editing profile
      store.deleteProfile(profile2.id);
      expect(useCustomProfileStore.getState().editingProfileId).toBeNull();
    });
  });
});
