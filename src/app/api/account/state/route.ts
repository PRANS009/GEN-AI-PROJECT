import { z } from "zod";
import { account } from "@/server/auth";
import { getUserLearningState, saveUserLearningState } from "@/server/user-state";

export const dynamic = "force-dynamic";

const PatchStateSchema = z.object({
  last_route: z
    .enum(["/", "/learn", "/challenges", "/playground", "/workspace"])
    .optional(),
  last_lesson_id: z.string().min(1).max(80).optional(),
  last_challenge_id: z.string().min(1).max(80).optional(),
  last_database: z.string().min(1).max(80).optional(),
  playground_sql: z.string().max(5000).optional(),
  completed_lessons: z.array(z.string().min(1).max(80)).max(100).optional(),
  solved_challenges: z.array(z.string().min(1).max(80)).max(100).optional(),
});

export async function GET() {
  const user = await account();
  if (!user) {
    return Response.json({ success: true, authenticated: false, data: null });
  }
  const state = await getUserLearningState(user.id, user.email ?? null);
  return Response.json(
    { success: true, authenticated: true, data: state },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const user = await account();
  if (!user) {
    return Response.json({ success: true, authenticated: false, data: null });
  }
  try {
    const parsed = PatchStateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Invalid state payload" },
        { status: 400 },
      );
    }
    const updated = await saveUserLearningState(
      user.id,
      user.email ?? null,
      parsed.data,
    );
    return Response.json({ success: true, authenticated: true, data: updated });
  } catch {
    return Response.json(
      { success: false, error: "Failed to save state" },
      { status: 500 },
    );
  }
}
