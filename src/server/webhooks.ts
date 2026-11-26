import { createHmac, randomBytes } from "node:crypto";

export const WEBHOOK_EVENTS = [
  "query.generated",
  "query.executed",
  "query.failed",
  "lesson.completed",
  "challenge.completed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookEndpoint {
  id: string;
  ownerId: string;
  url: string;
  secret: string; // Base64url secret
  events: WebhookEvent[];
  enabled: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: "success" | "failed" | "pending";
  statusCode: number | null;
  attempts: number;
  timestamp: string;
  error?: string;
}

const localWebhooks = new Map<string, WebhookEndpoint>();
const localDeliveries: WebhookDelivery[] = [];

export function signPayload(secret: string, timestamp: number, body: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${timestamp}.${body}`);
  return `v1=${hmac.digest("hex")}`;
}

export function registerWebhook(
  ownerId: string,
  url: string,
  events: WebhookEvent[] = [...WEBHOOK_EVENTS],
): WebhookEndpoint {
  const secret = randomBytes(32).toString("base64url");
  const endpoint: WebhookEndpoint = {
    id: crypto.randomUUID(),
    ownerId,
    url,
    secret,
    events,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  localWebhooks.set(endpoint.id, endpoint);
  return endpoint;
}

export function listWebhooks(ownerId: string): WebhookEndpoint[] {
  return Array.from(localWebhooks.values()).filter((w) => w.ownerId === ownerId);
}

export function listDeliveries(): WebhookDelivery[] {
  return [...localDeliveries].reverse().slice(0, 50);
}

export async function dispatchWebhookEvent(
  event: WebhookEvent,
  data: Record<string, unknown>,
  ownerId?: string,
): Promise<void> {
  const relevantWebhooks = Array.from(localWebhooks.values()).filter(
    (w) => w.enabled && w.events.includes(event) && (!ownerId || w.ownerId === ownerId),
  );

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    id: `evt_${crypto.randomUUID().slice(0, 8)}`,
    event,
    timestamp: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  for (const webhook of relevantWebhooks) {
    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      webhookId: webhook.id,
      event,
      payload,
      status: "pending",
      statusCode: null,
      attempts: 1,
      timestamp: new Date().toISOString(),
    };
    localDeliveries.push(delivery);

    // Send HTTP POST asynchronously
    try {
      const signature = signPayload(webhook.secret, timestamp, body);
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Studio-Signature": signature,
          "X-Studio-Timestamp": String(timestamp),
        },
        body,
        signal: AbortSignal.timeout(5000),
      });

      delivery.statusCode = res.status;
      delivery.status = res.ok ? "success" : "failed";
    } catch (err) {
      delivery.status = "failed";
      delivery.error = err instanceof Error ? err.message : "Network error";
    }
  }
}
