import { requireAdmin } from "@/server/auth";
import { getAdminAnalytics } from "@/server/activity";

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

  const days = Number(new URL(request.url).searchParams.get("days") || 14);
  const analytics = await getAdminAnalytics(days);

  return Response.json(
    { success: true, requestId, data: analytics },
    { headers: { "Cache-Control": "no-store" } },
  );
}
