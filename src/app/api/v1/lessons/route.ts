import { listCurriculum } from "@/server/curriculum";
import { verifyAuthHeader } from "@/server/api-keys";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const auth = await verifyAuthHeader(request.headers.get("authorization"), "learning:read");
  if (!auth.success) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: auth.error } },
      { status: 401 },
    );
  }

  const data = listCurriculum(auth.ownerId);
  return Response.json({ success: true, requestId, data });
}
