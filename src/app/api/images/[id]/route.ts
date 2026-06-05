import {
  readImageFile,
  getPendingImageMetadata,
  saveImageWithId,
  deletePendingImageMetadata,
} from "@/lib/ai/imageStore";
import { generateImageDataUrl } from "@/lib/ai/images";
import { NextRequest } from "next/server";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileName = id ?? "";

  let file = await readImageFile(fileName);
  if (!file) {
    const ext = path.extname(fileName);
    const uuid = path.basename(fileName, ext);
    const metadata = await getPendingImageMetadata(uuid);

    if (metadata) {
      const dataUrl = await generateImageDataUrl(
        metadata.prompt,
        metadata.aestheticId,
        metadata.customImageStylePrompt,
        metadata.imageModel
      );

      if (dataUrl) {
        const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
        if (match) {
          const mediaType = match[1];
          const base64 = match[2];

          await saveImageWithId({ id: uuid, mediaType, base64 });
          await deletePendingImageMetadata(uuid);

          file = await readImageFile(fileName);
        }
      }
    }
  }

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
