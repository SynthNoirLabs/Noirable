import "server-only";

import { NextRequest } from "next/server";
import { getProviderWithOverrides, type ModelOverride } from "@/lib/ai/factory";
import { generateTheme } from "@/lib/ai/theme-generator";
import { apiSecurityCheck } from "@/lib/api/security";
import type { BuiltInAestheticId } from "@/lib/aesthetic/types";

const BASE_AESTHETIC_IDS: readonly BuiltInAestheticId[] = [
  "noir",
  "minimal",
  "cyber-fixer",
  "nostromo-console",
  "gothic-manor",
];

/**
 * Request body for the theme-generation endpoint. `prompt` is the free-text
 * vibe; `baseAestheticId` is an optional caller hint for the scaffolding
 * preset; `modelConfig` mirrors the chat route's override shape.
 */
interface ThemeRequestBody {
  prompt?: unknown;
  baseAestheticId?: unknown;
  modelConfig?: ModelOverride;
}

/**
 * POST /api/theme
 *
 * JSON endpoint (NOT SSE) that turns a free-text vibe into a generated custom
 * profile. Returns `{ success: true, profile }` on success. The profile omits
 * the store-owned id/timestamps; the client mints those via createProfile and
 * layers the rest in with updateProfile.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const securityError = apiSecurityCheck(req);
  if (securityError) return securityError;

  let body: ThemeRequestBody;
  try {
    body = (await req.json()) as ThemeRequestBody;
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, baseAestheticId, modelConfig } = body;
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json(
      { success: false, error: "Describe a vibe to generate a theme." },
      { status: 400 }
    );
  }

  // Accept the optional base hint only if it names a real built-in preset;
  // anything else is dropped so the model is free to choose.
  const baseHint =
    typeof baseAestheticId === "string" &&
    (BASE_AESTHETIC_IDS as readonly string[]).includes(baseAestheticId)
      ? (baseAestheticId as BuiltInAestheticId)
      : undefined;

  let auth;
  try {
    auth = getProviderWithOverrides(modelConfig);
  } catch (e) {
    console.error("Provider Factory Error:", e);
    return Response.json(
      { success: false, error: "Configuration Error: No API Key found." },
      { status: 500 }
    );
  }

  try {
    const profile = await generateTheme(auth, prompt, { baseAestheticId: baseHint });
    return Response.json({ success: true, profile });
  } catch (error) {
    console.error("Theme generation error:", error);
    const message =
      error instanceof Error ? error.message : "Theme generation failed. Please try again.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
