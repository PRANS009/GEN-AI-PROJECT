import { z } from "zod";
import { markLessonComplete } from "@/server/curriculum";
import { logActivity } from "@/server/activity";
import { account } from "@/server/auth";

export const dynamic = "force-dynamic";

const CompleteLessonSchema = z.object({
  lessonId: z.string().min(1).max(80),
  database: z.string().optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = CompleteLessonSchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid lessonId" } },
        { status: 400 },
      );
    }
    const user = await account();
    const newlyCompleted = markLessonComplete(
      body.data.lessonId,
      user?.id || "anonymous-learner",
    );

    await logActivity({
      userId: user?.id ?? null,
      eventType: "lesson.completed",
      module: "learning",
      action: "complete_lesson",
      status: "success",
      description: `Completed lesson ${body.data.lessonId}`,
      metadata: {
        lessonId: body.data.lessonId,
        database: body.data.database || null,
        newlyCompleted,
      },
    });

    return Response.json({ success: true, requestId, data: { lessonId: body.data.lessonId } });
  } catch {
    return Response.json(
      { success: false, requestId, error: { code: "INTERNAL_ERROR", message: "Failed to record lesson completion" } },
      { status: 500 },
    );
  }
}
