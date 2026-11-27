import { z } from "zod";
import { executeSql } from "../../../../../workers/preview.mjs";
import { verifyAuthHeader } from "@/server/api-keys";
import { dispatchWebhookEvent } from "@/server/webhooks";
import { recordHistory } from "@/server/history";
import { logActivity } from "@/server/activity";
import { account } from "@/server/auth";
import { saveUserLearningState } from "@/server/user-state";

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
    void logActivity({
      userId: null,
      eventType: "sql.executed",
      module: "sql",
      action: "execute",
      status: "failure",
      description: "Unauthorized SQL execution request",
      metadata: { via: "api_key" },
    });
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

      void logActivity({
        eventType: "sql.executed",
        module: "sql",
        action: "execute",
        status: "success",
        description: `Executed SQL on ${body.data.database} (${result.totalRows} rows)`,
        durationMs: Math.round(result.durationMs),
        metadata: {
          queryId: historyItem.id,
          database: body.data.database,
          rowCount: result.totalRows,
          affectedRows: result.affectedRows,
          via: auth.via || "session",
        },
      });

      if (auth.via === "session") {
        const user = await account();
        if (user) {
          void saveUserLearningState(user.id, user.email ?? null, {
            last_route: "/playground",
            last_database: body.data.database,
            playground_sql: body.data.sql,
          });
        }
      }

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

      void logActivity({
        eventType: "sql.executed",
        module: "sql",
        action: "execute",
        status: "failure",
        description: `SQL execution failed on ${body.data.database}`,
        metadata: {
          queryId: historyItem.id,
          database: body.data.database,
          via: auth.via || "session",
        },
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
