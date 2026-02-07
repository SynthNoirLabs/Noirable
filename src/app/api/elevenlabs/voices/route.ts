import "server-only";

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string | null;
  labels: Record<string, string>;
  description: string | null;
}

export interface VoiceListResponse {
  voices: Array<{
    id: string;
    name: string;
    previewUrl: string | null;
    labels: Record<string, string>;
    description: string | null;
  }>;
}

// In-memory cache. NOTE: Resets on each serverless cold start, so this acts as
// a best-effort optimization rather than a guaranteed cache layer.
let cachedVoices: VoiceListResponse | null = null;
let cacheExpiry = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  // Check for API key in header or env
  const headerKey = request.headers.get("x-elevenlabs-api-key");
  const apiKey = headerKey || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error: "Missing API key",
        message: "Provide ELEVENLABS_API_KEY or x-elevenlabs-api-key header",
      },
      { status: 401 }
    );
  }

  // Return cached if valid
  const now = Date.now();
  if (cachedVoices && now < cacheExpiry && !headerKey) {
    return Response.json(cachedVoices);
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: "ElevenLabs API error", details: errorText },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { voices: ElevenLabsVoice[] };

    // Transform to simplified format
    const result: VoiceListResponse = {
      voices: data.voices.map((v) => ({
        id: v.voice_id,
        name: v.name,
        previewUrl: v.preview_url,
        labels: v.labels || {},
        description: v.description,
      })),
    };

    // Cache if using env key (not custom header key)
    if (!headerKey) {
      cachedVoices = result;
      cacheExpiry = now + CACHE_DURATION_MS;
    }

    return Response.json(result);
  } catch (error) {
    console.error("ElevenLabs voices fetch failed:", error);
    return Response.json(
      {
        error: "Failed to fetch voices",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Clear cache (useful for testing)
export function clearVoiceCache() {
  cachedVoices = null;
  cacheExpiry = 0;
}
