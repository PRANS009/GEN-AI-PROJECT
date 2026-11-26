import { listHistory } from "@/server/history";
import { verifyAuthHeader } from "@/server/api-keys";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const auth = await verifyAuthHeader(request.headers.get("authorization"), "history:read");
  if (!auth.success) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: auth.error } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const history = listHistory(limit);

  return Response.json({
    success: true,
    requestId,
    data: {
      items: history,
      count: history.length,
    },
  });
}
