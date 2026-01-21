import { z } from "zod";
import type { CodeIndexer } from "./indexer.js";

const indexCodebaseSchema = z.object({
  path: z.string().describe("Path to the codebase directory to index"),
});

const searchCodeSchema = z.object({
  query: z.string().describe("Natural language search query"),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of results"),
  language: z.string().optional().describe("Filter by programming language"),
});

export const tools = [
  {
    name: "index_codebase",
    description:
      "Index a codebase for semantic search. Creates embeddings for all code files and stores them in a local vector database.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Path to the codebase directory to index",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "search_code",
    description:
      "Search the indexed codebase using natural language. Returns relevant code snippets ranked by semantic similarity.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Natural language search query",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 10)",
        },
        language: {
          type: "string",
          description:
            "Filter by programming language (e.g., typescript, python)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_index_status",
    description:
      "Get the current status of the code index including number of chunks and indexed languages.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "clear_index",
    description: "Clear the current code index and free up resources.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
  indexer: CodeIndexer,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "index_codebase": {
      const parsed = indexCodebaseSchema.parse(args);
      const result = await indexer.indexCodebase(parsed.path);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "search_code": {
      const parsed = searchCodeSchema.parse(args);
      const result = await indexer.search(parsed.query, {
        limit: parsed.limit,
        language: parsed.language,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "get_index_status": {
      const status = await indexer.getStatus();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    case "clear_index": {
      const result = await indexer.clearIndex();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
