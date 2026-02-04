import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateProfileId,
  saveCustomProfile,
  loadCustomProfiles,
  getProfileById,
  deleteCustomProfile,
  profileExists,
  clearAllProfiles,
} from "./storage";
import type { CustomProfile } from "./types";
import type { CustomProfileId } from "@/lib/aesthetic/types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("storage utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const createTestProfile = (overrides?: Partial<CustomProfile>): CustomProfile => ({
    id: "custom-test-123" as CustomProfileId,
    name: "Test Profile",
    baseAestheticId: "noir",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  describe("generateProfileId", () => {
    it("generates ID starting with custom-", () => {
      const id = generateProfileId();
      expect(id.startsWith("custom-")).toBe(true);
    });

    it("generates unique IDs", () => {
      const ids = new Set([generateProfileId(), generateProfileId(), generateProfileId()]);
      expect(ids.size).toBe(3);
    });
  });

  describe("saveCustomProfile", () => {
    it("saves profile to localStorage", () => {
      const profile = createTestProfile();
      saveCustomProfile(profile);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `synthNoir_profile_${profile.id}`,
        JSON.stringify(profile)
      );
    });

    it("updates profile index", () => {
      const profile = createTestProfile();
      saveCustomProfile(profile);

      // Index should be updated
      const indexCall = localStorageMock.setItem.mock.calls.find(
        (call) => call[0] === "synthNoir_profiles_index"
      );
      expect(indexCall).toBeDefined();
      expect(JSON.parse(indexCall![1])).toContain(profile.id);
    });
  });

  describe("loadCustomProfiles", () => {
    it("returns empty array when no profiles", () => {
      const profiles = loadCustomProfiles();
      expect(profiles).toEqual([]);
    });

    it("loads saved profiles", () => {
      const profile1 = createTestProfile({ id: "custom-1" as CustomProfileId });
      const profile2 = createTestProfile({ id: "custom-2" as CustomProfileId });

      saveCustomProfile(profile1);
      saveCustomProfile(profile2);

      const loaded = loadCustomProfiles();
      expect(loaded).toHaveLength(2);
    });
  });

  describe("getProfileById", () => {
    it("returns profile when exists", () => {
      const profile = createTestProfile();
      saveCustomProfile(profile);

      const loaded = getProfileById(profile.id);
      expect(loaded).toEqual(profile);
    });

    it("returns null when not found", () => {
      const loaded = getProfileById("custom-nonexistent" as CustomProfileId);
      expect(loaded).toBeNull();
    });
  });

  describe("deleteCustomProfile", () => {
    it("removes profile from storage", () => {
      const profile = createTestProfile();
      saveCustomProfile(profile);

      const deleted = deleteCustomProfile(profile.id);
      expect(deleted).toBe(true);
      expect(getProfileById(profile.id)).toBeNull();
    });

    it("returns false when profile does not exist", () => {
      const deleted = deleteCustomProfile("custom-nonexistent" as CustomProfileId);
      expect(deleted).toBe(false);
    });
  });

  describe("profileExists", () => {
    it("returns true when profile exists", () => {
      const profile = createTestProfile();
      saveCustomProfile(profile);
      expect(profileExists(profile.id)).toBe(true);
    });

    it("returns false when profile does not exist", () => {
      expect(profileExists("custom-nonexistent" as CustomProfileId)).toBe(false);
    });
  });

  describe("clearAllProfiles", () => {
    it("removes all profiles", () => {
      saveCustomProfile(createTestProfile({ id: "custom-1" as CustomProfileId }));
      saveCustomProfile(createTestProfile({ id: "custom-2" as CustomProfileId }));

      clearAllProfiles();

      expect(loadCustomProfiles()).toEqual([]);
    });
  });
});
