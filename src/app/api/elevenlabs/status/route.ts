import "server-only";

export async function GET() {
  const configured = Boolean(process.env.ELEVENLABS_API_KEY);
  return Response.json({ configured });
}
