/**
 * Typed ElevenLabs API client with consistent error handling.
 * Consolidates fetch plumbing (headers, base URL, error decode) for TTS, music,
 * voice design, and interrogation routes.
 */

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * Fetch wrapper for ElevenLabs API with automatic header injection and error handling.
 * Returns the raw Response; callers handle success/failure as needed.
 */
export async function elevenLabsFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }

  const url = `${ELEVENLABS_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("xi-api-key", apiKey);

  return fetch(url, {
    ...init,
    headers,
  });
}
