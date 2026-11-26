import { requireAdmin } from "@/server/auth";
import { getAdminUsersList } from "@/server/activity";

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

  const search = new URL(request.url).searchParams.get("search") || undefined;
  const users = await getAdminUsersList(search);
  return Response.json(
    { success: true, requestId, data: { users, total: users.length } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
