import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Exercise actual HTML form actions, session cookies and the local Supabase API.
const origin = new URL(process.env.APP_ORIGIN || "http://localhost:3000")
  .origin;
const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
for (const url of [new URL(origin), supabase]) {
  assert.ok(
    ["localhost", "127.0.0.1"].includes(url.hostname),
    "Local smoke tests require loopback endpoints.",
  );
}
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const get = (path, cookie = "") =>
  fetch(origin + path, { headers: { cookie }, redirect: "manual" });
async function submit(page, fields, label, cookie = "") {
  const html = await (await get(page, cookie)).text();
  const form = Array.from(
    html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g),
    (m) => m[0],
  ).find((f) => f.includes(label));
  assert.ok(form, `Expected form for ${label}`);
  const name = form.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
  assert.ok(name, "Expected a server action");
  const data = new FormData();
  data.set(name, "");
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return fetch(origin + page, {
    method: "POST",
    body: data,
    headers: { origin, cookie },
    redirect: "manual",
  });
}
function cookiesFrom(response) {
  return response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}
assert.equal((await get("/api/health")).status, 200);
assert.equal(
  (
    await (
      await get("/api/preview?database=student_management&table=students")
    ).json()
  ).rows.length,
  4,
);
assert.equal(
  (await get("/api/preview?database=other&table=students")).status,
  400,
);
assert.match((await get("/account")).headers.get("location"), /\/login$/);
const ids = [];
for (let i = 0; i < 2; i++) {
  const email = `studio-qa-${randomUUID()}@example.test`;
  const password = randomUUID();
  const created = await submit(
    "/login?mode=register",
    { mode: "register", email, password },
    "Create account",
  );
  assert.match(created.headers.get("location") || "", /\/account$/);
  const cookie = cookiesFrom(created);
  assert.ok(cookie);
  assert.match(
    await (await get("/account", cookie)).text(),
    new RegExp(email.replaceAll(".", "\\.")),
  );
  const updated = await submit(
    "/account",
    { name: "QA Learner" },
    "Save changes",
    cookie,
  );
  assert.match(updated.headers.get("location") || "", /notice=saved$/);
  const out = await submit("/account", {}, "Sign out", cookie);
  assert.equal(out.status, 303);
  const loggedIn = await submit(
    "/login",
    { mode: "signin", email, password },
    "Sign in",
  );
  assert.match(loggedIn.headers.get("location") || "", /\/account$/);
  const client = createClient(supabase.href, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  assert.equal(error, null);
  const profiles = await client.from("profiles").select("id,display_name");
  assert.deepEqual(profiles.data, [
    { id: data.user.id, display_name: "QA Learner" },
  ]);
  ids.push(data.user.id);
  if (i === 1) {
    const other = await client
      .from("profiles")
      .update({ display_name: "Unavailable" })
      .eq("id", ids[0])
      .select();
    assert.deepEqual(other.data, []);
  }
}
assert.notEqual(...ids);
console.log(
  "Local HTTP smoke passed: readiness, preview, protected route, two signups, sign-in/out, profile edits and cross-account isolation.",
);
