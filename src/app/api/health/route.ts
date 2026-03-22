export async function GET() {
  const nowIso = new Date().toISOString();

  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'digital-heroes',
      timestamp: nowIso,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
