import { describe, it, expect, beforeEach } from "vitest";
import type { EvidenceEntry } from "@/lib/store/types";

// --- Minimal IndexedDB mock ---

class MockIDBRequest<T = unknown> {
  result: T = undefined as T;
  error: DOMException | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;

  _resolve(value: T) {
    this.result = value;
    this.onsuccess?.();
  }
  _reject(err: DOMException) {
    this.error = err;
    this.onerror?.();
  }
}

class MockObjectStore {
  private data = new Map<string, unknown>();
  private keyPath: string;

  constructor(keyPath: string) {
    this.keyPath = keyPath;
  }

  put(value: Record<string, unknown>): MockIDBRequest {
    const req = new MockIDBRequest();
    const key = value[this.keyPath] as string;
    this.data.set(key, structuredClone(value));
    queueMicrotask(() => req._resolve(undefined));
    return req;
  }

  get(key: string): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() => req._resolve(structuredClone(this.data.get(key))));
    return req;
  }

  getAll(): MockIDBRequest {
    const req = new MockIDBRequest();
    queueMicrotask(() =>
      req._resolve(Array.from(this.data.values()).map((v) => structuredClone(v)))
    );
    return req;
  }

  delete(key: string): MockIDBRequest {
    const req = new MockIDBRequest();
    this.data.delete(key);
    queueMicrotask(() => req._resolve(undefined));
    return req;
  }

  clear(): MockIDBRequest {
    const req = new MockIDBRequest();
    this.data.clear();
    queueMicrotask(() => req._resolve(undefined));
    return req;
  }
}

class MockTransaction {
  private stores: Map<string, MockObjectStore>;
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  error: DOMException | null = null;

  constructor(stores: Map<string, MockObjectStore>) {
    this.stores = stores;
    // Fire oncomplete asynchronously
    queueMicrotask(() => this.oncomplete?.());
  }

  objectStore(name: string): MockObjectStore {
    const store = this.stores.get(name);
    if (!store) throw new Error(`No object store "${name}"`);
    return store;
  }
}

class MockIDBDatabase {
  objectStoreNames: { contains: (name: string) => boolean };
  private stores = new Map<string, MockObjectStore>();

  constructor() {
    this.objectStoreNames = {
      contains: (name: string) => this.stores.has(name),
    };
  }

  createObjectStore(name: string, opts: { keyPath: string }): MockObjectStore {
    const store = new MockObjectStore(opts.keyPath);
    this.stores.set(name, store);
    return store;
  }

  transaction(): MockTransaction {
    return new MockTransaction(this.stores);
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest<MockIDBDatabase> {
  onupgradeneeded: (() => void) | null = null;
}

function createMockIndexedDB() {
  return {
    open: (): MockIDBOpenDBRequest => {
      const req = new MockIDBOpenDBRequest();
      const db = new MockIDBDatabase();
      req.result = db;
      queueMicrotask(() => {
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    },
  };
}

// Install mock before importing the module
Object.defineProperty(globalThis, "indexedDB", {
  value: createMockIndexedDB(),
  writable: true,
  configurable: true,
});

// Dynamic import so the mock is in place
const {
  getAllEvidence,
  putEvidence,
  deleteEvidence,
  clearEvidence,
  exportEvidenceAsJSON,
  importEvidenceFromJSON,
  _resetDB,
} = await import("./indexeddb");

// --- Test fixtures ---

function makeEvidence(id: string): EvidenceEntry {
  return {
    id,
    createdAt: Date.now(),
    label: `Evidence ${id}`,
    data: { type: "text", content: `Evidence ${id}`, priority: "normal" },
  };
}

describe("IndexedDB storage", () => {
  beforeEach(async () => {
    _resetDB();
    // Re-install mock (in case a test removed it)
    Object.defineProperty(globalThis, "indexedDB", {
      value: createMockIndexedDB(),
      writable: true,
      configurable: true,
    });
    // Clear stores by getting a fresh DB
    await clearEvidence();
    // Reset again so each test starts with a fresh connection
    _resetDB();
  });

  describe("evidence CRUD", () => {
    it("returns empty array when no evidence stored", async () => {
      const result = await getAllEvidence();
      expect(result).toEqual([]);
    });

    it("puts and retrieves evidence", async () => {
      const entry = makeEvidence("e1");
      await putEvidence(entry);
      const all = await getAllEvidence();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe("e1");
    });

    it("overwrites evidence with same id", async () => {
      await putEvidence(makeEvidence("e1"));
      const updated = { ...makeEvidence("e1"), label: "Updated" };
      await putEvidence(updated);
      const all = await getAllEvidence();
      expect(all).toHaveLength(1);
      expect(all[0].label).toBe("Updated");
    });

    it("deletes evidence by id", async () => {
      await putEvidence(makeEvidence("e1"));
      await putEvidence(makeEvidence("e2"));
      await deleteEvidence("e1");
      const all = await getAllEvidence();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe("e2");
    });

    it("clears all evidence", async () => {
      await putEvidence(makeEvidence("e1"));
      await putEvidence(makeEvidence("e2"));
      await clearEvidence();
      const all = await getAllEvidence();
      expect(all).toEqual([]);
    });
  });

  describe("export/import", () => {
    it("exports evidence as JSON string", async () => {
      await putEvidence(makeEvidence("e1"));
      await putEvidence(makeEvidence("e2"));
      const json = await exportEvidenceAsJSON();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(2);
    });

    it("imports evidence from JSON string", async () => {
      const entries = [makeEvidence("i1"), makeEvidence("i2")];
      await importEvidenceFromJSON(JSON.stringify(entries));
      const all = await getAllEvidence();
      expect(all).toHaveLength(2);
    });

    it("throws on invalid JSON input", async () => {
      await expect(importEvidenceFromJSON("not json")).rejects.toThrow();
    });

    it("throws when JSON is not an array", async () => {
      await expect(importEvidenceFromJSON('{"key":"val"}')).rejects.toThrow(
        "Invalid evidence JSON"
      );
    });
  });

  describe("SSR / unavailable IndexedDB", () => {
    it("returns empty array when indexedDB is undefined", async () => {
      _resetDB();
      const original = globalThis.indexedDB;
      // @ts-expect-error - intentionally removing for test
      delete globalThis.indexedDB;
      Object.defineProperty(globalThis, "indexedDB", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { getAllEvidence: getAll, _resetDB: reset } = await import("./indexeddb");
      reset();
      const result = await getAll();
      expect(result).toEqual([]);

      // Restore
      Object.defineProperty(globalThis, "indexedDB", {
        value: original,
        writable: true,
        configurable: true,
      });
    });
  });
});
