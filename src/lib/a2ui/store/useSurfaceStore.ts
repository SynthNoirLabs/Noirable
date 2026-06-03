import { create } from "zustand";
import type { SurfaceConfig, SurfaceComponent, SurfaceState } from "../surfaces/manager";

/**
 * A2UI v0.9 Surface Store
 *
 * Zustand store for managing surface-scoped state. Each surface maintains
 * its own component tree and data model, isolated from other surfaces.
 *
 * This store wraps the SurfaceManager class to provide reactive state
 * management with Zustand subscriptions for React re-rendering.
 */

interface SurfaceStoreState {
  /**
   * Map of surface ID to surface state
   */
  surfaces: Map<string, SurfaceState>;

  /**
   * Creates a new surface with the given configuration
   *
   * @param config - Surface configuration including ID, catalog, and optional theme
   * @throws Error if surface ID already exists or MAX_SURFACES limit reached
   */
  createSurface: (config: SurfaceConfig) => void;

  /**
   * Retrieves a surface by ID
   *
   * @param surfaceId - The surface ID to look up
   * @returns The surface state or undefined if not found
   */
  getSurface: (surfaceId: string) => SurfaceState | undefined;

  /**
   * Checks if a surface exists
   *
   * @param surfaceId - The surface ID to check
   * @returns true if the surface exists
   */
  hasSurface: (surfaceId: string) => boolean;

  /**
   * Updates components on an existing surface
   *
   * Components are merged by ID - existing components with matching IDs
   * are replaced, new IDs are added.
   *
   * @param surfaceId - The surface to update
   * @param components - Array of components to add/update
   * @throws Error if surface does not exist
   */
  updateComponents: (surfaceId: string, components: SurfaceComponent[]) => void;

  /**
   * Deletes a surface and all its associated data
   *
   * @param surfaceId - The surface to delete
   * @throws Error if surface does not exist
   */
  deleteSurface: (surfaceId: string) => void;

  /**
   * Sets data in the surface's data model at a JSON Pointer path
   *
   * @param surfaceId - The surface to update
   * @param path - JSON Pointer path (e.g., "/user/name")
   * @param value - Value to set at the path
   * @throws Error if surface does not exist
   */
  setDataModel: (surfaceId: string, path: string, value: unknown) => void;

  /**
   * Gets the entire data model for a surface
   *
   * @param surfaceId - The surface to query
   * @returns The data model object
   * @throws Error if surface does not exist
   */
  getDataModel: (surfaceId: string) => Record<string, unknown>;

  /**
   * Returns all surface IDs
   */
  getAllSurfaceIds: () => string[];

  /**
   * Returns the current number of surfaces
   */
  getSurfaceCount: () => number;

  /**
   * Removes all surfaces
   */
  clear: () => void;
}

/**
 * Maximum number of concurrent surfaces allowed per session
 */
const MAX_SURFACES = 10;

/**
 * Parses a JSON Pointer path and sets a value in an object
 *
 * @param obj - The object to modify
 * @param path - JSON Pointer path (e.g., "/user/name")
 * @param value - Value to set at the path
 */
/** Keys that must never be written through a JSON Pointer (prototype pollution). */
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Decode a JSON Pointer token per RFC 6901 (~1 → "/", ~0 → "~"). */
function decodeToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

/**
 * Sets (or deletes) a value in an object at a JSON Pointer path.
 *
 * Implements the A2UI v0.9 upsert semantics:
 * - Root path ("/" or "") replaces the entire data model.
 * - An `undefined` value removes the key at the target path.
 * - Tokens are RFC 6901 decoded; prototype-polluting keys are rejected.
 *
 * @returns The (possibly new) root object to assign back.
 */
function setAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  // Handle root path — replace the whole model.
  if (path === "/" || path === "") {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }
    // A non-object root value is not representable as a data model; ignore.
    return obj;
  }

  // Remove leading slash, split, and RFC 6901 decode each token.
  const parts = path.replace(/^\//, "").split("/").map(decodeToken);

  if (parts.some((part) => UNSAFE_KEYS.has(part))) {
    return obj;
  }

  let current: Record<string, unknown> = obj;

  // Navigate to the parent of the target, creating containers as needed.
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextArray = /^\d+$/.test(nextPart);

    const existing = current[part];
    if (existing === null || typeof existing !== "object") {
      current[part] = isNextArray ? [] : {};
    }

    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];

  // An omitted value deletes the key (v0.9 delete semantics).
  if (value === undefined) {
    if (Array.isArray(current) && /^\d+$/.test(lastPart)) {
      current.splice(Number(lastPart), 1);
    } else {
      delete current[lastPart];
    }
    return obj;
  }

  current[lastPart] = value;
  return obj;
}

/**
 * Zustand store for surface-scoped state management
 *
 * @example
 * ```typescript
 * const { createSurface, updateComponents, setDataModel } = useSurfaceStore();
 *
 * // Create a surface
 * createSurface({
 *   surfaceId: "main",
 *   catalogId: "standard",
 *   theme: "noir"
 * });
 *
 * // Add components
 * updateComponents("main", [
 *   { id: "btn-1", type: "button", label: "Click me" }
 * ]);
 *
 * // Update data model
 * setDataModel("main", "/user/name", "Alice");
 * ```
 */
export const useSurfaceStore = create<SurfaceStoreState>((set, get) => ({
  surfaces: new Map(),

  createSurface: (config) => {
    const { surfaceId } = config;

    // Check for duplicate ID
    if (get().surfaces.has(surfaceId)) {
      throw new Error(`Surface "${surfaceId}" already exists`);
    }

    // Create new surface state
    const state: SurfaceState = {
      config,
      components: new Map(),
      dataModel: {},
      createdAt: Date.now(),
    };

    set((prev) => {
      const newSurfaces = new Map(prev.surfaces);

      // Enforce the surface ceiling by evicting the oldest surface(s) rather
      // than throwing — long-lived sessions accumulate surfaces and a thrown
      // error would otherwise break the next prompt.
      while (newSurfaces.size >= MAX_SURFACES) {
        let oldestId: string | null = null;
        let oldestAt = Infinity;
        for (const [id, surface] of newSurfaces) {
          if (surface.createdAt < oldestAt) {
            oldestAt = surface.createdAt;
            oldestId = id;
          }
        }
        if (oldestId === null) break;
        newSurfaces.delete(oldestId);
      }

      newSurfaces.set(surfaceId, state);
      return { surfaces: newSurfaces };
    });
  },

  getSurface: (surfaceId) => {
    return get().surfaces.get(surfaceId);
  },

  hasSurface: (surfaceId) => {
    return get().surfaces.has(surfaceId);
  },

  updateComponents: (surfaceId, components) => {
    const surface = get().surfaces.get(surfaceId);

    if (!surface) {
      throw new Error(`Surface "${surfaceId}" not found`);
    }

    set((prev) => {
      const newSurfaces = new Map(prev.surfaces);
      const updatedSurface = { ...surface };

      // Create new components map with updates
      const newComponents = new Map(surface.components);
      for (const component of components) {
        newComponents.set(component.id, component);
      }

      updatedSurface.components = newComponents;
      newSurfaces.set(surfaceId, updatedSurface);

      return { surfaces: newSurfaces };
    });
  },

  deleteSurface: (surfaceId) => {
    if (!get().surfaces.has(surfaceId)) {
      throw new Error(`Surface "${surfaceId}" not found`);
    }

    set((prev) => {
      const newSurfaces = new Map(prev.surfaces);
      newSurfaces.delete(surfaceId);
      return { surfaces: newSurfaces };
    });
  },

  setDataModel: (surfaceId, path, value) => {
    const surface = get().surfaces.get(surfaceId);

    if (!surface) {
      throw new Error(`Surface "${surfaceId}" not found`);
    }

    set((prev) => {
      const newSurfaces = new Map(prev.surfaces);
      const updatedSurface = { ...surface };

      // Create new data model with update (setAtPath may return a fresh root,
      // e.g. for a root-path replacement).
      const newDataModel = setAtPath({ ...surface.dataModel }, path, value);

      updatedSurface.dataModel = newDataModel;
      newSurfaces.set(surfaceId, updatedSurface);

      return { surfaces: newSurfaces };
    });
  },

  getDataModel: (surfaceId) => {
    const surface = get().surfaces.get(surfaceId);

    if (!surface) {
      throw new Error(`Surface "${surfaceId}" not found`);
    }

    return surface.dataModel;
  },

  getAllSurfaceIds: () => {
    return Array.from(get().surfaces.keys());
  },

  getSurfaceCount: () => {
    return get().surfaces.size;
  },

  clear: () => {
    set({ surfaces: new Map() });
  },
}));
