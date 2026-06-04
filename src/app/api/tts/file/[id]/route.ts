import { readRecordingFile } from "@/lib/ai/recordingStore";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hash = id ? id.replace(/\.mp3$/, "") : "";
  const data = await readRecordingFile(hash);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const body = new Uint8Array(data);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
