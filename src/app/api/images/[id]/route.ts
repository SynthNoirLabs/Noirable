import { resolveImageBytes } from "@/lib/ai/resolveImageBytes";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileName = id ?? "";

  // Resolves from disk, or generates on demand if it's a still-deferred image.
  const file = await resolveImageBytes(fileName);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const body = new Uint8Array(file.data);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
