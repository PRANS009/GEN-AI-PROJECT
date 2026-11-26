import { z } from "zod";
import { requestGemini } from "@/server/ai";
import { verifyAuthHeader } from "@/server/api-keys";
import { dispatchWebhookEvent } from "@/server/webhooks";

export const dynamic = "force-dynamic";

const GenerateBodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  database: z.string().default("student_management"),
  dialect: z.string().default("sqlite"),
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
    const raw = await request.json();
    const body = GenerateBodySchema.safeParse(raw);
    if (!body.success) {
      return Response.json(
        {
          success: false,
          requestId,
          error: { code: "BAD_REQUEST", message: "Invalid request payload", details: body.error.format() },
        },
        { status: 400 },
      );
    }

    const result = await requestGemini(body.data.prompt, body.data.database);

    // Fire webhook
    void dispatchWebhookEvent("query.generated", {
      database: body.data.database,
      prompt: body.data.prompt,
      queryType: result.queryType,
    });

    return Response.json({
      success: true,
      requestId,
      data: {
        ...result,
        database: body.data.database,
        dialect: body.data.dialect,
      },
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        requestId,
        error: { code: "INTERNAL_ERROR", message: err instanceof Error ? err.message : "Failed to generate SQL" },
      },
      { status: 500 },
    );
  }
}
