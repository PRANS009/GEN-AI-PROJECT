import { z } from "zod";
import { submitChallenge } from "@/server/curriculum";
import { verifyAuthHeader } from "@/server/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SubmitBodySchema = z.object({
  challengeId: z.string().min(1),
  sql: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const auth = await verifyAuthHeader(request.headers.get("authorization"), "challenges:submit");
  if (!auth.success) {
    return Response.json(
      { success: false, requestId, error: { code: "UNAUTHORIZED", message: auth.error } },
      { status: 401 },
    );
  }

  try {
    const raw = await request.json();
    const body = SubmitBodySchema.safeParse(raw);
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid challenge or SQL submission" } },
        { status: 400 },
      );
    }

    const evaluation = await submitChallenge(body.data.challengeId, body.data.sql, auth.ownerId);
    return Response.json({ success: true, requestId, data: evaluation });
  } catch (err) {
    return Response.json(
      {
        success: false,
        requestId,
        error: { code: "SUBMISSION_FAILED", message: err instanceof Error ? err.message : "Error evaluating challenge" },
      },
      { status: 400 },
    );
  }
}
