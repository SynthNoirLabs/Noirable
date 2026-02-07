import { encryptValue, decryptValue } from "./crypto";

const SECURE_PREFIX = "synthNoir_sec_";

/**
 * Read an encrypted value from localStorage.
 * Returns null if the key doesn't exist or decryption fails.
 */
export async function secureGet(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(`${SECURE_PREFIX}${key}`);
  if (!raw) return null;

  return decryptValue(raw);
}

/**
 * Encrypt and write a value to localStorage.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;

  const encrypted = await encryptValue(value);
  localStorage.setItem(`${SECURE_PREFIX}${key}`, encrypted);
}

/**
 * Remove an encrypted value from localStorage.
 */
export function secureRemove(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${SECURE_PREFIX}${key}`);
}
