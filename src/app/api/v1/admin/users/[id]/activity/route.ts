import { requireAdmin, authClient, serviceClient } from "@/server/auth";
import { queryActivityLogs, getUserSummary } from "@/server/activity";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;
  const sp = new URL(request.url).searchParams;
  const db = serviceClient() || (await authClient());
  let profile = null;
  if (db) {
    const { data } = await db
      .from("profiles")
      .select("id, email, display_name, role, created_at, last_login_at, last_active_at")
      .eq("id", id)
      .maybeSingle();
    profile = data;
  }

  const [summary, activity] = await Promise.all([
    getUserSummary(id),
    queryActivityLogs(
      {
        userId: id,
        page: Number(sp.get("page") || 1),
        limit: Number(sp.get("limit") || 25),
        module: sp.get("module") || undefined,
        status: sp.get("status") || undefined,
      },
      true,
    ),
  ]);

  return Response.json(
    { success: true, requestId, data: { profile, summary, activity } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
