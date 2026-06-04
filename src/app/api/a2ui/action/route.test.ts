// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { ServerMessage } from "@/lib/a2ui/schema/messages";

// Mock server-only
vi.mock("server-only", () => ({}));

interface ActionResponseBody {
  messages: ServerMessage[];
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/a2ui/action", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/a2ui/action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a POST handler", async () => {
    const { POST } = await import("./route");
    expect(typeof POST).toBe("function");
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest("not valid json"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when actionName is missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ type: "action", surfaceId: "surface-1", timestamp: 1 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when surfaceId is missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ type: "action", actionName: "submit", timestamp: 1 }));
    expect(res.status).toBe(400);
  });

  it("responds with a { messages: [...] } shape", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({
        type: "action",
        surfaceId: "surface-1",
        sourceComponentId: "btn-1",
        actionName: "noop",
        timestamp: 1,
      })
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as ActionResponseBody;
    expect(Array.isArray(json.messages)).toBe(true);
    expect(json.messages.length).toBeGreaterThan(0);
  });

  it("submit -> updateDataModel setting /status", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({
        type: "action",
        surfaceId: "surface-1",
        sourceComponentId: "btn-1",
        actionName: "submit",
        timestamp: 1,
        context: { formValues: { name: "Jane" } },
      })
    );
    const json = (await res.json()) as ActionResponseBody;

    const statusMsg = json.messages.find(
      (m): m is Extract<ServerMessage, { type: "updateDataModel" }> =>
        m.type === "updateDataModel" && m.path === "/status"
    );
    expect(statusMsg).toBeDefined();
    expect(typeof statusMsg?.value).toBe("string");

    // Echoes form values into /lastSubmission
    const submissionMsg = json.messages.find(
      (m): m is Extract<ServerMessage, { type: "updateDataModel" }> =>
        m.type === "updateDataModel" && m.path === "/lastSubmission"
    );
    expect(submissionMsg?.value).toEqual({ name: "Jane" });
  });

  it("submit_case is treated as a submit action", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({
        type: "action",
        surfaceId: "surface-1",
        sourceComponentId: "btn-1",
        actionName: "submit_case",
        timestamp: 1,
      })
    );
    const json = (await res.json()) as ActionResponseBody;
    const statusMsg = json.messages.find(
      (m) => m.type === "updateDataModel" && m.path === "/status"
    );
    expect(statusMsg).toBeDefined();
  });

  it("increment -> updateDataModel bumping /count from context", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({
        type: "action",
        surfaceId: "surface-1",
        sourceComponentId: "btn-1",
        actionName: "increment",
        timestamp: 1,
        context: { dataBindings: { count: 4 } },
      })
    );
    const json = (await res.json()) as ActionResponseBody;
    const countMsg = json.messages.find(
      (m): m is Extract<ServerMessage, { type: "updateDataModel" }> =>
        m.type === "updateDataModel" && m.path === "/count"
    );
    expect(countMsg?.value).toBe(5);
  });

  it("increment defaults to 1 when no current value is present", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({
        type: "action",
        surfaceId: "surface-1",
        sourceComponentId: "btn-1",
        actionName: "increment",
        timestamp: 1,
      })
    );
    const json = (await res.json()) as ActionResponseBody;
    const countMsg = json.messages.find(
      (m): m is Extract<ServerMessage, { type: "updateDataModel" }> =>
        m.type === "updateDataModel" && m.path === "/count"
    );
    expect(countMsg?.value).toBe(1);
  });

  it("default action -> updateDataModel setting /lastAction", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({
        type: "action",
        surfaceId: "surface-1",
        sourceComponentId: "btn-1",
        actionName: "doSomething",
        timestamp: 1,
      })
    );
    const json = (await res.json()) as ActionResponseBody;
    const lastActionMsg = json.messages.find(
      (m): m is Extract<ServerMessage, { type: "updateDataModel" }> =>
        m.type === "updateDataModel" && m.path === "/lastAction"
    );
    expect(lastActionMsg?.value).toBe("doSomething");
  });

  it("preserves the incoming surfaceId on every returned message", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({
        type: "action",
        surfaceId: "surface-xyz",
        sourceComponentId: "btn-1",
        actionName: "submit",
        timestamp: 1,
        context: { formValues: { a: 1 } },
      })
    );
    const json = (await res.json()) as ActionResponseBody;
    expect(json.messages.length).toBeGreaterThan(0);
    for (const msg of json.messages) {
      expect(msg.surfaceId).toBe("surface-xyz");
    }
  });
});
