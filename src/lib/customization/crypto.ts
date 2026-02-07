const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SESSION_KEY_NAME = "synthNoir_ek";

/**
 * Get or create the AES-GCM encryption key for this tab session.
 * The raw key bytes are stored in sessionStorage so they survive
 * soft-navigations but are cleared when the tab closes.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const stored = sessionStorage.getItem(SESSION_KEY_NAME);

  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", raw, ALGORITHM, true, ["encrypt", "decrypt"]);
  }

  const key = await crypto.subtle.generateKey({ name: ALGORITHM, length: KEY_LENGTH }, true, [
    "encrypt",
    "decrypt",
  ]);

  const exported = await crypto.subtle.exportKey("raw", key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  sessionStorage.setItem(SESSION_KEY_NAME, b64);

  return key;
}

/**
 * Encrypt a plaintext string using AES-GCM.
 * Returns a base64 string containing the IV prepended to the ciphertext.
 */
export async function encryptValue(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);

  // Combine IV + ciphertext into a single buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded ciphertext (IV + data) back to plaintext.
 * Returns null if decryption fails (e.g. key rotated between sessions).
 */
export async function decryptValue(encoded: string): Promise<string | null> {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/** Clear the session key (useful for testing). */
export function _resetEncryptionKey(): void {
  sessionStorage.removeItem(SESSION_KEY_NAME);
}
