/**
 * A2UI Transport Layer
 *
 * SSE/JSONL streaming transport for A2UI v0.9 protocol.
 *
 * @example
 * ```typescript
 * import { createStreamParser, parseSSEStream } from '@/lib/a2ui/transport';
 *
 * // Batch parsing
 * const { messages, errors } = parseSSEStream(sseText);
 *
 * // Streaming parsing with lifecycle
 * const parser = createStreamParser({
 *   onMessage: (data) => console.log('Message:', data),
 *   onError: (err) => console.error('Parse error:', err),
 *   onConnect: () => console.log('Connected'),
 *   onDisconnect: (info) => console.log('Disconnected:', info.reason),
 * });
 *
 * parser.connect();
 * parser.feed(chunk1);
 * parser.feed(chunk2);
 * parser.close();
 * ```
 */

export {
  // Functions
  parseSSELine,
  parseSSEStream,
  createStreamParser,
  // Types
  type ParsedMessage,
  type ParseError,
  type ParseLineResult,
  type ParseStreamResult,
  type DisconnectInfo,
  type StreamParserOptions,
  type StreamParser,
} from "./stream-parser";
