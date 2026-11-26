import curriculum from "../content/curriculum.ts";
import { evaluateChallenge } from "../../workers/preview.mjs";
import { dispatchWebhookEvent } from "./webhooks";

export interface ProgressState {
  completedLessons: string[];
  solvedChallenges: string[];
}

const userProgress = new Map<string, ProgressState>();

function getProgress(ownerId: string): ProgressState {
  if (!userProgress.has(ownerId)) {
    userProgress.set(ownerId, { completedLessons: [], solvedChallenges: [] });
  }
  return userProgress.get(ownerId)!;
}

export function listCurriculum(ownerId = "anonymous-learner") {
  const progress = getProgress(ownerId);
  return {
    modules: curriculum.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => ({
        ...l,
        completed: progress.completedLessons.includes(l.id),
      })),
    })),
    challenges: curriculum.challenges.map((c) => ({
      id: c.id,
      difficulty: c.difficulty,
      title: c.title,
      database: c.database,
      description: c.description,
      starterSql: c.starterSql,
      hints: c.hints,
      completed: progress.solvedChallenges.includes(c.id),
    })),
  };
}

export function markLessonComplete(lessonId: string, ownerId = "anonymous-learner"): boolean {
  const progress = getProgress(ownerId);
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    void dispatchWebhookEvent("lesson.completed", { lessonId, ownerId });
    return true;
  }
  return false;
}

export async function submitChallenge(
  challengeId: string,
  studentSql: string,
  ownerId = "anonymous-learner",
) {
  const challenge = curriculum.challenges.find((c) => c.id === challengeId);
  if (!challenge) {
    throw new Error(`Challenge ${challengeId} not found`);
  }

  const evaluation = await evaluateChallenge(
    challenge.database,
    studentSql,
    challenge.solutionSql,
  );

  if (evaluation.passed) {
    const progress = getProgress(ownerId);
    if (!progress.solvedChallenges.includes(challengeId)) {
      progress.solvedChallenges.push(challengeId);
      void dispatchWebhookEvent("challenge.completed", { challengeId, ownerId });
    }
  }

  return {
    challengeId,
    passed: evaluation.passed,
    feedback: evaluation.feedback,
    studentResult: evaluation.studentResult,
    expectedResult: evaluation.expectedResult,
  };
}

export function getStats(ownerId = "anonymous-learner") {
  const progress = getProgress(ownerId);
  const totalLessons = curriculum.modules.flatMap((m) => m.lessons).length;
  const totalChallenges = curriculum.challenges.length;

  return {
    completedLessons: progress.completedLessons.length,
    totalLessons,
    solvedChallenges: progress.solvedChallenges.length,
    totalChallenges,
    progressPercentage: Math.round(
      ((progress.completedLessons.length + progress.solvedChallenges.length) /
        (totalLessons + totalChallenges)) *
        100,
    ),
  };
}
