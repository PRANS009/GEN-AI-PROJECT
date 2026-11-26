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
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            <h2 className="font-bold text-base text-neutral-100">SQL Learning Curriculum</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Progress through Beginner, Intermediate, and Advanced SQL concepts with interactive practice.
          </p>

          <div className="space-y-4">
            {rawCurriculum.modules.map((mod) => (
              <div key={mod.id} className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
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
                        className={`w-full flex items-center justify-between text-left px-3 py-2 rounded text-xs transition-colors ${
                          isSelected
                            ? "bg-emerald-950/60 text-emerald-200 border border-emerald-800/80"
                            : "hover:bg-neutral-900 text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-neutral-600 shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-neutral-500 shrink-0" />
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
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-xs text-emerald-400 font-mono">
                Database: {activeLesson.database}
              </span>
              {completed.includes(activeLesson.id) && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-neutral-100 mt-2">{activeLesson.title}</h1>
          </div>

          {/* Concept & Syntax */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-semibold text-neutral-400 tracking-wider">Concept</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">{activeLesson.concept}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs uppercase font-semibold text-neutral-400 tracking-wider">SQL Syntax</h3>
            <pre className="rounded bg-neutral-900/80 p-3 text-xs font-mono text-emerald-400 border border-neutral-800">
              {activeLesson.syntax}
            </pre>
          </div>

          {/* Practical Example */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-semibold text-neutral-400 tracking-wider">Worked Example</h3>
            <pre className="rounded bg-neutral-900/80 p-3 text-xs font-mono text-neutral-200 border border-neutral-800">
              {activeLesson.example}
            </pre>
            <p className="text-xs text-neutral-400 italic">Expected: {activeLesson.expectedOutput}</p>
          </div>

          {/* Interactive Exercise */}
          <div className="rounded border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-neutral-200">Interactive Exercise</span>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showHint ? "Hide Hint" : "Need a Hint?"}
              </button>
            </div>

            <p className="text-xs text-neutral-300">{activeLesson.exercisePrompt}</p>

            {showHint && activeLesson.hints && (
              <div className="rounded border border-amber-900/40 bg-amber-950/20 p-2.5 text-xs text-amber-300 space-y-1">
                {activeLesson.hints.map((h, i) => (
                  <p key={i}>• {h}</p>
                ))}
              </div>
            )}

            <textarea
              value={exerciseSql || activeLesson.starterSql}
              onChange={(e) => setExerciseSql(e.target.value)}
              rows={3}
              className="w-full rounded border border-neutral-800 bg-neutral-950 p-2.5 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <div className="flex justify-end">
              <button
                onClick={handleRunExercise}
                className="flex items-center gap-2 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Run Exercise
              </button>
            </div>

            {/* Exercise Results */}
            {runResult && (
              <div className="mt-3 border-t border-neutral-800 pt-3">
                {runResult.error ? (
                  <div className="rounded bg-red-950/40 border border-red-900/60 p-2 text-xs text-red-300 font-mono">
                    {runResult.error}
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 block mb-2">
                      ✔ Exercise Executed Successfully!
                    </span>
                    <div className="overflow-x-auto max-h-40">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-neutral-800 text-neutral-400">
                            {runResult.columns?.map((c) => (
                              <th key={c} className="pr-3 pb-1">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-neutral-200">
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
