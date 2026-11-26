import { z } from "zod";
import { executeSql } from "../../../../../workers/preview.mjs";
import { verifyAuthHeader } from "@/server/api-keys";
import { dispatchWebhookEvent } from "@/server/webhooks";
import { recordHistory } from "@/server/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ExecuteBodySchema = z.object({
  sql: z.string().min(1).max(5000),
  database: z.string().default("student_management"),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const auth = await verifyAuthHeader(request.headers.get("authorization"), "sql:execute");
  if (!auth.success) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: auth.error } },
      { status: 401 },
    );
  }

  try {
    const raw = await request.json();
    const body = ExecuteBodySchema.safeParse(raw);
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid SQL or database" } },
        { status: 400 },
      );
    }

    try {
      const result = await executeSql(body.data.database, body.data.sql);

      // Record to history
      const historyItem = recordHistory({
        sql: body.data.sql,
        database: body.data.database,
        status: "success",
        durationMs: result.durationMs,
        rowCount: result.totalRows,
        affectedRows: result.affectedRows,
      });

      // Dispatch webhook
      void dispatchWebhookEvent("query.executed", {
        queryId: historyItem.id,
        status: "success",
        executionTimeMs: result.durationMs,
        rowCount: result.totalRows,
        affectedRows: result.affectedRows,
      });

      return Response.json({
        success: true,
        requestId,
        data: {
          ...result,
          queryId: historyItem.id,
        },
      });
    } catch (sqlErr) {
      const errorMsg = sqlErr instanceof Error ? sqlErr.message : "SQL execution error";

      const historyItem = recordHistory({
        sql: body.data.sql,
        database: body.data.database,
        status: "error",
        durationMs: 0,
        rowCount: 0,
        affectedRows: 0,
        error: errorMsg,
      });

      void dispatchWebhookEvent("query.failed", {
        queryId: historyItem.id,
        error: errorMsg,
      });

      return Response.json(
        {
          success: false,
          requestId,
          error: {
            code: "SQL_ERROR",
            message: errorMsg,
            queryId: historyItem.id,
          },
        },
        { status: 400 },
      );
    }
  } catch {
    return Response.json(
      { success: false, requestId, error: { code: "INTERNAL_ERROR", message: "Failed to process execution" } },
      { status: 500 },
    );
  }
}
