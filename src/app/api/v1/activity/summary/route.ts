import { account } from "@/server/auth";
import { getUserSummary } from "@/server/activity";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = crypto.randomUUID();
  const user = await account();
  if (!user) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: "Sign in to view activity summary." } },
      { status: 401 },
    );
  }

  const summary = await getUserSummary(user.id);
  return Response.json(
    { success: true, requestId, data: summary },
    { headers: { "Cache-Control": "no-store" } },
  );
}
