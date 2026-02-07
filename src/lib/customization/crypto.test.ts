import { describe, it, expect, beforeEach } from "vitest";
import { encryptValue, decryptValue, _resetEncryptionKey } from "./crypto";

// jsdom + Node provides crypto.subtle natively

describe("crypto", () => {
  beforeEach(() => {
    sessionStorage.clear();
    _resetEncryptionKey();
  });

  it("encrypts and decrypts a string", async () => {
    const plaintext = "sk-test-key-12345";
    const encrypted = await encryptValue(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(typeof encrypted).toBe("string");

    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (unique IV)", async () => {
    const plaintext = "sk-test-key";
    const a = await encryptValue(plaintext);
    const b = await encryptValue(plaintext);

    expect(a).not.toBe(b);

    // Both decrypt to the same value
    expect(await decryptValue(a)).toBe(plaintext);
    expect(await decryptValue(b)).toBe(plaintext);
  });

  it("handles empty string", async () => {
    const encrypted = await encryptValue("");
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe("");
  });

  it("handles unicode content", async () => {
    const plaintext = "key-with-unicode-\u00e9\u00e8\u00ea";
    const encrypted = await encryptValue(plaintext);
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("returns null for garbage input", async () => {
    const result = await decryptValue("not-valid-base64!!!");
    expect(result).toBeNull();
  });

  it("returns null when key has rotated", async () => {
    const encrypted = await encryptValue("my-secret");

    // Simulate a new session (key rotation)
    _resetEncryptionKey();

    const result = await decryptValue(encrypted);
    expect(result).toBeNull();
  });

  it("persists key within session", async () => {
    const encrypted = await encryptValue("persistent-key");

    // Calling again without reset should still work
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe("persistent-key");
  });

  it("stores key in sessionStorage", async () => {
    await encryptValue("trigger-key-generation");

    const stored = sessionStorage.getItem("synthNoir_ek");
    expect(stored).toBeTruthy();
    expect(typeof stored).toBe("string");
  });
});
