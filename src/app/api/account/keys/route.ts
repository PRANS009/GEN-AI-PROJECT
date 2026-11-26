import { z } from "zod";
import { generateApiKey, listApiKeys, API_SCOPES } from "@/server/api-keys";
import { logActivity } from "@/server/activity";

export const dynamic = "force-dynamic";

const CreateKeySchema = z.object({
  name: z.string().min(1).max(50),
  scopes: z.array(z.enum(API_SCOPES)).optional(),
});

export async function GET() {
  const keys = listApiKeys("anonymous-learner");
  return Response.json({
    success: true,
    data: keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      scopes: k.scopes,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const body = CreateKeySchema.safeParse(raw);
    if (!body.success) {
      return Response.json({ success: false, error: "Invalid key name or scopes" }, { status: 400 });
    }

    const { rawKey, keyRecord } = generateApiKey(
      body.data.name,
      "anonymous-learner",
      body.data.scopes || [...API_SCOPES],
    );

    void logActivity({
      eventType: "api_keys.created",
      module: "api_keys",
      action: "create_key",
      status: "success",
      description: `Created API key "${keyRecord.name}"`,
      metadata: { keyId: keyRecord.id, prefix: keyRecord.prefix, scopeCount: keyRecord.scopes.length },
    });

    return Response.json({
      success: true,
      data: {
        rawKey,
        key: {
          id: keyRecord.id,
          name: keyRecord.name,
          prefix: keyRecord.prefix,
          scopes: keyRecord.scopes,
          createdAt: keyRecord.createdAt,
        },
      },
    });
  } catch {
    return Response.json({ success: false, error: "Failed to generate key" }, { status: 500 });
  }
}
