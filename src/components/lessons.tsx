"use client";

import { useState } from "react";
import rawCurriculum from "../../content/curriculum.json";
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  Play,
  Lightbulb,
  ArrowRight,
  Code2,
} from "lucide-react";

export function LessonsView() {
  const [activeLessonId, setActiveLessonId] = useState("lesson_1");
  const [completed, setCompleted] = useState<string[]>([]);
  const [exerciseSql, setExerciseSql] = useState("");
  const [runResult, setRunResult] = useState<{
    columns?: string[];
    rows?: (number | string | null)[][];
    error?: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const allLessons = rawCurriculum.modules.flatMap((m) => m.lessons);
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || allLessons[0];

  async function handleRunExercise() {
    const sqlToRun = exerciseSql.trim() || activeLesson.starterSql;
    setRunResult(null);
    try {
      const res = await fetch("/api/v1/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database: activeLesson.database, sql: sqlToRun }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRunResult({ error: data.error?.message || "Execution error" });
      } else {
        setRunResult({ columns: data.data.columns, rows: data.data.rows });
        if (!completed.includes(activeLesson.id)) {
          setCompleted((prev) => [...prev, activeLesson.id]);
        }
      }
    } catch {
      setRunResult({ error: "Could not execute query" });
    }
  }

  return (
    <div className="page grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Module and Lesson List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-bold text-base text-[var(--ink)]">SQL Learning Curriculum</h2>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">
            Progress through Beginner, Intermediate, and Advanced SQL concepts with interactive practice.
          </p>

          <div className="space-y-4">
            {rawCurriculum.modules.map((mod) => (
              <div key={mod.id} className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {mod.level}: {mod.title}
                </span>
                <div className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const isSelected = lesson.id === activeLessonId;
                    const isDone = completed.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setActiveLessonId(lesson.id);
                          setExerciseSql(lesson.starterSql);
                          setRunResult(null);
                          setShowHint(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs transition-colors border ${
                          isSelected
                            ? "bg-[var(--tint)] text-[var(--accent)] border-[var(--accent)] font-semibold"
                            : "border-transparent hover:bg-[var(--bg)] text-[var(--ink)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-[var(--muted)] shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-[var(--muted)] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Active Lesson View & Interactive Runner */}
      <div className="lg:col-span-8 space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-[var(--tint)] border border-[var(--line)] px-2.5 py-0.5 text-xs text-[var(--accent)] font-mono">
                Database: {activeLesson.database}
              </span>
              {completed.includes(activeLesson.id) && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[var(--ink)] mt-2">{activeLesson.title}</h1>
          </div>

          {/* Concept & Syntax */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-semibold text-[var(--muted)] tracking-wider">Concept</h3>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{activeLesson.concept}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs uppercase font-semibold text-[var(--muted)] tracking-wider">SQL Syntax</h3>
            <pre className="rounded-lg bg-[var(--bg)] p-3 text-xs font-mono text-[var(--accent)] border border-[var(--line)] overflow-x-auto">
              {activeLesson.syntax}
            </pre>
          </div>

          {/* Practical Example */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-semibold text-[var(--muted)] tracking-wider">Worked Example</h3>
            <pre className="rounded-lg bg-[var(--bg)] p-3 text-xs font-mono text-[var(--ink)] border border-[var(--line)] overflow-x-auto">
              {activeLesson.example}
            </pre>
            <p className="text-xs text-[var(--muted)] italic">Expected: {activeLesson.expectedOutput}</p>
          </div>

          {/* Interactive Exercise */}
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">Interactive Exercise</span>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showHint ? "Hide Hint" : "Need a Hint?"}
              </button>
            </div>

            <p className="text-xs text-[var(--muted)]">{activeLesson.exercisePrompt}</p>

            {showHint && activeLesson.hints && (
              <div className="rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                {activeLesson.hints.map((h, i) => (
                  <p key={i}>• {h}</p>
                ))}
              </div>
            )}

            <textarea
              value={exerciseSql || activeLesson.starterSql}
              onChange={(e) => setExerciseSql(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2.5 font-mono text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />

            <div className="flex justify-end">
              <button
                onClick={handleRunExercise}
                className="flex items-center gap-2 rounded-lg bg-[#09664f] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#07523f]"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Run Exercise
              </button>
            </div>

            {/* Exercise Results */}
            {runResult && (
              <div className="mt-3 border-t border-[var(--line)] pt-3">
                {runResult.error ? (
                  <div className="rounded bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 p-2 text-xs text-red-800 dark:text-red-300 font-mono">
                    {runResult.error}
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-2">
                      ✔ Exercise Executed Successfully!
                    </span>
                    <div className="overflow-x-auto max-h-40 rounded border border-[var(--line)] bg-[var(--surface)] p-2">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                            {runResult.columns?.map((c) => (
                              <th key={c} className="pr-3 pb-1">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)] text-[var(--ink)]">
                          {runResult.rows?.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              {row.map((cell, cidx) => (
                                <td key={cidx} className="pr-3 py-1">
                                  {String(cell ?? "NULL")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
