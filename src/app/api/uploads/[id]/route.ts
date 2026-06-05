import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".ogg": "audio/ogg",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate parameter format to prevent path traversal and enforce alphanumeric/dashes/dots/exts
    const ID_PATTERN = /^[a-zA-Z0-9.-]+$/;
    if (!ID_PATTERN.test(id)) {
      return new Response("Invalid ID format", { status: 400 });
    }

    const ext = path.extname(id).toLowerCase();
    const contentType = EXT_TO_MIME[ext];
    if (!contentType) {
      return new Response("Unsupported file type", { status: 400 });
    }

    const uploadsDir = path.resolve(process.cwd(), ".data", "uploads");
    const filePath = path.resolve(uploadsDir, id);

    // Verify the resolved path starts with the absolute directory of .data/uploads/
    const relativePath = path.relative(uploadsDir, filePath);
    const isSafe = relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
    if (!isSafe) {
      return new Response("Access Denied", { status: 403 });
    }

    const data = await fs.readFile(filePath);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
