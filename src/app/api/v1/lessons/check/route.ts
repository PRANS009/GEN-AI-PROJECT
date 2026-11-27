import { z } from "zod";
import curriculum from "@/content/curriculum";
import { evaluateChallenge } from "../../../../../../workers/preview.mjs";
import { markLessonComplete } from "@/server/curriculum";
import { account } from "@/server/auth";
import { saveUserLearningState } from "@/server/user-state";
import { logActivity } from "@/server/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CheckLessonSchema = z.object({
  lessonId: z.string().min(1).max(80),
  sql: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  try {
    const body = CheckLessonSchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        { success: false, requestId, error: { code: "BAD_REQUEST", message: "Invalid lesson or SQL" } },
        { status: 400 },
      );
    }

    const allLessons = curriculum.modules.flatMap((m) => m.lessons);
    const lesson = allLessons.find((l) => l.id === body.data.lessonId);
    if (!lesson) {
      return Response.json(
        { success: false, requestId, error: { code: "NOT_FOUND", message: "Lesson not found" } },
        { status: 404 },
      );
    }

    const evaluation = await evaluateChallenge(
      lesson.database,
      body.data.sql,
      lesson.solutionSql,
    );

    const user = await account();
    if (evaluation.passed) {
      markLessonComplete(lesson.id, user?.id || "anonymous-learner");
      if (user) {
        await saveUserLearningState(user.id, user.email ?? null, {
          last_route: "/learn",
          last_lesson_id: lesson.id,
          completed_lessons: [lesson.id],
        });
      }
    }

    void logActivity({
      userId: user?.id ?? null,
      eventType: evaluation.passed ? "lesson.completed" : "lesson.attempted",
      module: "learning",
      action: evaluation.passed ? "complete_lesson" : "attempt_lesson",
      status: evaluation.passed ? "success" : "failure",
      description: evaluation.passed
        ? `Completed lesson ${lesson.id}`
        : `Attempted lesson ${lesson.id}`,
      durationMs: Math.round(performance.now() - startedAt),
      metadata: { lessonId: lesson.id, database: lesson.database, passed: evaluation.passed },
    });

    return Response.json({ success: true, requestId, data: evaluation });
  } catch (err) {
    return Response.json(
      {
        success: false,
        requestId,
        error: {
          code: "EXECUTION_ERROR",
          message: err instanceof Error ? err.message : "Could not execute lesson query",
        },
      },
      { status: 400 },
    );
  }
}
