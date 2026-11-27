import { LessonsView } from "@/components/lessons";
import { account } from "@/server/auth";
import { getUserLearningState } from "@/server/user-state";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await account();
  const state = user ? await getUserLearningState(user.id, user.email ?? null) : null;
  return (
    <LessonsView
      initialLessonId={state?.last_lesson_id || "lesson_1"}
      initialCompleted={state?.completed_lessons || []}
      userEmail={user?.email || null}
    />
  );
}
