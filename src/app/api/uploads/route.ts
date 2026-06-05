import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { apiSecurityCheck } from "@/lib/api/security";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

// Mapping of mime types to extensions
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

export async function POST(request: NextRequest) {
  // Same-origin + rate-limit gate, consistent with the other mutating routes
  // (chat, tts, a2ui/*). Prevents anonymous cross-origin POSTs from filling the
  // uploads dir.
  const securityError = apiSecurityCheck(request);
  if (securityError) return securityError;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  try {
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded or invalid parameter" }, { status: 400 });
    }

    const fileType = file.type;
    const fileSize = file.size;

    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(fileType);

    if (!isImage && !isAudio) {
      return NextResponse.json({ error: `File type ${fileType} is not allowed` }, { status: 400 });
    }

    if (isImage && fileSize > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image size exceeds 10MB limit" }, { status: 400 });
    }

    if (isAudio && fileSize > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: "Audio size exceeds 20MB limit" }, { status: 400 });
    }

    const ext = MIME_TO_EXT[fileType];
    if (!ext) {
      return NextResponse.json({ error: "Could not determine file extension" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), ".data", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/api/uploads/${fileName}` });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
