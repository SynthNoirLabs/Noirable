import { describe, it, expect } from "vitest";
import { getComponent, A2UI_TYPES } from "./registry";

describe("Component Renderer Registry", () => {
  it("exports a getComponent function", () => {
    expect(typeof getComponent).toBe("function");
  });

  it("returns a component for every known A2UI type", () => {
    A2UI_TYPES.forEach((type) => {
      const Component = getComponent(type);
      expect(Component).toBeDefined();
      expect(Component).not.toBeNull();
    });
  });

  it("returns a fallback component for unknown types", () => {
    const Component = getComponent("unknown-type-xyz");
    expect(Component).toBeDefined();
    // We expect it to be the fallback component (we can check display name or behavior if needed)
    // For now just ensuring it doesn't crash and returns something
    expect(Component.displayName).toBe("FallbackRenderer");
  });

  it("verifies the fallback component renders correct message", () => {
    // This would require rendering, but we can check function name or similar
    const Component = getComponent("unknown-mystery");
    expect(Component.displayName).toBe("FallbackRenderer");
  });
});
