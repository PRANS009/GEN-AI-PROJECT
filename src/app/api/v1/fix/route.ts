import { z } from "zod";
import { fixSql } from "@/server/ai";
import { verifyAuthHeader } from "@/server/api-keys";

export const dynamic = "force-dynamic";

const FixBodySchema = z.object({
  sql: z.string().min(1),
  database: z.string().default("student_management"),
  error: z.string().optional(),
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
    const body = FixBodySchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid payload" } },
        { status: 400 },
      );
    }

    const result = await fixSql(body.data.sql, body.data.database, body.data.error);
    return Response.json({ success: true, requestId, data: result });
  } catch {
    return Response.json(
      { success: false, requestId, error: { code: "INTERNAL_ERROR", message: "Failed to fix SQL" } },
      { status: 500 },
    );
  }
}
