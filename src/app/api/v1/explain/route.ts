import { z } from "zod";
import { explainSql } from "@/server/ai";
import { verifyAuthHeader } from "@/server/api-keys";

export const dynamic = "force-dynamic";

const ExplainBodySchema = z.object({
  sql: z.string().min(1),
  database: z.string().default("student_management"),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
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
    return Response.json({ success: true, requestId, data: result });
  } catch {
    return Response.json(
      { success: false, requestId, error: { code: "INTERNAL_ERROR", message: "Failed to explain SQL" } },
      { status: 500 },
    );
  }
}
