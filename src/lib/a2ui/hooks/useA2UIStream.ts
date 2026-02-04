"use client";

import { useCallback, useRef, useState } from "react";
import { useSurfaceStore } from "../store/useSurfaceStore";
import { createStreamParser } from "../transport/stream-parser";
import type { SurfaceComponent } from "../surfaces/manager";

/**
 * A2UI v0.9 Stream Hook
 *
 * Consumes SSE stream from /api/a2ui/stream and updates surface store.
 */

// ============================================================================
// Types
// ============================================================================

export interface UseA2UIStreamOptions {
  /** API endpoint (default: /api/a2ui/stream) */
  endpoint?: string;
  /** Callback when stream completes */
  onComplete?: (surfaceId: string) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseA2UIStreamResult {
  /** Send a prompt to generate UI */
  sendPrompt: (prompt: string) => Promise<void>;
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Last error if any */
  error: Error | null;
  /** Clear error state */
  clearError: () => void;
  /** Abort current stream */
  abort: () => void;
}

// ============================================================================
// Message type guards
// ============================================================================

interface CreateSurfacePayload {
  type: "createSurface";
  surfaceId: string;
  catalogId: string;
  theme?: Record<string, unknown>;
}

interface UpdateComponentsPayload {
  type: "updateComponents";
  surfaceId: string;
  components: SurfaceComponent[];
}

interface UpdateDataModelPayload {
  type: "updateDataModel";
  surfaceId: string;
  path: string;
  value: unknown;
}

interface DeleteSurfacePayload {
  type: "deleteSurface";
  surfaceId: string;
}

type A2UIMessage =
  | CreateSurfacePayload
  | UpdateComponentsPayload
  | UpdateDataModelPayload
  | DeleteSurfacePayload;

function isA2UIMessage(data: unknown): data is A2UIMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as { type?: string };
  return (
    msg.type === "createSurface" ||
    msg.type === "updateComponents" ||
    msg.type === "updateDataModel" ||
    msg.type === "deleteSurface"
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useA2UIStream(options: UseA2UIStreamOptions = {}): UseA2UIStreamResult {
  const { endpoint = "/api/a2ui/stream", onComplete, onError } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentSurfaceIdRef = useRef<string | null>(null);

  const { createSurface, updateComponents, setDataModel, deleteSurface } = useSurfaceStore();

  const handleMessage = useCallback(
    (data: unknown) => {
      if (!isA2UIMessage(data)) {
        console.warn("[useA2UIStream] Ignoring non-A2UI message:", data);
        return;
      }

      switch (data.type) {
        case "createSurface":
          createSurface({
            surfaceId: data.surfaceId,
            catalogId: data.catalogId,
            theme: data.theme ? String(data.theme) : undefined,
          });
          currentSurfaceIdRef.current = data.surfaceId;
          break;

        case "updateComponents":
          updateComponents(data.surfaceId, data.components);
          break;

        case "updateDataModel":
          setDataModel(data.surfaceId, data.path, data.value);
          break;

        case "deleteSurface":
          deleteSurface(data.surfaceId);
          if (currentSurfaceIdRef.current === data.surfaceId) {
            currentSurfaceIdRef.current = null;
          }
          break;
      }
    },
    [createSurface, updateComponents, setDataModel, deleteSurface]
  );

  const sendPrompt = useCallback(
    async (prompt: string) => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      currentSurfaceIdRef.current = null;

      setIsStreaming(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const parser = createStreamParser({
          onMessage: handleMessage,
          onError: (parseError) => {
            console.error("[useA2UIStream] Parse error:", parseError);
          },
        });

        parser.connect();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            parser.feed(chunk);
          }
        } finally {
          parser.close();
        }

        // Stream completed successfully
        if (currentSurfaceIdRef.current) {
          onComplete?.(currentSurfaceIdRef.current);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Intentional abort, not an error
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsStreaming(false);
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [endpoint, handleMessage, onComplete, onError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  return {
    sendPrompt,
    isStreaming,
    error,
    clearError,
    abort,
  };
}
