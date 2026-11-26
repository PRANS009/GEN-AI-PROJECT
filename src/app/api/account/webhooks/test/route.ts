import { dispatchWebhookEvent } from "@/server/webhooks";
import { logActivity } from "@/server/activity";

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

    void logActivity({
      eventType: "webhooks.tested",
      module: "webhooks",
      action: "send_test_event",
      status: "success",
      description: "Dispatched synthetic webhook test event",
    });

    return Response.json({ success: true, message: "Dispatched synthetic test event" });
  } catch {
    return Response.json({ success: false, error: "Failed to dispatch test event" }, { status: 500 });
  }
}
