/**
 * A2UI v0.9 Surface Manager
 *
 * Manages the lifecycle of UI surfaces. Each surface represents an independent
 * UI context with its own component tree and data model.
 *
 * Surfaces are identified by unique IDs and can contain multiple components.
 * The manager enforces a maximum of 10 concurrent surfaces per session.
 */

/**
 * Configuration for creating a new surface
 */
export type SurfaceConfig = {
  surfaceId: string;
  catalogId: string;
  theme?: string;
  sendDataModel?: boolean;
};

/**
 * Base structure for surface components
 *
 * Components have at minimum an id and type.
 * Additional properties are component-specific.
 */
export type SurfaceComponent = {
  id: string;
  type: string;
  [key: string]: unknown;
};

/**
 * Internal state for a tracked surface
 */
export type SurfaceState = {
  config: SurfaceConfig;
  components: Map<string, SurfaceComponent>;
  dataModel: Record<string, unknown>;
  createdAt: number;
};

/**
 * Maximum number of concurrent surfaces allowed per session
 */
const MAX_SURFACES = 10;

/**
 * Special component ID that indicates a root component
 */
const ROOT_COMPONENT_ID = "root";

/**
 * SurfaceManager - Manages A2UI surface lifecycle
 *
 * Provides methods to create, update, query, and delete surfaces.
 * Each surface maintains its own component map and data model.
 *
 * @example
 * ```typescript
 * const manager = new SurfaceManager();
 *
 * // Create a surface
 * manager.createSurface({
 *   surfaceId: "main",
 *   catalogId: "standard",
 *   theme: "noir"
 * });
 *
 * // Add components
 * manager.updateComponents("main", [
 *   { id: "main", type: "container", children: ["btn-1"] },
 *   { id: "btn-1", type: "button", label: "Click me" }
 * ]);
 *
 * // Check if surface has root
 * if (manager.hasRoot("main")) {
 *   console.log("Surface is ready to render");
 * }
 *
 * // Cleanup
 * manager.deleteSurface("main");
 * ```
 */
export class SurfaceManager {
  private surfaces: Map<string, SurfaceState>;

  constructor() {
    this.surfaces = new Map();
  }

  /**
   * Creates a new surface with the given configuration
   *
   * @param config - Surface configuration including ID, catalog, and optional theme
   * @throws Error if surface ID already exists or MAX_SURFACES limit reached
   */
  createSurface(config: SurfaceConfig): void {
    const { surfaceId } = config;

    // Check for duplicate ID
    if (this.surfaces.has(surfaceId)) {
      throw new Error(`Surface "${surfaceId}" already exists`);
    }

    // Check for maximum surfaces limit
    if (this.surfaces.size >= MAX_SURFACES) {
      throw new Error(
        `Maximum of ${MAX_SURFACES} surfaces reached. Delete a surface before creating a new one.`
      );
    }

    // Create new surface state
    const state: SurfaceState = {
      config,
      components: new Map(),
      dataModel: {},
      createdAt: Date.now(),
    };

    this.surfaces.set(surfaceId, state);
  }

  /**
   * Retrieves a surface by ID
   *
   * @param surfaceId - The surface ID to look up
   * @returns The surface state or undefined if not found
   */
  getSurface(surfaceId: string): SurfaceState | undefined {
    return this.surfaces.get(surfaceId);
  }

  /**
   * Checks if a surface exists
   *
   * @param surfaceId - The surface ID to check
   * @returns true if the surface exists
   */
  hasSurface(surfaceId: string): boolean {
    return this.surfaces.has(surfaceId);
  }

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
  updateComponents(surfaceId: string, components: SurfaceComponent[]): void {
    const surface = this.surfaces.get(surfaceId);

    if (!surface) {
      throw new Error(`Surface "${surfaceId}" not found`);
    }

    // Merge components by ID
    for (const component of components) {
      surface.components.set(component.id, component);
    }
  }

  /**
   * Deletes a surface and all its associated data
   *
   * @param surfaceId - The surface to delete
   * @throws Error if surface does not exist
   */
  deleteSurface(surfaceId: string): void {
    if (!this.surfaces.has(surfaceId)) {
      throw new Error(`Surface "${surfaceId}" not found`);
    }

    this.surfaces.delete(surfaceId);
  }

  /**
   * Checks if a surface has a root component
   *
   * A root component is detected when:
   * - A component has an ID matching the surfaceId, OR
   * - A component has the special ID "root"
   *
   * @param surfaceId - The surface to check
   * @returns true if a root component exists
   * @throws Error if surface does not exist
   */
  hasRoot(surfaceId: string): boolean {
    const surface = this.surfaces.get(surfaceId);

    if (!surface) {
      throw new Error(`Surface "${surfaceId}" not found`);
    }

    // Check for component with ID matching surfaceId
    if (surface.components.has(surfaceId)) {
      return true;
    }

    // Check for component with special "root" ID
    if (surface.components.has(ROOT_COMPONENT_ID)) {
      return true;
    }

    return false;
  }

  /**
   * Returns the current number of surfaces
   */
  getSurfaceCount(): number {
    return this.surfaces.size;
  }

  /**
   * Returns all surface IDs
   */
  getAllSurfaceIds(): string[] {
    return Array.from(this.surfaces.keys());
  }

  /**
   * Removes all surfaces
   */
  clear(): void {
    this.surfaces.clear();
  }
}
