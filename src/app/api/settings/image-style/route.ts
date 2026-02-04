import "server-only";

import { setCustomImageStylePrompt } from "@/lib/ai/image-style";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string | null };
    setCustomImageStylePrompt(body.prompt ?? null);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  setCustomImageStylePrompt(null);
  return Response.json({ success: true });
}
