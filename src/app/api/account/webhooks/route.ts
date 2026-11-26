import { z } from "zod";
import {
  registerWebhook,
  listWebhooks,
  listDeliveries,
  WEBHOOK_EVENTS,
} from "@/server/webhooks";

export const dynamic = "force-dynamic";

const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).optional(),
});

export async function GET() {
  const webhooks = listWebhooks("anonymous-learner");
  const deliveries = listDeliveries();
  return Response.json({
    success: true,
    data: {
      webhooks,
      deliveries,
    },
  });
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const body = CreateWebhookSchema.safeParse(raw);
    if (!body.success) {
      return Response.json({ success: false, error: "Invalid webhook URL or events" }, { status: 400 });
    }

    const endpoint = registerWebhook(
      "anonymous-learner",
      body.data.url,
      body.data.events || [...WEBHOOK_EVENTS],
    );

    return Response.json({
      success: true,
      data: endpoint,
    });
  } catch {
    return Response.json({ success: false, error: "Failed to register webhook" }, { status: 500 });
  }
}
