import datasets from "@/content/datasets.ts";
import { verifyAuthHeader } from "@/server/api-keys";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const auth = await verifyAuthHeader(request.headers.get("authorization"), "schema:read");
  if (!auth.success) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: auth.error } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const dbId = searchParams.get("database");

  if (dbId) {
    const dataset = datasets.find((d) => d.id === dbId);
    if (!dataset) {
      return Response.json(
        { success: false, requestId, error: { code: "NOT_FOUND", message: `Database ${dbId} not found` } },
        { status: 404 },
      );
    }
    return Response.json({ success: true, requestId, data: dataset });
  }

  // Return list of all datasets
  const summaries = datasets.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    tableCount: d.tables.length,
    tables: d.tables.map((t) => t.name),
  }));

  return Response.json({ success: true, requestId, data: summaries });
}
