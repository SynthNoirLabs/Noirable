import * as lancedb from "@lancedb/lancedb";
import { glob } from "glob";
import * as fs from "fs/promises";
import * as fssync from "fs";
import * as path from "path";
import * as os from "os";
import OpenAI from "openai";

interface CodeChunk {
  id: string;
  filePath: string;
  content: string;
  language: string;
  startLine: number;
  endLine: number;
  type: "function" | "class" | "method" | "file";
  name: string;
  embedding?: number[];
}

interface IndexedChunk extends CodeChunk {
  vector: number[];
  [key: string]: unknown;
}

interface IndexStatus {
  indexed: boolean;
  path?: string;
  chunkCount: number;
  lastIndexed?: string;
  languages: string[];
}

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".md": "markdown",
  ".json": "json",
};

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/*.min.js",
  "**/*.min.css",
  "**/package-lock.json",
  "**/pnpm-lock.yaml",
  "**/yarn.lock",
];

export class CodeIndexer {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private openai: OpenAI | null = null;
  private indexPath: string | null = null;
  private status: IndexStatus = {
    indexed: false,
    chunkCount: 0,
    languages: [],
  };

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      let apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        const authPath = path.join(os.homedir(), ".local/share/opencode/auth.json");
        if (fssync.existsSync(authPath)) {
          try {
            const config = JSON.parse(fssync.readFileSync(authPath, "utf-8"));
            if (config.openai) {
              apiKey = typeof config.openai === "string" ? config.openai : config.openai.access;
            }
          } catch {}
        }
      }

      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  async getStatus(): Promise<IndexStatus> {
    return this.status;
  }

  async indexCodebase(
    basePath: string
  ): Promise<{ success: boolean; message: string; chunkCount: number }> {
    const resolvedPath = path.resolve(basePath);
    const dbPath = path.join(resolvedPath, ".code-index");

    try {
      await fs.mkdir(dbPath, { recursive: true });
      this.db = await lancedb.connect(dbPath);
      this.indexPath = resolvedPath;

      const files = await this.discoverFiles(resolvedPath);
      const chunks = await this.chunkFiles(files, resolvedPath);

      if (chunks.length === 0) {
        return {
          success: false,
          message: "No code files found to index",
          chunkCount: 0,
        };
      }

      const indexedChunks = await this.embedChunks(chunks);

      if (this.table) {
        await this.db.dropTable("code_chunks");
      }

      this.table = await this.db.createTable("code_chunks", indexedChunks);

      const languages = [...new Set(chunks.map((c) => c.language))];
      this.status = {
        indexed: true,
        path: resolvedPath,
        chunkCount: chunks.length,
        lastIndexed: new Date().toISOString(),
        languages,
      };

      return {
        success: true,
        message: `Indexed ${chunks.length} chunks from ${files.length} files`,
        chunkCount: chunks.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Indexing failed: ${message}`,
        chunkCount: 0,
      };
    }
  }

  async search(
    query: string,
    options: { limit?: number; language?: string } = {}
  ): Promise<{
    results: Array<{
      filePath: string;
      content: string;
      score: number;
      line: number;
    }>;
  }> {
    if (!this.table) {
      return { results: [] };
    }

    const limit = options.limit ?? 10;

    try {
      const queryEmbedding = await this.embed(query);

      let searchQuery = this.table.vectorSearch(queryEmbedding).limit(limit);

      if (options.language) {
        searchQuery = searchQuery.where(`language = '${options.language}'`);
      }

      const results = await searchQuery.toArray();

      return {
        results: results.map((r) => ({
          filePath: r.filePath as string,
          content: r.content as string,
          score: r._distance as number,
          line: r.startLine as number,
        })),
      };
    } catch (error) {
      console.error("Search error:", error);
      return { results: [] };
    }
  }

  async clearIndex(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.db && this.table) {
        await this.db.dropTable("code_chunks");
        this.table = null;
      }

      this.status = {
        indexed: false,
        chunkCount: 0,
        languages: [],
      };

      return { success: true, message: "Index cleared successfully" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, message: `Failed to clear index: ${message}` };
    }
  }

  private async discoverFiles(basePath: string): Promise<string[]> {
    const patterns = Object.keys(SUPPORTED_EXTENSIONS).map((ext) => `**/*${ext}`);

    const files = await glob(patterns, {
      cwd: basePath,
      absolute: true,
      ignore: IGNORE_PATTERNS,
    });

    return files;
  }

  private async chunkFiles(files: string[], basePath: string): Promise<CodeChunk[]> {
    const chunks: CodeChunk[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const ext = path.extname(file);
        const language = SUPPORTED_EXTENSIONS[ext] || "unknown";
        const relativePath = path.relative(basePath, file);

        const lines = content.split("\n");
        const chunkSize = 100;
        const overlap = 20;

        for (let i = 0; i < lines.length; i += chunkSize - overlap) {
          const chunkLines = lines.slice(i, i + chunkSize);
          const chunkContent = chunkLines.join("\n");

          if (chunkContent.trim().length < 50) continue;

          chunks.push({
            id: `${relativePath}:${i + 1}`,
            filePath: relativePath,
            content: chunkContent,
            language,
            startLine: i + 1,
            endLine: Math.min(i + chunkSize, lines.length),
            type: "file",
            name: path.basename(file),
          });
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }

    return chunks;
  }

  private async embedChunks(chunks: CodeChunk[]): Promise<IndexedChunk[]> {
    const batchSize = 100;
    const indexedChunks: IndexedChunk[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => `${c.filePath}\n${c.content}`);

      const response = await this.getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });

      for (let j = 0; j < batch.length; j++) {
        indexedChunks.push({
          ...batch[j],
          vector: response.data[j].embedding,
        });
      }
    }

    return indexedChunks;
  }

  private async embed(text: string): Promise<number[]> {
    const response = await this.getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  }
}
