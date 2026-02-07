# Code Indexer MCP

Semantic code search MCP server using LanceDB and OpenAI embeddings.

## Features

- **Semantic Search**: Natural language queries to find relevant code
- **LanceDB**: Embedded vector database (no external services needed)
- **OpenAI Embeddings**: Uses `text-embedding-3-small` for high-quality embeddings
- **Multi-language**: TypeScript, JavaScript, Python, Markdown, JSON

## Installation

```bash
cd mcp/code-indexer
pnpm install
pnpm build
```

## Configuration

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "code-indexer": {
      "type": "local",
      "command": ["node", "/path/to/synth-noir-ui/mcp/code-indexer/dist/index.js"],
      "enabled": true
    }
  }
}
```

**Important**: Requires `OPENAI_API_KEY` environment variable with a proper API key (not OAuth tokens).

OAuth tokens from Claude Code/OpenAI CLI don't have embedding permissions. You need a platform API key from https://platform.openai.com/api-keys

```bash
export OPENAI_API_KEY=sk-...
```

## Tools

| Tool               | Description                               |
| ------------------ | ----------------------------------------- |
| `index_codebase`   | Index a directory for semantic search     |
| `search_code`      | Search indexed code with natural language |
| `get_index_status` | Get current index statistics              |
| `clear_index`      | Remove the index                          |

## Usage

```
> index_codebase path=/path/to/project
> search_code query="authentication middleware" limit=5
> get_index_status
```

## Architecture

```
Source Code
    ↓
Line-based Chunking (100 lines, 20 overlap)
    ↓
OpenAI Embeddings (text-embedding-3-small)
    ↓
LanceDB (embedded, .code-index/)
    ↓
Vector Search
```

## TODO

- [ ] AST-based chunking with tree-sitter
- [ ] Hybrid search (BM25 + vector)
- [ ] Incremental indexing
- [ ] Multiple embedding providers (Ollama, Jina)
