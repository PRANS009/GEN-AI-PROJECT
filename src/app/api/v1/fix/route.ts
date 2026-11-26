import { z } from "zod";
import { fixSql } from "@/server/ai";
import { verifyAuthHeader } from "@/server/api-keys";
import { logActivity } from "@/server/activity";

export const dynamic = "force-dynamic";

const FixBodySchema = z.object({
  sql: z.string().min(1),
  database: z.string().default("student_management"),
  error: z.string().optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const auth = await verifyAuthHeader(request.headers.get("authorization"), "ai:use");
  if (!auth.success) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: auth.error } },
      { status: 401 },
    );
  }

  try {
    const body = FixBodySchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid payload" } },
        { status: 400 },
      );
    }

    const result = await fixSql(body.data.sql, body.data.database, body.data.error);
    void logActivity({
      eventType: "ai.fix",
      module: "ai",
      action: "fix_sql",
      status: "success",
      description: `Fixed SQL query for ${body.data.database}`,
      durationMs: Math.round(performance.now() - startedAt),
      metadata: { database: body.data.database, via: auth.via || "session" },
    });
    return Response.json({ success: true, requestId, data: result });
  } catch {
    void logActivity({
      eventType: "ai.fix",
      module: "ai",
      action: "fix_sql",
      status: "failure",
      description: "SQL fix request failed",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return Response.json(
      { success: false, requestId, error: { code: "INTERNAL_ERROR", message: "Failed to fix SQL" } },
      { status: 500 },
    );
  }
}
