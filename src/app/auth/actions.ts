"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/server/auth";
import { appOrigin } from "@/config/studio";

export async function credentials(form: FormData) {
  const create = form.get("mode") === "register";
  const inputs = z
    .object({
      email: z.email().max(254),
      password: z
        .string()
        .min(create ? 10 : 1)
        .max(128),
    })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!inputs.success) redirect("/login?notice=input");
  const client = await authClient();
  if (!client) redirect("/login?notice=unavailable");
  if (create) {
    const { data, error } = await client.auth.signUp({
      ...inputs.data,
      options: { emailRedirectTo: appOrigin() + "/auth/callback" },
    });
    if (error) {
      if (error.name === "AuthRetryableFetchError" || error.status === 0)
        redirect("/login?notice=unavailable");
      redirect("/login?notice=signup");
    }
    if (!data.session) redirect("/login?notice=confirm");
  } else {
    const { error } = await client.auth.signInWithPassword(inputs.data);
    if (error) {
      if (error.name === "AuthRetryableFetchError" || error.status === 0)
        redirect("/login?notice=unavailable");
      if (error.message.toLowerCase().includes("email not confirmed"))
        redirect("/login?notice=unconfirmed");
      redirect("/login?notice=signin");
    }
  }
  redirect("/account");
}
export async function githubLogin() {
  const client = await authClient();
  if (!client || process.env.STUDIO_GITHUB_AUTH !== "true")
    redirect("/login?notice=unavailable");
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: appOrigin() + "/auth/callback" },
  });
  if (error || !data.url) redirect("/login?notice=signin");
  redirect(data.url);
}
export async function signOut() {
  const client = await authClient();
  if (client && (await client.auth.signOut({ scope: "local" })).error)
    redirect("/account?notice=signout");
  redirect("/");
}
export async function renameProfile(form: FormData) {
  const name = z.string().trim().min(1).max(60).safeParse(form.get("name"));
  if (!name.success) redirect("/account?notice=name");
  const client = await authClient();
  if (!client) redirect("/login");
  const { data } = await client.auth.getUser();
  if (!data.user) redirect("/login");
  const { error } = await client
    .from("profiles")
    .update({ display_name: name.data })
    .eq("id", data.user.id)
    .select("id")
    .single();
  redirect(error ? "/account?notice=save" : "/account?notice=saved");
}
