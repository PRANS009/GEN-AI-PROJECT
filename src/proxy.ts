import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { databaseConfig } from "@/config/studio";

export async function proxy(request: NextRequest) {
  const config = databaseConfig();
  let response = NextResponse.next({ request });
  if (
    !config ||
    !request.cookies.getAll().some((c) => c.name.startsWith("sb-"))
  )
    return response;
  const client = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        for (const item of items) request.cookies.set(item.name, item.value);
        response = NextResponse.next({ request });
        for (const item of items)
          response.cookies.set(item.name, item.value, item.options);
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  await client.auth.getClaims();
  return response;
}
export const config = { matcher: ["/", "/account", "/workspace", "/login"] };
