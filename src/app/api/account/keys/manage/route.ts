import { z } from "zod";
import { revokeApiKey, rotateApiKey } from "@/server/api-keys";

export const dynamic = "force-dynamic";

const ActionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["revoke", "rotate"]),
});

export async function POST(request: Request) {
  try {
    const body = ActionSchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json({ success: false, error: "Invalid action request" }, { status: 400 });
    }

    if (body.data.action === "revoke") {
      const ok = revokeApiKey(body.data.id, "anonymous-learner");
      return Response.json({ success: ok });
    }

    if (body.data.action === "rotate") {
      const res = rotateApiKey(body.data.id, "anonymous-learner");
      if (!res) return Response.json({ success: false, error: "Key not found" }, { status: 404 });
      return Response.json({
        success: true,
        data: {
          rawKey: res.rawKey,
          key: {
            id: res.keyRecord.id,
            name: res.keyRecord.name,
            prefix: res.keyRecord.prefix,
            scopes: res.keyRecord.scopes,
            createdAt: res.keyRecord.createdAt,
          },
        },
      });
    }

    return Response.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ success: false, error: "Operation failed" }, { status: 500 });
  }
}
