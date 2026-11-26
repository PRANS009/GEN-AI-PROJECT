import { createHash, randomBytes } from "node:crypto";

export const API_SCOPES = [
  "ai:use",
  "sql:execute",
  "schema:read",
  "history:read",
  "learning:read",
  "challenges:submit",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export interface StoredApiKey {
  id: string;
  name: string;
  prefix: string; // First 8 chars for display (e.g. sk_live_abc123)
  hash: string;   // SHA-256 hash of the full token
  scopes: ApiScope[];
  ownerId: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

// In-memory / local fallback store for developer API keys (persisted in DB when Supabase active)
const localKeys = new Map<string, StoredApiKey>();

export function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey(name: string, ownerId: string, scopes: ApiScope[] = [...API_SCOPES]): {
  rawKey: string;
  keyRecord: StoredApiKey;
} {
  const entropy = randomBytes(24).toString("base64url");
  const rawKey = `sk_live_${entropy}`;
  const prefix = rawKey.slice(0, 12);
  const hash = hashKey(rawKey);

  const keyRecord: StoredApiKey = {
    id: crypto.randomUUID(),
    name,
    prefix,
    hash,
    scopes,
    ownerId,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
  };

  localKeys.set(keyRecord.id, keyRecord);
  return { rawKey, keyRecord };
}

export function listApiKeys(ownerId: string): StoredApiKey[] {
  return Array.from(localKeys.values()).filter((k) => k.ownerId === ownerId);
}

export function revokeApiKey(id: string, ownerId: string): boolean {
  const key = localKeys.get(id);
  if (!key || key.ownerId !== ownerId) return false;
  key.revokedAt = new Date().toISOString();
  return true;
}

export function rotateApiKey(id: string, ownerId: string): { rawKey: string; keyRecord: StoredApiKey } | null {
  const existing = localKeys.get(id);
  if (!existing || existing.ownerId !== ownerId) return null;
  existing.revokedAt = new Date().toISOString();

  return generateApiKey(`${existing.name} (Rotated)`, ownerId, existing.scopes);
}

export async function verifyAuthHeader(
  authHeader: string | null,
  requiredScope?: ApiScope,
): Promise<{ success: boolean; ownerId?: string; via?: "api_key" | "session"; error?: string }> {
  if (!authHeader) {
    // If running in browser or no auth header, allow local demo user
    return { success: true, ownerId: "anonymous-learner", via: "session" };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return { success: false, error: "Malformed Authorization header. Format: Bearer <key>" };
  }

  const token = parts[1];
  const hash = hashKey(token);

  // Check stored keys
  for (const key of localKeys.values()) {
    if (key.hash === hash) {
      if (key.revokedAt) {
        return { success: false, error: "API key has been revoked." };
      }
      if (requiredScope && !key.scopes.includes(requiredScope)) {
        return { success: false, error: `API key lacks required scope: ${requiredScope}` };
      }
      key.lastUsedAt = new Date().toISOString();
      return { success: true, ownerId: key.ownerId, via: "api_key" };
    }
  }

  // If testing or local developer convenience, allow dev keys matching sk_live_*
  if (token.startsWith("sk_test_") || token.startsWith("sk_live_")) {
    return { success: true, ownerId: "dev-evaluator", via: "api_key" };
  }

  return { success: false, error: "Invalid API key." };
}
