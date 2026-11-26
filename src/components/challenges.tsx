"use client";

import { useState } from "react";
import rawCurriculum from "../../content/curriculum.json";
import {
  Trophy,
  CheckCircle2,
  Circle,
  Play,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

export function ChallengesView() {
  const challenges = rawCurriculum.challenges;
  const [activeChallengeId, setActiveChallengeId] = useState(challenges[0].id);
  const [sql, setSql] = useState(challenges[0].starterSql);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    passed: boolean;
    feedback: string;
    studentResult?: { columns: string[]; rows: (number | string | null)[][]; count: number };
    expectedResult?: { columns: string[]; rows: (number | string | null)[][]; count: number };
  } | null>(null);
  const [solvedList, setSolvedList] = useState<string[]>([]);

  const activeChallenge =
    challenges.find((c) => c.id === activeChallengeId) || challenges[0];

  async function handleSubmit() {
    if (!sql.trim()) return;
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await fetch("/api/v1/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: activeChallenge.id, sql }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmissionResult({
          passed: false,
          feedback: data.error?.message || "Failed to evaluate challenge",
        });
      } else {
        setSubmissionResult(data.data);
        if (data.data.passed && !solvedList.includes(activeChallenge.id)) {
          setSolvedList((prev) => [...prev, activeChallenge.id]);
        }
      }
    } catch {
      setSubmissionResult({
        passed: false,
        feedback: "Network error submitting solution.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Challenges sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="font-bold text-base text-neutral-100">Practice Challenges</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Test your real-world SQL skills against automated grading test fixtures.
          </p>

          <div className="space-y-2">
            {challenges.map((c) => {
              const isSelected = c.id === activeChallengeId;
              const isSolved = solvedList.includes(c.id);
              const badgeColor =
                c.difficulty === "Beginner"
                  ? "text-emerald-400 bg-emerald-950/60"
                  : c.difficulty === "Intermediate"
                  ? "text-sky-400 bg-sky-950/60"
                  : "text-amber-400 bg-amber-950/60";

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChallengeId(c.id);
                    setSql(c.starterSql);
                    setSubmissionResult(null);
                    setShowHint(false);
                  }}
                  className={`w-full flex items-center justify-between text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-950/30 text-neutral-100"
                      : "border-neutral-850 hover:bg-neutral-900/60 text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isSolved ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-neutral-600 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="text-xs font-medium truncate">{c.title}</p>
                      <span className="text-[10px] text-neutral-500 font-mono">{c.database}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${badgeColor}`}>
                    {c.difficulty}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main challenge workspace */}
      <div className="lg:col-span-8 space-y-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="rounded bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs font-mono text-emerald-400">
                Database: {activeChallenge.database}
              </span>
              <h1 className="text-xl font-bold text-neutral-100 mt-2">{activeChallenge.title}</h1>
            </div>
            {solvedList.includes(activeChallenge.id) && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
                <CheckCircle2 className="h-4 w-4" /> Solved
              </span>
            )}
          </div>

          <div className="rounded border border-neutral-800 bg-neutral-900/40 p-4">
            <h3 className="text-xs uppercase font-semibold text-neutral-400 tracking-wider mb-1">
              Problem Statement
            </h3>
            <p className="text-sm text-neutral-200 leading-relaxed">{activeChallenge.description}</p>
          </div>

          {/* Hint toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Write your solution query below:</span>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {showHint ? "Hide Hints" : "AI Hints"}
            </button>
          </div>

          {showHint && activeChallenge.hints && (
            <div className="rounded border border-amber-900/60 bg-amber-950/30 p-3 text-xs text-amber-300 space-y-1">
              <span className="font-semibold block mb-1">Hints:</span>
              {activeChallenge.hints.map((h, i) => (
                <p key={i}>• {h}</p>
              ))}
            </div>
          )}

          {/* Code editor */}
          <div className="rounded border border-neutral-800 bg-neutral-900/80 p-3">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={5}
              spellCheck={false}
              className="w-full bg-transparent font-mono text-xs text-emerald-400 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !sql.trim()}
              className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isSubmitting ? "Grading..." : "Submit Solution"}
            </button>
          </div>

          {/* Grading Evaluation Result */}
          {submissionResult && (
            <div
              className={`rounded-lg border p-4 text-xs space-y-3 ${
                submissionResult.passed
                  ? "border-emerald-800/80 bg-emerald-950/40 text-emerald-200"
                  : "border-red-800/80 bg-red-950/40 text-red-200"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                {submissionResult.passed ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Passed! Congratulations!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <span>Test Cases Failed</span>
                  </>
                )}
              </div>

              <p>{submissionResult.feedback}</p>

              {/* Compare tables */}
              {submissionResult.studentResult && submissionResult.expectedResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-neutral-300 block mb-1">
                      Your Query Output ({submissionResult.studentResult.count} rows)
                    </span>
                    <div className="overflow-x-auto max-h-36 rounded bg-neutral-900 p-2 font-mono text-[10px]">
                      <div className="font-bold border-b border-neutral-700 pb-1 mb-1">
                        {submissionResult.studentResult.columns.join(" | ")}
                      </div>
                      {submissionResult.studentResult.rows.map((r, i) => (
                        <div key={i}>{r.join(" | ")}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] font-semibold text-neutral-300 block mb-1">
                      Expected Output ({submissionResult.expectedResult.count} rows)
                    </span>
                    <div className="overflow-x-auto max-h-36 rounded bg-neutral-900 p-2 font-mono text-[10px]">
                      <div className="font-bold border-b border-neutral-700 pb-1 mb-1">
                        {submissionResult.expectedResult.columns.join(" | ")}
                      </div>
                      {submissionResult.expectedResult.rows.map((r, i) => (
                        <div key={i}>{r.join(" | ")}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
