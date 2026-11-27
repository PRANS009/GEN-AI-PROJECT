import { authClient, serviceClient } from "./auth.ts";

export interface UserLearningState {
  user_id: string;
  email: string | null;
  last_route: string;
  last_lesson_id: string;
  last_challenge_id: string;
  last_database: string;
  playground_sql: string;
  completed_lessons: string[];
  solved_challenges: string[];
  updated_at: string;
}

const DEFAULT_SQL = "SELECT * FROM students WHERE marks > 80 ORDER BY marks DESC;";
const memoryState = new Map<string, UserLearningState>();

function defaultState(userId: string, email: string | null = null): UserLearningState {
  return {
    user_id: userId,
    email,
    last_route: "/learn",
    last_lesson_id: "lesson_1",
    last_challenge_id: "chal_1",
    last_database: "student_management",
    playground_sql: DEFAULT_SQL,
    completed_lessons: [],
    solved_challenges: [],
    updated_at: new Date().toISOString(),
  };
}

export async function getUserLearningState(
  userId: string,
  email: string | null = null,
): Promise<UserLearningState> {
  const db = serviceClient() || (await authClient());
  if (db) {
    try {
      const { data, error } = await db
        .from("user_learning_state")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!error && data) {
        return {
          user_id: data.user_id,
          email: data.email ?? email,
          last_route: data.last_route || "/learn",
          last_lesson_id: data.last_lesson_id || "lesson_1",
          last_challenge_id: data.last_challenge_id || "chal_1",
          last_database: data.last_database || "student_management",
          playground_sql: data.playground_sql || DEFAULT_SQL,
          completed_lessons: Array.isArray(data.completed_lessons)
            ? data.completed_lessons
            : [],
          solved_challenges: Array.isArray(data.solved_challenges)
            ? data.solved_challenges
            : [],
          updated_at: data.updated_at || new Date().toISOString(),
        };
      }
    } catch {
      // Fall back to memory store if table not migrated yet
    }
  }
  return memoryState.get(userId) || defaultState(userId, email);
}

export async function saveUserLearningState(
  userId: string,
  email: string | null,
  patch: Partial<
    Pick<
      UserLearningState,
      | "last_route"
      | "last_lesson_id"
      | "last_challenge_id"
      | "last_database"
      | "playground_sql"
      | "completed_lessons"
      | "solved_challenges"
    >
  >,
): Promise<UserLearningState> {
  const current = await getUserLearningState(userId, email);
  const mergedLessons = patch.completed_lessons
    ? Array.from(new Set([...current.completed_lessons, ...patch.completed_lessons]))
    : current.completed_lessons;
  const mergedChallenges = patch.solved_challenges
    ? Array.from(new Set([...current.solved_challenges, ...patch.solved_challenges]))
    : current.solved_challenges;

  const next: UserLearningState = {
    ...current,
    ...patch,
    email: email ?? current.email,
    completed_lessons: mergedLessons,
    solved_challenges: mergedChallenges,
    updated_at: new Date().toISOString(),
  };

  memoryState.set(userId, next);

  const db = serviceClient() || (await authClient());
  if (db) {
    try {
      await db.from("user_learning_state").upsert(
        {
          user_id: userId,
          email: next.email,
          last_route: next.last_route,
          last_lesson_id: next.last_lesson_id,
          last_challenge_id: next.last_challenge_id,
          last_database: next.last_database,
          playground_sql: next.playground_sql,
          completed_lessons: next.completed_lessons,
          solved_challenges: next.solved_challenges,
          updated_at: next.updated_at,
        },
        { onConflict: "user_id" },
      );
    } catch {
      // Keep memory state if migration hasn't been applied yet
    }
  }

  return next;
}
