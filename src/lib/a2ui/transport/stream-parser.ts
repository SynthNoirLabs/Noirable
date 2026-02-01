/**
 * SSE/JSONL Transport Layer for A2UI v0.9 Protocol
 *
 * Parses Server-Sent Events streams with JSON payloads.
 * Handles connection lifecycle, error events, and large message support.
 */

// ============================================================================
// Types
// ============================================================================

/** Successfully parsed message */
export type ParsedMessage = {
  success: true;
  data: unknown;
};

/** Parse error with details */
export type ParseError = {
  type: "parse_error";
  message: string;
  raw: string;
};

/** Result of parsing a single SSE line */
export type ParseLineResult = ParsedMessage | { success: false; error: ParseError } | null;

/** Result of parsing a complete SSE stream */
export type ParseStreamResult = {
  messages: unknown[];
  errors: ParseError[];
};

/** Connection disconnect reason */
export type DisconnectInfo = {
  reason: "closed" | "error";
  error?: Error;
};

/** Stream parser lifecycle callbacks */
export type StreamParserOptions = {
  onMessage?: (data: unknown) => void;
  onError?: (error: ParseError) => void;
  onConnect?: () => void;
  onDisconnect?: (info: DisconnectInfo) => void;
};

/** Stream parser instance */
export type StreamParser = {
  /** Start the connection */
  connect: () => void;
  /** Close the connection gracefully */
  close: () => void;
  /** Signal a connection error */
  error: (err: Error) => void;
  /** Feed data chunk to the parser */
  feed: (chunk: string) => void;
  /** Check if connected */
  isConnected: () => boolean;
};

// ============================================================================
// Constants
// ============================================================================

const DATA_PREFIX = "data: ";
const DONE_SENTINEL = "[DONE]";

// ============================================================================
// Line Parsing
// ============================================================================

/**
 * Parse a single SSE line.
 *
 * @param line - Raw SSE line
 * @returns ParsedMessage on success, error object on parse failure, null for non-data lines
 */
export function parseSSELine(line: string): ParseLineResult {
  const trimmed = line.trim();

  // Skip empty lines
  if (trimmed.length === 0) {
    return null;
  }

  // Only process "data:" lines
  if (!trimmed.startsWith(DATA_PREFIX)) {
    return null;
  }

  // Extract payload after "data: "
  const payload = trimmed.slice(DATA_PREFIX.length).trim();

  // Skip [DONE] sentinel
  if (payload === DONE_SENTINEL) {
    return null;
  }

  // Skip empty payload
  if (payload.length === 0) {
    return null;
  }

  // Parse JSON
  try {
    const data = JSON.parse(payload) as unknown;
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    console.error(`[A2UI Transport] Parse error: ${message}`, { raw: payload });
    return {
      success: false,
      error: {
        type: "parse_error",
        message: `JSON parse error: ${message}`,
        raw: payload,
      },
    };
  }
}

// ============================================================================
// Stream Parsing
// ============================================================================

/**
 * Parse a complete SSE stream text.
 *
 * Splits on newlines and parses each data line.
 * Collects all errors (does not silently drop malformed messages).
 *
 * @param sseText - Raw SSE stream text
 * @returns Object with parsed messages and any errors encountered
 */
export function parseSSEStream(sseText: string): ParseStreamResult {
  const messages: unknown[] = [];
  const errors: ParseError[] = [];

  // Split on both LF and CRLF
  const lines = sseText.split(/\r?\n/);

  for (const line of lines) {
    const result = parseSSELine(line);

    if (result === null) {
      continue;
    }

    if (result.success) {
      messages.push(result.data);
    } else {
      errors.push(result.error);
    }
  }

  return { messages, errors };
}

// ============================================================================
// Stream Parser Factory
// ============================================================================

/**
 * Create a stream parser with connection lifecycle management.
 *
 * Supports:
 * - Connection lifecycle events (connect, disconnect)
 * - Chunked data handling (buffers incomplete lines)
 * - Error events for malformed JSON
 *
 * @param options - Lifecycle callbacks
 * @returns StreamParser instance
 */
export function createStreamParser(options: StreamParserOptions = {}): StreamParser {
  const { onMessage, onError, onConnect, onDisconnect } = options;

  let connected = false;
  let buffer = "";

  function processBuffer(): void {
    // Find complete lines in buffer
    let newlineIndex: number;

    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      // Handle CRLF
      const cleanLine = line.endsWith("\r") ? line.slice(0, -1) : line;

      const result = parseSSELine(cleanLine);

      if (result === null) {
        continue;
      }

      if (result.success) {
        onMessage?.(result.data);
      } else {
        onError?.(result.error);
      }
    }
  }

  return {
    connect(): void {
      if (!connected) {
        connected = true;
        buffer = "";
        onConnect?.();
      }
    },

    close(): void {
      if (connected) {
        connected = false;
        buffer = "";
        onDisconnect?.({ reason: "closed" });
      }
    },

    error(err: Error): void {
      if (connected) {
        connected = false;
        buffer = "";
        onDisconnect?.({ reason: "error", error: err });
      }
    },

    feed(chunk: string): void {
      if (!connected) {
        return;
      }

      buffer += chunk;
      processBuffer();
    },

    isConnected(): boolean {
      return connected;
    },
  };
}
