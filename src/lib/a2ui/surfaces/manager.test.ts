import { describe, it, expect, beforeEach } from "vitest";
import { SurfaceManager, type SurfaceConfig, type SurfaceComponent } from "./manager";

describe("SurfaceManager", () => {
  let manager: SurfaceManager;

  beforeEach(() => {
    manager = new SurfaceManager();
  });

  describe("createSurface", () => {
    it("creates a surface with minimal config", () => {
      const config: SurfaceConfig = {
        surfaceId: "main-surface",
        catalogId: "standard",
      };

      manager.createSurface(config);

      const surface = manager.getSurface("main-surface");
      expect(surface).toBeDefined();
      expect(surface?.config.surfaceId).toBe("main-surface");
      expect(surface?.config.catalogId).toBe("standard");
      expect(surface?.config.theme).toBeUndefined();
      expect(surface?.config.sendDataModel).toBeUndefined();
    });

    it("creates a surface with full config", () => {
      const config: SurfaceConfig = {
        surfaceId: "themed-surface",
        catalogId: "custom-v1",
        theme: "noir",
        sendDataModel: true,
      };

      manager.createSurface(config);

      const surface = manager.getSurface("themed-surface");
      expect(surface?.config.theme).toBe("noir");
      expect(surface?.config.sendDataModel).toBe(true);
    });

    it("initializes surface with empty components map", () => {
      manager.createSurface({
        surfaceId: "test-surface",
        catalogId: "standard",
      });

      const surface = manager.getSurface("test-surface");
      expect(surface?.components.size).toBe(0);
    });

    it("initializes surface with empty dataModel", () => {
      manager.createSurface({
        surfaceId: "test-surface",
        catalogId: "standard",
      });

      const surface = manager.getSurface("test-surface");
      expect(surface?.dataModel).toEqual({});
    });

    it("sets createdAt timestamp", () => {
      const before = Date.now();
      manager.createSurface({
        surfaceId: "test-surface",
        catalogId: "standard",
      });
      const after = Date.now();

      const surface = manager.getSurface("test-surface");
      expect(surface?.createdAt).toBeGreaterThanOrEqual(before);
      expect(surface?.createdAt).toBeLessThanOrEqual(after);
    });

    it("rejects duplicate surface IDs", () => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "standard",
      });

      expect(() => {
        manager.createSurface({
          surfaceId: "main-surface",
          catalogId: "other",
        });
      }).toThrow(/already exists/i);
    });

    it("enforces MAX_SURFACES limit of 10", () => {
      // Create 10 surfaces (should succeed)
      for (let i = 0; i < 10; i++) {
        manager.createSurface({
          surfaceId: `surface-${i}`,
          catalogId: "standard",
        });
      }

      // Creating 11th surface should fail
      expect(() => {
        manager.createSurface({
          surfaceId: "surface-10",
          catalogId: "standard",
        });
      }).toThrow(/maximum.*10/i);
    });
  });

  describe("getSurface", () => {
    it("returns undefined for non-existent surface", () => {
      const surface = manager.getSurface("non-existent");
      expect(surface).toBeUndefined();
    });

    it("returns existing surface", () => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "standard",
      });

      const surface = manager.getSurface("main-surface");
      expect(surface).toBeDefined();
      expect(surface?.config.surfaceId).toBe("main-surface");
    });
  });

  describe("hasSurface", () => {
    it("returns false for non-existent surface", () => {
      expect(manager.hasSurface("non-existent")).toBe(false);
    });

    it("returns true for existing surface", () => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "standard",
      });

      expect(manager.hasSurface("main-surface")).toBe(true);
    });
  });

  describe("updateComponents", () => {
    beforeEach(() => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "standard",
      });
    });

    it("adds new components to surface", () => {
      const components: SurfaceComponent[] = [
        { id: "btn-1", type: "button", label: "Submit" },
        { id: "card-1", type: "card", title: "Evidence" },
      ];

      manager.updateComponents("main-surface", components);

      const surface = manager.getSurface("main-surface");
      expect(surface?.components.size).toBe(2);
      expect(surface?.components.get("btn-1")).toEqual({
        id: "btn-1",
        type: "button",
        label: "Submit",
      });
    });

    it("updates existing components", () => {
      manager.updateComponents("main-surface", [{ id: "btn-1", type: "button", label: "Submit" }]);

      // Update the button
      manager.updateComponents("main-surface", [
        { id: "btn-1", type: "button", label: "Updated Label" },
      ]);

      const surface = manager.getSurface("main-surface");
      expect(surface?.components.get("btn-1")).toEqual({
        id: "btn-1",
        type: "button",
        label: "Updated Label",
      });
    });

    it("merges new components with existing ones", () => {
      manager.updateComponents("main-surface", [
        { id: "btn-1", type: "button", label: "Button 1" },
      ]);

      manager.updateComponents("main-surface", [
        { id: "btn-2", type: "button", label: "Button 2" },
      ]);

      const surface = manager.getSurface("main-surface");
      expect(surface?.components.size).toBe(2);
      expect(surface?.components.has("btn-1")).toBe(true);
      expect(surface?.components.has("btn-2")).toBe(true);
    });

    it("throws for non-existent surface", () => {
      expect(() => {
        manager.updateComponents("non-existent", []);
      }).toThrow(/not found/i);
    });

    it("handles empty components array", () => {
      manager.updateComponents("main-surface", []);

      const surface = manager.getSurface("main-surface");
      expect(surface?.components.size).toBe(0);
    });
  });

  describe("deleteSurface", () => {
    it("removes existing surface", () => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "standard",
      });

      manager.deleteSurface("main-surface");

      expect(manager.getSurface("main-surface")).toBeUndefined();
      expect(manager.hasSurface("main-surface")).toBe(false);
    });

    it("clears all components when surface is deleted", () => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "standard",
      });
      manager.updateComponents("main-surface", [
        { id: "btn-1", type: "button" },
        { id: "card-1", type: "card" },
      ]);

      manager.deleteSurface("main-surface");

      // Surface should be completely gone
      expect(manager.getSurface("main-surface")).toBeUndefined();
    });

    it("throws for non-existent surface", () => {
      expect(() => {
        manager.deleteSurface("non-existent");
      }).toThrow(/not found/i);
    });

    it("allows creating new surface with same ID after deletion", () => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "v1",
      });
      manager.deleteSurface("main-surface");

      // Should not throw
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "v2",
      });

      const surface = manager.getSurface("main-surface");
      expect(surface?.config.catalogId).toBe("v2");
    });
  });

  describe("hasRoot", () => {
    beforeEach(() => {
      manager.createSurface({
        surfaceId: "main-surface",
        catalogId: "standard",
      });
    });

    it("returns false when surface has no components", () => {
      expect(manager.hasRoot("main-surface")).toBe(false);
    });

    it("returns true when component id matches surfaceId", () => {
      manager.updateComponents("main-surface", [
        { id: "main-surface", type: "container", children: [] },
      ]);

      expect(manager.hasRoot("main-surface")).toBe(true);
    });

    it("returns true when component has special 'root' id", () => {
      manager.updateComponents("main-surface", [{ id: "root", type: "container", children: [] }]);

      expect(manager.hasRoot("main-surface")).toBe(true);
    });

    it("returns false when no root-like component exists", () => {
      manager.updateComponents("main-surface", [
        { id: "btn-1", type: "button" },
        { id: "card-1", type: "card" },
      ]);

      expect(manager.hasRoot("main-surface")).toBe(false);
    });

    it("throws for non-existent surface", () => {
      expect(() => {
        manager.hasRoot("non-existent");
      }).toThrow(/not found/i);
    });
  });

  describe("getSurfaceCount", () => {
    it("returns 0 when no surfaces exist", () => {
      expect(manager.getSurfaceCount()).toBe(0);
    });

    it("returns correct count after creating surfaces", () => {
      manager.createSurface({ surfaceId: "s1", catalogId: "standard" });
      manager.createSurface({ surfaceId: "s2", catalogId: "standard" });

      expect(manager.getSurfaceCount()).toBe(2);
    });

    it("decrements count after deletion", () => {
      manager.createSurface({ surfaceId: "s1", catalogId: "standard" });
      manager.createSurface({ surfaceId: "s2", catalogId: "standard" });
      manager.deleteSurface("s1");

      expect(manager.getSurfaceCount()).toBe(1);
    });
  });

  describe("getAllSurfaceIds", () => {
    it("returns empty array when no surfaces exist", () => {
      expect(manager.getAllSurfaceIds()).toEqual([]);
    });

    it("returns all surface IDs", () => {
      manager.createSurface({ surfaceId: "alpha", catalogId: "standard" });
      manager.createSurface({ surfaceId: "beta", catalogId: "standard" });
      manager.createSurface({ surfaceId: "gamma", catalogId: "standard" });

      const ids = manager.getAllSurfaceIds();
      expect(ids).toHaveLength(3);
      expect(ids).toContain("alpha");
      expect(ids).toContain("beta");
      expect(ids).toContain("gamma");
    });
  });

  describe("clear", () => {
    it("removes all surfaces", () => {
      manager.createSurface({ surfaceId: "s1", catalogId: "standard" });
      manager.createSurface({ surfaceId: "s2", catalogId: "standard" });
      manager.createSurface({ surfaceId: "s3", catalogId: "standard" });

      manager.clear();

      expect(manager.getSurfaceCount()).toBe(0);
      expect(manager.getAllSurfaceIds()).toEqual([]);
    });
  });
});
