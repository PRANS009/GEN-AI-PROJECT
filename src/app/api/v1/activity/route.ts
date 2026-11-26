import { account } from "@/server/auth";
import { queryActivityLogs } from "@/server/activity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const user = await account();
  if (!user) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: "Sign in to view your activity history." } },
      { status: 401 },
    );
  }

  const sp = new URL(request.url).searchParams;
  const result = await queryActivityLogs(
    {
      userId: user.id,
      search: sp.get("search") || undefined,
      module: sp.get("module") || undefined,
      eventType: sp.get("eventType") || undefined,
      status: sp.get("status") || undefined,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      page: Number(sp.get("page") || 1),
      limit: Number(sp.get("limit") || 20),
    },
    false,
  );

  return Response.json(
    { success: true, requestId, data: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
