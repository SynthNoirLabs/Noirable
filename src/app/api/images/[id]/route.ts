import { readImageFile } from "@/lib/ai/imageStore";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fileName = id ?? "";
  const file = await readImageFile(fileName);
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
