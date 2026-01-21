import { readImageFile } from "@/lib/ai/imageStore";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const fileName = params?.id ?? "";
  const file = await readImageFile(fileName);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.data, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
