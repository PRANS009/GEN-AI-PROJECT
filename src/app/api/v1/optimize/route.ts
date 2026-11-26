import { z } from "zod";
import { optimizeSql } from "@/server/ai";
import { verifyAuthHeader } from "@/server/api-keys";
import { logActivity } from "@/server/activity";

export const dynamic = "force-dynamic";

const OptimizeBodySchema = z.object({
  sql: z.string().min(1),
  database: z.string().default("student_management"),
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
    const body = OptimizeBodySchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid payload" } },
        { status: 400 },
      );
    }

    const result = await optimizeSql(body.data.sql, body.data.database);
    void logActivity({
      eventType: "ai.optimize",
      module: "ai",
      action: "optimize_sql",
      status: "success",
      description: `Optimized SQL query for ${body.data.database}`,
      durationMs: Math.round(performance.now() - startedAt),
      metadata: { database: body.data.database, via: auth.via || "session" },
    });
    return Response.json({ success: true, requestId, data: result });
  } catch {
    void logActivity({
      eventType: "ai.optimize",
      module: "ai",
      action: "optimize_sql",
      status: "failure",
      description: "SQL optimization failed",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return Response.json(
      { success: false, requestId, error: { code: "INTERNAL_ERROR", message: "Failed to optimize SQL" } },
      { status: 500 },
    );
  }
}
