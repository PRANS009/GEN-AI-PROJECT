import { databaseConfig } from "@/config/studio";

export const dynamic = "force-dynamic";
export async function GET() {
  const requestId = crypto.randomUUID();
  const config = databaseConfig();
  const headers = { "Cache-Control": "no-store" };
  if (config) {
    try {
      const response = await fetch(
        new URL("/rest/v1/rpc/studio_schema_version", config.url),
        {
          method: "POST",
          headers: { apikey: config.key, "Content-Type": "application/json" },
          body: "{}",
          cache: "no-store",
          signal: AbortSignal.timeout(2500),
        },
      );
      if (response.ok && (await response.json()) === 1)
        return Response.json(
          { success: true, requestId, data: { status: "ready" } },
          { headers },
        );
    } catch {
      /* Return the same public readiness error for timeout and transport failure. */
    }
  }
  return Response.json(
    {
      success: false,
      requestId,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message:
          "The application database is unavailable or requires migration.",
      },
    },
    { status: 503, headers },
  );
}
