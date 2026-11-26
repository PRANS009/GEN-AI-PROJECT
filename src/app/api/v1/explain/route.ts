import { z } from "zod";
import { explainSql } from "@/server/ai";
import { verifyAuthHeader } from "@/server/api-keys";
import { logActivity } from "@/server/activity";

export const dynamic = "force-dynamic";

const ExplainBodySchema = z.object({
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
    const body = ExplainBodySchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid SQL or database" } },
        { status: 400 },
      );
    }

    const result = await explainSql(body.data.sql, body.data.database);
    void logActivity({
      eventType: "ai.explain",
      module: "ai",
      action: "explain_sql",
      status: "success",
      description: `Explained SQL query for ${body.data.database}`,
      durationMs: Math.round(performance.now() - startedAt),
      metadata: { database: body.data.database, via: auth.via || "session" },
    });
    return Response.json({ success: true, requestId, data: result });
  } catch {
    void logActivity({
      eventType: "ai.explain",
      module: "ai",
      action: "explain_sql",
      status: "failure",
      description: "SQL explanation failed",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return Response.json(
      { success: false, requestId, error: { code: "INTERNAL_ERROR", message: "Failed to explain SQL" } },
      { status: 500 },
    );
  }
}
