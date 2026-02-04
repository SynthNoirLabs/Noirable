import type { CustomProfile } from "./types";
import { validateCustomProfile } from "./types";
import type { CustomProfileId } from "@/lib/aesthetic/types";

const STORAGE_KEY_PREFIX = "synthNoir_profile_";
const PROFILES_INDEX_KEY = "synthNoir_profiles_index";

/**
 * Generate a unique custom profile ID
 */
export function generateProfileId(): CustomProfileId {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `custom-${timestamp}-${random}`;
}

/**
 * Get list of all profile IDs from index
 */
function getProfileIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const index = localStorage.getItem(PROFILES_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch {
    return [];
  }
}

/**
 * Update the profile index
 */
function setProfileIndex(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILES_INDEX_KEY, JSON.stringify(ids));
}

/**
 * Save a custom profile to localStorage
 */
export function saveCustomProfile(profile: CustomProfile): void {
  if (typeof window === "undefined") return;

  const key = `${STORAGE_KEY_PREFIX}${profile.id}`;
  localStorage.setItem(key, JSON.stringify(profile));

  // Update index
  const index = getProfileIndex();
  if (!index.includes(profile.id)) {
    index.push(profile.id);
    setProfileIndex(index);
  }
}

/**
 * Load all custom profiles from localStorage
 */
export function loadCustomProfiles(): CustomProfile[] {
  if (typeof window === "undefined") return [];

  const index = getProfileIndex();
  const profiles: CustomProfile[] = [];

  for (const id of index) {
    const profile = getProfileById(id as CustomProfileId);
    if (profile) {
      profiles.push(profile);
    }
  }

  return profiles;
}

/**
 * Get a specific profile by ID
 */
export function getProfileById(id: CustomProfileId): CustomProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    const data = localStorage.getItem(key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    return validateCustomProfile(parsed);
  } catch {
    return null;
  }
}

/**
 * Delete a custom profile
 */
export function deleteCustomProfile(id: CustomProfileId): boolean {
  if (typeof window === "undefined") return false;

  const key = `${STORAGE_KEY_PREFIX}${id}`;
  const existed = localStorage.getItem(key) !== null;

  localStorage.removeItem(key);

  // Update index
  const index = getProfileIndex();
  const newIndex = index.filter((profileId) => profileId !== id);
  setProfileIndex(newIndex);

  return existed;
}

/**
 * Check if a profile exists
 */
export function profileExists(id: CustomProfileId): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`) !== null;
}

/**
 * Clear all custom profiles (for testing/reset)
 */
export function clearAllProfiles(): void {
  if (typeof window === "undefined") return;

  const index = getProfileIndex();
  for (const id of index) {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
  }
  localStorage.removeItem(PROFILES_INDEX_KEY);
}
