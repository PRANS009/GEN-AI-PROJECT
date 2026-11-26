import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// Save only the local API URL and public key. Never copy privileged credentials to Next.
const status = JSON.parse(
  execFileSync("npx", ["--no-install", "supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }),
);
const url = new URL(status.API_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Expected a local Supabase stack");
const key = status.PUBLISHABLE_KEY || status.ANON_KEY;
if (typeof key !== "string" || !key)
  throw new Error("Missing local publishable key");
writeFileSync(
  ".env.local",
  `NEXT_PUBLIC_SUPABASE_URL=${url.origin}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\nAPP_ORIGIN=http://localhost:3000\n`,
  { flag: "wx", mode: 0o600 },
);
console.log("Connected the app to local Supabase.");
