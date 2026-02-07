import type { EvidenceEntry } from "@/lib/store/types";
import type { TrainingExample } from "@/lib/training";

const DB_NAME = "synthNoirDB";
const DB_VERSION = 1;
const EVIDENCE_STORE = "evidence";
const TRAINING_STORE = "training";

function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error("IndexedDB not available"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EVIDENCE_STORE)) {
        db.createObjectStore(EVIDENCE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(TRAINING_STORE)) {
        db.createObjectStore(TRAINING_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// --- Evidence CRUD ---

export async function getAllEvidence(): Promise<EvidenceEntry[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(EVIDENCE_STORE, "readonly");
      const store = tx.objectStore(EVIDENCE_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function putEvidence(entry: EvidenceEntry): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(EVIDENCE_STORE, "readwrite");
      const store = tx.objectStore(EVIDENCE_STORE);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fire-and-forget: silently fail when IndexedDB unavailable
  }
}

export async function deleteEvidence(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(EVIDENCE_STORE, "readwrite");
      const store = tx.objectStore(EVIDENCE_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fire-and-forget
  }
}

export async function clearEvidence(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(EVIDENCE_STORE, "readwrite");
      const store = tx.objectStore(EVIDENCE_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fire-and-forget
  }
}

// --- Training CRUD ---

export async function getAllTraining(): Promise<TrainingExample[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRAINING_STORE, "readonly");
      const store = tx.objectStore(TRAINING_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function putTraining(example: TrainingExample): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRAINING_STORE, "readwrite");
      const store = tx.objectStore(TRAINING_STORE);
      const request = store.put(example);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fire-and-forget
  }
}

export async function clearTraining(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRAINING_STORE, "readwrite");
      const store = tx.objectStore(TRAINING_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fire-and-forget
  }
}

// --- Export / Import ---

export async function exportEvidenceAsJSON(): Promise<string> {
  const evidence = await getAllEvidence();
  return JSON.stringify(evidence, null, 2);
}

export async function importEvidenceFromJSON(json: string): Promise<void> {
  const entries: EvidenceEntry[] = JSON.parse(json);
  if (!Array.isArray(entries)) {
    throw new Error("Invalid evidence JSON: expected an array");
  }
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVIDENCE_STORE, "readwrite");
    const store = tx.objectStore(EVIDENCE_STORE);
    for (const entry of entries) {
      store.put(entry);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Reset the cached DB connection (for testing) */
export function _resetDB(): void {
  dbPromise = null;
}
