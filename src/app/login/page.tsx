import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers3 } from "lucide-react";
import { credentials, githubLogin } from "@/app/auth/actions";
import { account } from "@/server/auth";
import { databaseConfig } from "@/config/studio";
import { Button } from "@/components/ui/button";

const notices: Record<string, string> = {
  input: "Enter a valid email and a password of the required length.",
  signin:
    "Sign-in failed. Check your email and password, or create an account if you are new to this deployment.",
  unconfirmed:
    "Your email is not confirmed yet. Check your inbox for the confirmation link.",
  signup:
    "Registration could not be completed. Check your details or try again later.",
  confirm: "Check your email to confirm your account.",
  callback: "That sign-in link is invalid or has expired.",
  unavailable:
    "Authentication is unavailable. Check the Supabase configuration.",
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; notice?: string }>;
}) {
  if (await account()) redirect("/account");
  const { mode, notice } = await searchParams;
  const create = mode === "register";
  const enabled = !!databaseConfig();
  return (
    <div className="form-card">
      <span className="brand-icon">
        <Layers3 size={20} />
      </span>
      <h1>{create ? "Create your account" : "Welcome back"}</h1>
      <p>
        {create
          ? "Set up your SQL learning workspace."
          : "Sign in to your SQL workspace."}
      </p>
      {(!enabled || notice) && (
        <div role="status" className="notice">
          {!enabled
            ? "Connect Supabase to enable accounts. You can explore the sample databases now."
            : notices[notice!] || "Review your details and try again."}
        </div>
      )}
      {enabled && (
        <form action={credentials}>
          <input
            type="hidden"
            name="mode"
            value={create ? "register" : "signin"}
          />
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={create ? "new-password" : "current-password"}
              minLength={create ? 10 : 1}
              maxLength={128}
              required
            />
          </label>
          {create && <small>Use at least 10 characters.</small>}
          <Button type="submit">{create ? "Create account" : "Sign in"}</Button>
        </form>
      )}
      {enabled && process.env.STUDIO_GITHUB_AUTH === "true" && (
        <form action={githubLogin}>
          <Button variant="outline">Continue with GitHub</Button>
        </form>
      )}
      <p className="form-link">
        {enabled && (
          <Link href={create ? "/login" : "/login?mode=register"}>
            {create
              ? "Already registered? Sign in"
              : "New here? Create an account"}
          </Link>
        )}
      </p>
      <Link href="/workspace">Browse sample databases</Link>
    </div>
  );
}
