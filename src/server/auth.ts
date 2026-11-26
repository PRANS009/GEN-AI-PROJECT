import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { databaseConfig } from "../config/studio.ts";

export async function authClient() {
  const config = databaseConfig();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        // Next server components can read cookies. Route handlers and actions persist refreshes.
        for (const { name, value, options } of items) {
          try {
            jar.set(name, value, options);
          } catch (cause) {
            if (
              !(cause instanceof Error) ||
              !cause.message.includes("Cookies can only be modified")
            )
              throw cause;
          }
        }
      },
    },
    global: {
      fetch: (input, options) =>
        fetch(input, {
          ...options,
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        }),
    },
  });
}

/**
 * Server-only Supabase client using SUPABASE_SERVICE_ROLE_KEY when configured.
 * Used exclusively on the server for anonymous/admin activity logging and verified admin queries.
 */
export function serviceClient() {
  const config = databaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !serviceKey) return null;
  return createClient(config.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, options) =>
        fetch(input, {
          ...options,
          signal: AbortSignal.timeout(4000),
          cache: "no-store",
        }),
    },
  });
}

export async function account() {
  const client = await authClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (
    error &&
    ![
      "AuthSessionMissingError",
      "AuthApiError",
      "AuthRetryableFetchError",
    ].includes(error.name)
  )
    throw error;
  return data.user;
}

export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;

  const allowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (user.email && allowlist.includes(user.email.toLowerCase())) {
    return true;
  }

  try {
    const client = serviceClient() || (await authClient());
    if (!client) return false;
    const { data } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return data?.role === "admin";
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<
  | { authorized: true; user: User }
  | { authorized: false; status: 401 | 403; error: string }
> {
  const user = await account();
  if (!user) {
    return { authorized: false, status: 401, error: "Authentication required." };
  }
  const admin = await isAdminUser(user);
  if (!admin) {
    return { authorized: false, status: 403, error: "Administrator access required." };
  }
  return { authorized: true, user };
}
