import { dispatchWebhookEvent } from "@/server/webhooks";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await dispatchWebhookEvent(
      "query.executed",
      {
        test: true,
        queryId: "test_query_001",
        status: "success",
        executionTimeMs: 12,
        rowCount: 5,
      },
      "anonymous-learner",
    );

    return Response.json({ success: true, message: "Dispatched synthetic test event" });
  } catch {
    return Response.json({ success: false, error: "Failed to dispatch test event" }, { status: 500 });
  }
}
