import { test, expect } from "@playwright/test";

/**
 * A2UI v0.9 Multi-Surface E2E Tests
 *
 * Tests that multiple surfaces can coexist without interference.
 * Each surface should maintain its own component tree and state.
 */

interface A2UIMessage {
  type: string;
  surfaceId?: string;
  catalogId?: string;
  components?: Array<{ component?: string; id?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

test.describe("A2UI Multi-Surface", () => {
  test("4 surfaces can be created independently", async ({ request }) => {
    // Create 4 surfaces with different prompts
    const prompts = [
      "Create a text component",
      "Create a button component",
      "Create a card component",
      "Create another text component",
    ];

    const responses = await Promise.all(
      prompts.map((prompt) =>
        request.post("/api/a2ui/stream", {
          data: { prompt },
        })
      )
    );

    // All responses should succeed
    for (const response of responses) {
      expect(response.ok()).toBeTruthy();
    }

    // Parse all messages
    const allMessages = await Promise.all(
      responses.map(async (response) => parseSSEMessages(await response.text()))
    );

    // Each should have a createSurface message
    const surfaceIds = allMessages.map(
      (messages) => messages.find((m) => m.type === "createSurface")?.surfaceId
    );

    // All surface IDs should be defined
    expect(surfaceIds.every((id) => id !== undefined)).toBeTruthy();

    // All surface IDs should be unique
    const uniqueIds = new Set(surfaceIds);
    expect(uniqueIds.size).toBe(4);
  });

  test("surfaces have independent component trees", async ({ request }) => {
    // Create surfaces with different component types
    const prompts = ["Create a button", "Create a card", "Create some text"];

    const responses = await Promise.all(
      prompts.map((prompt) =>
        request.post("/api/a2ui/stream", {
          data: { prompt },
        })
      )
    );

    const allMessages = await Promise.all(
      responses.map(async (response) => parseSSEMessages(await response.text()))
    );

    // Extract component types from each surface
    const componentTypes = allMessages.map((messages) => {
      const updateMsg = messages.find((m) => m.type === "updateComponents");
      return updateMsg?.components?.[0]?.component;
    });

    // Each surface should have its own component type
    expect(componentTypes[0]).toBe("Button");
    expect(componentTypes[1]).toBe("Card");
    expect(componentTypes[2]).toBe("Text");
  });

  test("surfaces maintain isolation - no cross-contamination", async ({ request }) => {
    // Create first surface
    const response1 = await request.post("/api/a2ui/stream", {
      data: { prompt: "Create a button" },
    });

    // Create second surface
    const response2 = await request.post("/api/a2ui/stream", {
      data: { prompt: "Create a card" },
    });

    const messages1 = parseSSEMessages(await response1.text());
    const messages2 = parseSSEMessages(await response2.text());

    // Get surface IDs
    const surfaceId1 = messages1.find((m) => m.type === "createSurface")?.surfaceId;
    const surfaceId2 = messages2.find((m) => m.type === "createSurface")?.surfaceId;

    // Surface IDs in updateComponents should match their createSurface
    const updateSurfaceId1 = messages1.find((m) => m.type === "updateComponents")?.surfaceId;
    const updateSurfaceId2 = messages2.find((m) => m.type === "updateComponents")?.surfaceId;

    expect(updateSurfaceId1).toBe(surfaceId1);
    expect(updateSurfaceId2).toBe(surfaceId2);

    // No cross-contamination
    expect(updateSurfaceId1).not.toBe(surfaceId2);
    expect(updateSurfaceId2).not.toBe(surfaceId1);
  });

  test("concurrent surface creation does not cause race conditions", async ({ request }) => {
    // Fire 4 requests simultaneously
    const startTime = Date.now();
    const responses = await Promise.all([
      request.post("/api/a2ui/stream", { data: { prompt: "Surface 1" } }),
      request.post("/api/a2ui/stream", { data: { prompt: "Surface 2" } }),
      request.post("/api/a2ui/stream", { data: { prompt: "Surface 3" } }),
      request.post("/api/a2ui/stream", { data: { prompt: "Surface 4" } }),
    ]);
    const endTime = Date.now();

    // All should complete quickly (mock mode should be fast)
    expect(endTime - startTime).toBeLessThan(5000);

    // All should succeed
    for (const response of responses) {
      expect(response.ok()).toBeTruthy();
    }

    // All should have unique surface IDs
    const allMessages = await Promise.all(
      responses.map(async (response) => parseSSEMessages(await response.text()))
    );

    const surfaceIds = allMessages
      .map((messages) => messages.find((m) => m.type === "createSurface")?.surfaceId)
      .filter(Boolean);

    expect(new Set(surfaceIds).size).toBe(4);
  });

  test("each surface has properly formatted messages", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      data: { prompt: "Test surface" },
    });

    const messages = parseSSEMessages(await response.text());

    // Should have exactly 2 messages (createSurface and updateComponents)
    expect(messages.length).toBe(2);

    // createSurface should have required fields
    const createMsg = messages[0];
    expect(createMsg.type).toBe("createSurface");
    expect(createMsg.surfaceId).toBeDefined();
    expect(typeof createMsg.surfaceId).toBe("string");
    expect(createMsg.catalogId).toBe("standard");

    // updateComponents should have required fields
    const updateMsg = messages[1];
    expect(updateMsg.type).toBe("updateComponents");
    expect(updateMsg.surfaceId).toBe(createMsg.surfaceId);
    expect(Array.isArray(updateMsg.components)).toBeTruthy();
  });
});

/**
 * Helper: Parse SSE messages from response body
 */
function parseSSEMessages(body: string): A2UIMessage[] {
  return body
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.replace("data: ", ""))
    .filter((data) => data !== "[DONE]")
    .map((data) => JSON.parse(data) as A2UIMessage);
}
