import { describe, it, expect, beforeEach } from "vitest";
import { secureGet, secureSet, secureRemove } from "./secure-storage";
import { _resetEncryptionKey } from "./crypto";

describe("secure-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    _resetEncryptionKey();
  });

  it("stores and retrieves a value", async () => {
    await secureSet("apiKey", "sk-secret-123");
    const result = await secureGet("apiKey");
    expect(result).toBe("sk-secret-123");
  });

  it("stores encrypted data in localStorage", async () => {
    await secureSet("apiKey", "sk-secret-123");
    const raw = localStorage.getItem("synthNoir_sec_apiKey");
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("sk-secret-123");
  });

  it("returns null for missing key", async () => {
    const result = await secureGet("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when encryption key has rotated", async () => {
    await secureSet("apiKey", "sk-secret-123");
    _resetEncryptionKey();
    const result = await secureGet("apiKey");
    expect(result).toBeNull();
  });

  it("removes a key", async () => {
    await secureSet("apiKey", "sk-secret-123");
    secureRemove("apiKey");
    const result = await secureGet("apiKey");
    expect(result).toBeNull();
  });
});
