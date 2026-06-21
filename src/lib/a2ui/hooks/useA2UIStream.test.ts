import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useA2UIStream } from "./useA2UIStream";
import type { SurfaceComponent } from "../surfaces/manager";

/**
 * Unit tests for useA2UIStream
 *
 * Tests the client-side SSE consumer hook that:
 * - Parses createSurface/updateComponents into the surface store
 * - Handles narration messages
 * - Handles [DONE]/stream end
 * - Handles malformed lines and stream errors gracefully
 */

// Mock the surface store
const mockCreateSurface = vi.fn();
const mockUpdateComponents = vi.fn();
const mockSetDataModel = vi.fn();
const mockDeleteSurface = vi.fn();
const mockClear = vi.fn();

vi.mock("../store/useSurfaceStore", () => ({
  useSurfaceStore: () => ({
    createSurface: mockCreateSurface,
    updateComponents: mockUpdateComponents,
    setDataModel: mockSetDataModel,
    deleteSurface: mockDeleteSurface,
    clear: mockClear,
  }),
}));

// Helper to create a mock SSE response
function createMockSSEResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
}

describe("useA2UIStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("returns the expected API", () => {
      const { result } = renderHook(() => useA2UIStream());

      expect(result.current.sendPrompt).toBeInstanceOf(Function);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.clearError).toBeInstanceOf(Function);
      expect(result.current.abort).toBeInstanceOf(Function);
    });

    it("accepts custom endpoint option", () => {
      const { result } = renderHook(() => useA2UIStream({ endpoint: "/api/custom/stream" }));

      expect(result.current.sendPrompt).toBeInstanceOf(Function);
    });
  });

  describe("sendPrompt - createSurface message", () => {
    it("parses createSurface and calls store", async () => {
      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(mockCreateSurface).toHaveBeenCalledWith({
          surfaceId: "surface-123",
          catalogId: "standard",
          theme: undefined,
        });
      });
    });

    it("parses createSurface with theme object", async () => {
      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-456","catalogId":"standard","theme":{"primaryColor":"#ff0000"}}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(mockCreateSurface).toHaveBeenCalledWith({
          surfaceId: "surface-456",
          catalogId: "standard",
          theme: { primaryColor: "#ff0000" },
        });
      });
    });
  });

  describe("sendPrompt - updateComponents message", () => {
    it("parses updateComponents and calls store", async () => {
      const components: SurfaceComponent[] = [
        { id: "comp-1", component: "Text", text: "Hello" },
        { id: "comp-2", component: "Button", label: "Click" },
      ];

      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        `data: {"type":"updateComponents","surfaceId":"surface-123","components":${JSON.stringify(components)}}\n`,
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(mockUpdateComponents).toHaveBeenCalledWith("surface-123", components);
      });
    });

    it("handles multiple updateComponents messages", async () => {
      const components1: SurfaceComponent[] = [{ id: "comp-1", component: "Text", text: "First" }];
      const components2: SurfaceComponent[] = [
        { id: "comp-2", component: "Button", label: "Second" },
      ];

      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        `data: {"type":"updateComponents","surfaceId":"surface-123","components":${JSON.stringify(components1)}}\n`,
        "\n",
        `data: {"type":"updateComponents","surfaceId":"surface-123","components":${JSON.stringify(components2)}}\n`,
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(mockUpdateComponents).toHaveBeenCalledTimes(2);
        expect(mockUpdateComponents).toHaveBeenNthCalledWith(1, "surface-123", components1);
        expect(mockUpdateComponents).toHaveBeenNthCalledWith(2, "surface-123", components2);
      });
    });
  });

  describe("sendPrompt - narration message", () => {
    it("calls onNarration callback with text", async () => {
      const onNarration = vi.fn();

      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        'data: {"type":"narration","text":"The detective examined the evidence carefully."}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream({ onNarration }));

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(onNarration).toHaveBeenCalledWith("The detective examined the evidence carefully.");
      });
    });

    it("does not call onNarration when callback not provided", async () => {
      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        'data: {"type":"narration","text":"Some narration"}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      // Should not throw
      await expect(result.current.sendPrompt("test prompt")).resolves.not.toThrow();
    });
  });

  describe("sendPrompt - source message", () => {
    it("calls onSource callback with tree", async () => {
      const onSource = vi.fn();
      const tree = { type: "container", children: [{ type: "card", title: "Test" }] };

      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        `data: {"type":"source","tree":${JSON.stringify(tree)}}\n`,
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream({ onSource }));

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(onSource).toHaveBeenCalledWith(tree);
      });
    });
  });

  describe("sendPrompt - stream completion", () => {
    it("calls onComplete with surfaceId when stream ends", async () => {
      const onComplete = vi.fn();

      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-789","catalogId":"standard"}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream({ onComplete }));

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith("surface-789");
      });
    });

    it("sets isStreaming to false after completion", async () => {
      const encoder = new TextEncoder();
      let streamController: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(controller) {
          streamController = controller;
          // Don't enqueue immediately - let test observe isStreaming=true
        },
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(stream, { headers: { "Content-Type": "text/event-stream" } })
      );

      const { result } = renderHook(() => useA2UIStream());

      expect(result.current.isStreaming).toBe(false);

      const promise = result.current.sendPrompt("test prompt");

      // Should be streaming during request
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      // Now send data and close
      streamController!.enqueue(
        encoder.encode(
          'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n\n'
        )
      );
      streamController!.enqueue(encoder.encode("data: [DONE]\n\n"));
      streamController!.close();

      await promise;

      // Should be done after completion
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });
    });
  });

  describe("sendPrompt - error handling", () => {
    it("handles HTTP error responses", async () => {
      const onError = vi.fn();

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Bad Request", { status: 400, statusText: "Bad Request" })
      );

      const { result } = renderHook(() => useA2UIStream({ onError }));

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toContain("400");
      });
    });

    it("handles network errors", async () => {
      const onError = vi.fn();

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useA2UIStream({ onError }));

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "Network error" }));
        expect(result.current.error?.message).toContain("Network error");
      });
    });

    it("handles malformed JSON gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        "data: {INVALID JSON}\n",
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      // Should still complete successfully, just log the parse error
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it("ignores non-A2UI messages", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        'data: {"type":"unknown","payload":"ignored"}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Ignoring non-A2UI message"),
          expect.any(Object)
        );
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe("abort", () => {
    it("aborts ongoing stream", async () => {
      const encoder = new TextEncoder();
      let streamController: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(controller) {
          streamController = controller;
          // Start but don't complete
          controller.enqueue(
            encoder.encode(
              'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n\n'
            )
          );
          // Don't close - leave it hanging so abort can be tested
        },
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(stream, { headers: { "Content-Type": "text/event-stream" } })
      );

      const { result } = renderHook(() => useA2UIStream());

      const promise = result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      result.current.abort();

      // Close the stream after abort to let promise resolve
      streamController!.close();

      await promise;

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

      // Abort should not trigger onError
      expect(result.current.error).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears error state", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Test error"));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      result.current.clearError();

      // Wait for React state update to propagate
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("sendPrompt - request body", () => {
    it("sends correct request body with all parameters", async () => {
      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"s1","catalogId":"standard"}\n\n',
        "data: [DONE]\n\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream({ endpoint: "/api/test" }));

      const baselineComponents: SurfaceComponent[] = [
        { id: "comp-1", component: "Text", text: "baseline" },
      ];

      await result.current.sendPrompt(
        "test prompt",
        "noir",
        "custom system",
        "custom image style",
        "imagen-3",
        baselineComponents,
        42
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/test",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: "test prompt",
              aestheticId: "noir",
              customSystemPrompt: "custom system",
              customImageStylePrompt: "custom image style",
              imageModel: "imagen-3",
              baselineComponents,
              compositionSeed: 42,
            }),
          })
        );
      });
    });

    it("clears surface store before each prompt", async () => {
      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"s1","catalogId":"standard"}\n\n',
        "data: [DONE]\n\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(mockClear).toHaveBeenCalled();
      });
    });
  });

  describe("deleteSurface message", () => {
    it("deletes surface from store", async () => {
      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        'data: {"type":"deleteSurface","surfaceId":"surface-123"}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(mockDeleteSurface).toHaveBeenCalledWith("surface-123");
      });
    });
  });

  describe("updateDataModel message", () => {
    it("updates data model in store", async () => {
      const sseLines = [
        'data: {"type":"createSurface","surfaceId":"surface-123","catalogId":"standard"}\n',
        "\n",
        'data: {"type":"updateDataModel","surfaceId":"surface-123","path":"/user/name","value":"John Doe"}\n',
        "\n",
        "data: [DONE]\n",
        "\n",
      ];

      vi.mocked(global.fetch).mockResolvedValueOnce(createMockSSEResponse(sseLines));

      const { result } = renderHook(() => useA2UIStream());

      await result.current.sendPrompt("test prompt");

      await waitFor(() => {
        expect(mockSetDataModel).toHaveBeenCalledWith("surface-123", "/user/name", "John Doe");
      });
    });
  });
});
