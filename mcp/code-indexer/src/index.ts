#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CodeIndexer } from "./indexer.js";
import { tools, handleToolCall } from "./tools.js";

const server = new Server(
  {
    name: "code-indexer",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

const indexer = new CodeIndexer();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return handleToolCall(request.params.name, request.params.arguments, indexer);
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const status = await indexer.getStatus();
  return {
    resources: [
      {
        uri: "code://index/status",
        name: "Index Status",
        description: `Current indexing status: ${status.indexed ? "Indexed" : "Not indexed"}`,
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "code://index/status") {
    const status = await indexer.getStatus();
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${request.params.uri}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Code Indexer MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
