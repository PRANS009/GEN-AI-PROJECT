import { NextResponse } from "next/server";
import { authClient } from "@/server/auth";
import { appOrigin } from "@/config/studio";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  const client = await authClient();
  if (code && client && !(await client.auth.exchangeCodeForSession(code)).error)
    return NextResponse.redirect(new URL("/account", appOrigin()));
  return NextResponse.redirect(new URL("/login?notice=callback", appOrigin()));
}
