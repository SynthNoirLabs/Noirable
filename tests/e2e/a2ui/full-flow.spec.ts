import { test, expect } from "@playwright/test";

/**
 * A2UI v0.9 Full Flow E2E Tests
 *
 * Tests the complete flow: POST to /api/a2ui/stream -> SSE response -> render
 * Uses mock provider in E2E mode (E2E=1 env var set in playwright.config.ts)
 */

interface A2UIMessage {
  type: string;
  surfaceId?: string;
  catalogId?: string;
  components?: Array<{ component?: string; id?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

test.describe("A2UI Full Flow", () => {
  test("POST to /api/a2ui/stream returns valid SSE stream", async ({ request }) => {
    // Send prompt to A2UI stream endpoint
    const response = await request.post("/api/a2ui/stream", {
      data: { prompt: "Create a text component" },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toBe("text/event-stream");

    // Parse SSE response
    const body = await response.text();
    const lines = body.split("\n").filter((line) => line.startsWith("data: "));

    // Should have at least 2 data lines (createSurface + updateComponents) plus [DONE]
    expect(lines.length).toBeGreaterThanOrEqual(2);

    // Parse messages
    const messages = parseSSEMessages(body);

    // First message should be createSurface
    expect(messages[0]).toMatchObject({
      type: "createSurface",
      catalogId: "standard",
    });
    expect(messages[0].surfaceId).toBeDefined();

    // Second message should be updateComponents
    expect(messages[1]).toMatchObject({
      type: "updateComponents",
    });
    expect(messages[1].components).toBeInstanceOf(Array);
    expect(messages[1].components!.length).toBeGreaterThan(0);
  });

  test("stream returns Text component for text prompt", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      data: { prompt: "Show some text" },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    const messages = parseSSEMessages(body);

    // updateComponents should have a Text component
    const updateMsg = messages.find((m) => m.type === "updateComponents");
    expect(updateMsg).toBeDefined();
    expect(updateMsg!.components![0]).toMatchObject({
      component: "Text",
    });
  });

  test("stream returns Button component for button prompt", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      data: { prompt: "Create a button" },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    const messages = parseSSEMessages(body);

    // updateComponents should have a Button component
    const updateMsg = messages.find((m) => m.type === "updateComponents");
    expect(updateMsg).toBeDefined();
    expect(updateMsg!.components![0]).toMatchObject({
      component: "Button",
    });
  });

  test("stream returns Card component for card prompt", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      data: { prompt: "Create a card" },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    const messages = parseSSEMessages(body);

    // updateComponents should have a Card component
    const updateMsg = messages.find((m) => m.type === "updateComponents");
    expect(updateMsg).toBeDefined();
    expect(updateMsg!.components![0]).toMatchObject({
      component: "Card",
    });
  });

  test("stream ends with [DONE] sentinel", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      data: { prompt: "Create anything" },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain("data: [DONE]");
  });

  test("rejects empty prompt", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      data: { prompt: "" },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
  });

  test("rejects missing prompt", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      data: {},
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
  });

  test("rejects invalid JSON", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      headers: { "Content-Type": "application/json" },
      data: "not json",
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
  });

  test("surface IDs are unique across requests", async ({ request }) => {
    const response1 = await request.post("/api/a2ui/stream", {
      data: { prompt: "First request" },
    });
    const response2 = await request.post("/api/a2ui/stream", {
      data: { prompt: "Second request" },
    });

    const messages1 = parseSSEMessages(await response1.text());
    const messages2 = parseSSEMessages(await response2.text());

    const surfaceId1 = messages1.find((m) => m.type === "createSurface")?.surfaceId;
    const surfaceId2 = messages2.find((m) => m.type === "createSurface")?.surfaceId;

    expect(surfaceId1).toBeDefined();
    expect(surfaceId2).toBeDefined();
    expect(surfaceId1).not.toBe(surfaceId2);
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
