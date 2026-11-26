import { requireAdmin } from "@/server/auth";
import { queryActivityLogs, activityLogsToCsv } from "@/server/activity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireAdmin();
  if (!gate.authorized) {
    return Response.json(
      {
        success: false,
        error: { code: gate.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: gate.error },
      },
      { status: gate.status },
    );
  }

  const sp = new URL(request.url).searchParams;
  const { items } = await queryActivityLogs(
    {
      userId: sp.get("userId") || undefined,
      search: sp.get("search") || undefined,
      module: sp.get("module") || undefined,
      status: sp.get("status") || undefined,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      page: 1,
      limit: 100,
    },
    true,
  );

  const csv = activityLogsToCsv(items);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
