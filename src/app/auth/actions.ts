"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authClient, account, serviceClient } from "@/server/auth";
import { appOrigin } from "@/config/studio";
import { logActivity } from "@/server/activity";
import { getUserLearningState } from "@/server/user-state";

export async function credentials(form: FormData) {
  const create = form.get("mode") === "register";

  if (create) {
    const rawUsername = String(form.get("username") || "").trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(rawUsername)) {
      redirect("/login?mode=register&notice=username");
    }

    const inputs = z
      .object({
        fullName: z.string().trim().min(2).max(60),
        username: z.string().regex(/^[a-zA-Z0-9_]{3,30}$/),
        email: z.email().max(254),
        skillLevel: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
        password: z.string().min(10).max(128),
        confirmPassword: z.string().min(10).max(128),
      })
      .safeParse({
        fullName: form.get("fullName"),
        username: rawUsername,
        email: form.get("email"),
        skillLevel: form.get("skillLevel") || "Beginner",
        password: form.get("password"),
        confirmPassword: form.get("confirmPassword"),
      });

    if (!inputs.success) redirect("/login?mode=register&notice=input");
    if (inputs.data.password !== inputs.data.confirmPassword) {
      redirect("/login?mode=register&notice=mismatch");
    }

    const client = await authClient();
    if (!client) redirect("/login?mode=register&notice=unavailable");

    const { data, error } = await client.auth.signUp({
      email: inputs.data.email,
      password: inputs.data.password,
      options: {
        emailRedirectTo: appOrigin() + "/auth/callback",
        data: {
          full_name: inputs.data.fullName,
          username: inputs.data.username,
          skill_level: inputs.data.skillLevel,
        },
      },
    });

    if (error) {
      await logActivity({
        userId: null,
        eventType: "auth.register",
        module: "auth",
        action: "register",
        status: "failure",
        description: "User registration failed",
        metadata: { reason: error.name },
      });
      if (error.name === "AuthRetryableFetchError" || error.status === 0)
        redirect("/login?mode=register&notice=unavailable");
      redirect("/login?mode=register&notice=signup");
    }

    if (data.user?.id) {
      const adminDb = serviceClient();
      const db = adminDb || (data.session ? client : null);
      if (db) {
        await db
          .from("profiles")
          .update({
            display_name: inputs.data.fullName,
            username: inputs.data.username,
            skill_level: inputs.data.skillLevel,
          })
          .eq("id", data.user.id);
      }
    }

    await logActivity({
      userId: data.user?.id ?? null,
      eventType: "auth.register",
      module: "auth",
      action: "register",
      status: "success",
      description: "New user registered",
      metadata: {
        hasSession: Boolean(data.session),
        skillLevel: inputs.data.skillLevel,
      },
      updateLoginAt: Boolean(data.session),
    });

    if (!data.session) redirect("/login?notice=confirm");
    redirect("/account");
  }

  const inputs = z
    .object({
      email: z.email().max(254),
      password: z.string().min(1).max(128),
    })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!inputs.success) redirect("/login?notice=input");
  const client = await authClient();
  if (!client) redirect("/login?notice=unavailable");

  const { data, error } = await client.auth.signInWithPassword(inputs.data);
  if (error) {
    await logActivity({
      userId: null,
      eventType: "auth.login",
      module: "auth",
      action: "login",
      status: "failure",
      description: "Failed login attempt",
      metadata: { reason: error.name },
    });
    if (error.name === "AuthRetryableFetchError" || error.status === 0)
      redirect("/login?notice=unavailable");
    if (error.message.toLowerCase().includes("email not confirmed"))
      redirect("/login?notice=unconfirmed");
    redirect("/login?notice=signin");
  }

  await logActivity({
    userId: data.user?.id ?? null,
    eventType: "auth.login",
    module: "auth",
    action: "login",
    status: "success",
    description: "User signed in with password",
    updateLoginAt: true,
  });

  if (data.user?.id) {
    const saved = await getUserLearningState(data.user.id, data.user.email ?? null);
    if (saved.last_route && saved.last_route !== "/") {
      redirect(saved.last_route);
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
  const user = await account();
  const client = await authClient();
  if (client && (await client.auth.signOut({ scope: "local" })).error) {
    await logActivity({
      userId: user?.id ?? null,
      eventType: "auth.logout",
      module: "auth",
      action: "logout",
      status: "failure",
      description: "User logout failed",
    });
    redirect("/account?notice=signout");
  }
  await logActivity({
    userId: user?.id ?? null,
    eventType: "auth.logout",
    module: "auth",
    action: "logout",
    status: "success",
    description: "User signed out",
  });
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
