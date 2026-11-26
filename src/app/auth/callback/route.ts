import { NextResponse } from "next/server";
import { authClient } from "@/server/auth";
import { appOrigin } from "@/config/studio";
import { logActivity } from "@/server/activity";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  const client = await authClient();
  if (code && client) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      await logActivity({
        userId: data.user?.id ?? null,
        eventType: "auth.login",
        module: "auth",
        action: "oauth_callback",
        status: "success",
        description: "User signed in via OAuth callback",
        updateLoginAt: true,
      });
      return NextResponse.redirect(new URL("/account", appOrigin()));
    }
  }
  await logActivity({
    userId: null,
    eventType: "auth.login",
    module: "auth",
    action: "oauth_callback",
    status: "failure",
    description: "OAuth callback sign-in failed",
  });
  return NextResponse.redirect(new URL("/login?notice=callback", appOrigin()));
}
