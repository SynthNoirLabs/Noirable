/**
 * A2UI v0.9 Surface types
 *
 * Shared type definitions for surface-scoped state. The reactive lifecycle
 * (create / update / delete / data-model writes, with oldest-surface eviction
 * at the ceiling) lives in the Zustand store at ../store/useSurfaceStore.ts —
 * these types are the contract both the store and the renderer build on.
 */

/**
 * Configuration for creating a new surface
 */
export type SurfaceConfig = {
  surfaceId: string;
  catalogId: string;
  // A2UI v0.9 theme: either a string identifier or an object of theme
  // parameters (e.g. `{ primaryColor: "#00BFFF" }`).
  theme?: string | Record<string, unknown>;
  sendDataModel?: boolean;
};

/**
 * Base structure for surface components.
 *
 * Per the A2UI v0.9 standard catalog, every component is identified by an `id`
 * and a `component` type discriminator (e.g. "Text", "Card", "Button").
 * Additional properties are component-specific.
 */
export type SurfaceComponent = {
  id: string;
  component: string;
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
