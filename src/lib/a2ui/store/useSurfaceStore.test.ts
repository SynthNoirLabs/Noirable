import { describe, it, expect, beforeEach } from "vitest";
import { useSurfaceStore } from "./useSurfaceStore";
import type { SurfaceConfig, SurfaceComponent } from "../surfaces/manager";

describe("useSurfaceStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useSurfaceStore.setState({
      surfaces: new Map(),
    });
  });

  describe("surface lifecycle", () => {
    it("initializes with empty surfaces", () => {
      const { surfaces } = useSurfaceStore.getState();
      expect(surfaces.size).toBe(0);
    });

    it("creates a new surface", () => {
      const { createSurface, getSurface } = useSurfaceStore.getState();
      const config: SurfaceConfig = {
        surfaceId: "test-surface",
        catalogId: "standard",
        theme: "noir",
      };

      createSurface(config);

      const surface = getSurface("test-surface");
      expect(surface).toBeDefined();
      expect(surface?.config).toEqual(config);
      expect(surface?.components.size).toBe(0);
      expect(surface?.dataModel).toEqual({});
      expect(surface?.createdAt).toBeDefined();
    });

    it("deletes a surface", () => {
      const { createSurface, deleteSurface, getSurface } = useSurfaceStore.getState();
      const config: SurfaceConfig = {
        surfaceId: "test-surface",
        catalogId: "standard",
      };

      createSurface(config);
      expect(getSurface("test-surface")).toBeDefined();

      deleteSurface("test-surface");
      expect(getSurface("test-surface")).toBeUndefined();
    });

    it("throws error when creating duplicate surface", () => {
      const { createSurface } = useSurfaceStore.getState();
      const config: SurfaceConfig = {
        surfaceId: "test-surface",
        catalogId: "standard",
      };

      createSurface(config);

      expect(() => createSurface(config)).toThrow('Surface "test-surface" already exists');
    });

    it("throws error when deleting non-existent surface", () => {
      const { deleteSurface } = useSurfaceStore.getState();

      expect(() => deleteSurface("non-existent")).toThrow('Surface "non-existent" not found');
    });
  });

  describe("surface isolation", () => {
    it("maintains separate state for multiple surfaces", () => {
      const { createSurface, getSurface } = useSurfaceStore.getState();

      const config1: SurfaceConfig = {
        surfaceId: "surface-1",
        catalogId: "standard",
        theme: "noir",
      };

      const config2: SurfaceConfig = {
        surfaceId: "surface-2",
        catalogId: "minimal",
        theme: "light",
      };

      createSurface(config1);
      createSurface(config2);

      const surface1 = getSurface("surface-1");
      const surface2 = getSurface("surface-2");

      expect(surface1?.config.theme).toBe("noir");
      expect(surface2?.config.theme).toBe("light");
      expect(surface1?.config.catalogId).toBe("standard");
      expect(surface2?.config.catalogId).toBe("minimal");
    });

    it("updates components on one surface without affecting others", () => {
      const { createSurface, updateComponents, getSurface } = useSurfaceStore.getState();

      createSurface({ surfaceId: "surface-1", catalogId: "standard" });
      createSurface({ surfaceId: "surface-2", catalogId: "standard" });

      const components1: SurfaceComponent[] = [{ id: "btn-1", type: "button", label: "Button 1" }];

      const components2: SurfaceComponent[] = [{ id: "btn-2", type: "button", label: "Button 2" }];

      updateComponents("surface-1", components1);
      updateComponents("surface-2", components2);

      const surface1 = getSurface("surface-1");
      const surface2 = getSurface("surface-2");

      expect(surface1?.components.size).toBe(1);
      expect(surface2?.components.size).toBe(1);
      expect(surface1?.components.get("btn-1")).toEqual(components1[0]);
      expect(surface2?.components.get("btn-2")).toEqual(components2[0]);
      expect(surface1?.components.has("btn-2")).toBe(false);
      expect(surface2?.components.has("btn-1")).toBe(false);
    });

    it("updates data model on one surface without affecting others", () => {
      const { createSurface, setDataModel, getSurface } = useSurfaceStore.getState();

      createSurface({ surfaceId: "surface-1", catalogId: "standard" });
      createSurface({ surfaceId: "surface-2", catalogId: "standard" });

      setDataModel("surface-1", "/user/name", "Alice");
      setDataModel("surface-2", "/user/name", "Bob");

      const surface1 = getSurface("surface-1");
      const surface2 = getSurface("surface-2");

      expect(surface1?.dataModel.user).toEqual({ name: "Alice" });
      expect(surface2?.dataModel.user).toEqual({ name: "Bob" });
    });
  });

  describe("component management", () => {
    beforeEach(() => {
      const { createSurface } = useSurfaceStore.getState();
      createSurface({ surfaceId: "test-surface", catalogId: "standard" });
    });

    it("adds components to a surface", () => {
      const { updateComponents, getSurface } = useSurfaceStore.getState();

      const components: SurfaceComponent[] = [
        { id: "btn-1", type: "button", label: "Click me" },
        { id: "text-1", type: "text", content: "Hello" },
      ];

      updateComponents("test-surface", components);

      const surface = getSurface("test-surface");
      expect(surface?.components.size).toBe(2);
      expect(surface?.components.get("btn-1")).toEqual(components[0]);
      expect(surface?.components.get("text-1")).toEqual(components[1]);
    });

    it("merges components by ID", () => {
      const { updateComponents, getSurface } = useSurfaceStore.getState();

      const components1: SurfaceComponent[] = [{ id: "btn-1", type: "button", label: "Original" }];

      const components2: SurfaceComponent[] = [{ id: "btn-1", type: "button", label: "Updated" }];

      updateComponents("test-surface", components1);
      updateComponents("test-surface", components2);

      const surface = getSurface("test-surface");
      expect(surface?.components.size).toBe(1);
      expect(surface?.components.get("btn-1")?.label).toBe("Updated");
    });

    it("throws error when updating components on non-existent surface", () => {
      const { updateComponents } = useSurfaceStore.getState();

      const components: SurfaceComponent[] = [{ id: "btn-1", type: "button" }];

      expect(() => updateComponents("non-existent", components)).toThrow(
        'Surface "non-existent" not found'
      );
    });
  });

  describe("data model management", () => {
    beforeEach(() => {
      const { createSurface } = useSurfaceStore.getState();
      createSurface({ surfaceId: "test-surface", catalogId: "standard" });
    });

    it("sets data at JSON Pointer path", () => {
      const { setDataModel, getDataModel } = useSurfaceStore.getState();

      setDataModel("test-surface", "/user/name", "Alice");
      setDataModel("test-surface", "/user/age", 30);

      const data = getDataModel("test-surface");
      expect(data).toEqual({
        user: {
          name: "Alice",
          age: 30,
        },
      });
    });

    it("sets nested data at JSON Pointer path", () => {
      const { setDataModel, getDataModel } = useSurfaceStore.getState();

      setDataModel("test-surface", "/user/address/city", "New York");
      setDataModel("test-surface", "/user/address/zip", "10001");

      const data = getDataModel("test-surface");
      expect(data).toEqual({
        user: {
          address: {
            city: "New York",
            zip: "10001",
          },
        },
      });
    });

    it("overwrites existing data at path", () => {
      const { setDataModel, getDataModel } = useSurfaceStore.getState();

      setDataModel("test-surface", "/user/name", "Alice");
      setDataModel("test-surface", "/user/name", "Bob");

      const data = getDataModel("test-surface");
      expect(data).toEqual({
        user: {
          name: "Bob",
        },
      });
    });

    it("returns empty object for surface with no data", () => {
      const { getDataModel } = useSurfaceStore.getState();

      const data = getDataModel("test-surface");
      expect(data).toEqual({});
    });

    it("throws error when setting data on non-existent surface", () => {
      const { setDataModel } = useSurfaceStore.getState();

      expect(() => setDataModel("non-existent", "/user/name", "Alice")).toThrow(
        'Surface "non-existent" not found'
      );
    });

    it("throws error when getting data from non-existent surface", () => {
      const { getDataModel } = useSurfaceStore.getState();

      expect(() => getDataModel("non-existent")).toThrow('Surface "non-existent" not found');
    });

    it("handles root path correctly", () => {
      const { setDataModel, getDataModel } = useSurfaceStore.getState();

      setDataModel("test-surface", "/", { root: "value" });

      const data = getDataModel("test-surface");
      expect(data).toEqual({ root: "value" });
    });

    it("handles array indices in JSON Pointer", () => {
      const { setDataModel, getDataModel } = useSurfaceStore.getState();

      setDataModel("test-surface", "/items/0", "first");
      setDataModel("test-surface", "/items/1", "second");

      const data = getDataModel("test-surface");
      expect(data).toEqual({
        items: ["first", "second"],
      });
    });
  });

  describe("surface queries", () => {
    it("returns all surface IDs", () => {
      const { createSurface, getAllSurfaceIds } = useSurfaceStore.getState();

      createSurface({ surfaceId: "surface-1", catalogId: "standard" });
      createSurface({ surfaceId: "surface-2", catalogId: "standard" });
      createSurface({ surfaceId: "surface-3", catalogId: "standard" });

      const ids = getAllSurfaceIds();
      expect(ids).toHaveLength(3);
      expect(ids).toContain("surface-1");
      expect(ids).toContain("surface-2");
      expect(ids).toContain("surface-3");
    });

    it("returns surface count", () => {
      const { createSurface, getSurfaceCount } = useSurfaceStore.getState();

      expect(getSurfaceCount()).toBe(0);

      createSurface({ surfaceId: "surface-1", catalogId: "standard" });
      expect(getSurfaceCount()).toBe(1);

      createSurface({ surfaceId: "surface-2", catalogId: "standard" });
      expect(getSurfaceCount()).toBe(2);
    });

    it("checks if surface exists", () => {
      const { createSurface, hasSurface } = useSurfaceStore.getState();

      expect(hasSurface("test-surface")).toBe(false);

      createSurface({ surfaceId: "test-surface", catalogId: "standard" });
      expect(hasSurface("test-surface")).toBe(true);
    });
  });

  describe("clear operation", () => {
    it("removes all surfaces", () => {
      const { createSurface, clear, getSurfaceCount } = useSurfaceStore.getState();

      createSurface({ surfaceId: "surface-1", catalogId: "standard" });
      createSurface({ surfaceId: "surface-2", catalogId: "standard" });

      expect(getSurfaceCount()).toBe(2);

      clear();

      expect(getSurfaceCount()).toBe(0);
    });
  });

  describe("subscription and re-rendering", () => {
    it("triggers re-render when surface is created", () => {
      const { createSurface } = useSurfaceStore.getState();

      let renderCount = 0;
      const unsubscribe = useSurfaceStore.subscribe(() => {
        renderCount++;
      });

      createSurface({ surfaceId: "test-surface", catalogId: "standard" });

      expect(renderCount).toBe(1);

      unsubscribe();
    });

    it("triggers re-render when components are updated", () => {
      const { createSurface, updateComponents } = useSurfaceStore.getState();

      createSurface({ surfaceId: "test-surface", catalogId: "standard" });

      let renderCount = 0;
      const unsubscribe = useSurfaceStore.subscribe(() => {
        renderCount++;
      });

      updateComponents("test-surface", [{ id: "btn-1", type: "button" }]);

      expect(renderCount).toBe(1);

      unsubscribe();
    });

    it("triggers re-render when data model is updated", () => {
      const { createSurface, setDataModel } = useSurfaceStore.getState();

      createSurface({ surfaceId: "test-surface", catalogId: "standard" });

      let renderCount = 0;
      const unsubscribe = useSurfaceStore.subscribe(() => {
        renderCount++;
      });

      setDataModel("test-surface", "/user/name", "Alice");

      expect(renderCount).toBe(1);

      unsubscribe();
    });

    it("triggers re-render when surface is deleted", () => {
      const { createSurface, deleteSurface } = useSurfaceStore.getState();

      createSurface({ surfaceId: "test-surface", catalogId: "standard" });

      let renderCount = 0;
      const unsubscribe = useSurfaceStore.subscribe(() => {
        renderCount++;
      });

      deleteSurface("test-surface");

      expect(renderCount).toBe(1);

      unsubscribe();
    });
  });
});
