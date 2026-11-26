import { requireAdmin } from "@/server/auth";
import { queryActivityLogs } from "@/server/activity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const gate = await requireAdmin();
  if (!gate.authorized) {
    return Response.json(
      {
        success: false,
        requestId,
        error: { code: gate.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: gate.error },
      },
      { status: gate.status },
    );
  }

  const sp = new URL(request.url).searchParams;
  const result = await queryActivityLogs(
    {
      userId: sp.get("userId") || undefined,
      search: sp.get("search") || undefined,
      module: sp.get("module") || undefined,
      eventType: sp.get("eventType") || undefined,
      status: sp.get("status") || undefined,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      page: Number(sp.get("page") || 1),
      limit: Number(sp.get("limit") || 25),
    },
    true,
  );

  return Response.json(
    { success: true, requestId, data: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
