import { z } from "zod";

export const brand =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "SQL Studio AI";
const settings = z.object({
  url: z.url({ protocol: /^https?$/ }),
  key: z.string().min(12),
});
export function databaseConfig() {
  const config = settings.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return config.success ? config.data : null;
}
export function appOrigin() {
  const value =
    process.env.APP_ORIGIN ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return new URL(value).origin;
}
