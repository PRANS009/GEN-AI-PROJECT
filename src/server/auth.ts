import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { databaseConfig } from "@/config/studio";

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
