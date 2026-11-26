import Link from "next/link";
import {
  Code2,
  BookOpen,
  Sparkles,
  Trophy,
  GraduationCap,
  KeyRound,
  Flame,
} from "lucide-react";
import { Catalog } from "@/components/catalog";
import datasets from "../../content/datasets.json";
import { listHistory } from "@/server/history";
import { getStats } from "@/server/curriculum";

export const dynamic = "force-dynamic";

export default async function Home() {
  const count = datasets.reduce((total, d) => total + d.tables.length, 0);
  const history = listHistory(20);
  const stats = getStats();
  const successfulQueries = history.filter((h) => h.status === "success").length;
  const failedQueries = history.filter((h) => h.status === "error").length;

  return (
    <div className="page space-y-8">
      {/* Heading */}
      <div className="heading">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">SQL Studio AI Dashboard</h1>
        <p className="text-[var(--muted)] text-sm">
          Intelligent AI Database Query Assistant and SQL Learning Platform.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs">
            <span>Queries Executed</span>
            <Code2 className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
            {history.length}
          </div>
          <span className="text-[11px] text-[var(--muted)]">
            {successfulQueries} success · {failedQueries} failed
          </span>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs">
            <span>Lessons Completed</span>
            <GraduationCap className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
            {stats.completedLessons} <span className="text-sm font-normal text-[var(--muted)]">/ {stats.totalLessons}</span>
          </div>
          <span className="text-[11px] text-sky-600 dark:text-sky-400">
            Beginner & Intermediate
          </span>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs">
            <span>Challenges Solved</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
            {stats.solvedChallenges} <span className="text-sm font-normal text-[var(--muted)]">/ {stats.totalChallenges}</span>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">
            Multiset Automated Grading
          </span>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs">
            <span>Curriculum Progress</span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
            {stats.progressPercentage}%
          </div>
          <span className="text-[11px] text-[var(--muted)]">Overall Mastery</span>
        </div>
      </div>

      {/* Hero / Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/playground"
          className="group rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 hover:border-[var(--accent)] transition-colors space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-[var(--tint)] p-2 text-[var(--accent)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-[var(--accent)] group-hover:translate-x-1 transition-transform">
              Launch &rarr;
            </span>
          </div>
          <h3 className="font-bold text-base text-[var(--ink)]">SQL Playground & AI</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Generate SQL from natural language, execute in sandboxed SQLite, explain clauses, and fix errors.
          </p>
        </Link>

        <Link
          href="/learn"
          className="group rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 hover:border-[var(--accent)] transition-colors space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-sky-100 dark:bg-sky-950/60 p-2 text-sky-600 dark:text-sky-300">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
              Start &rarr;
            </span>
          </div>
          <h3 className="font-bold text-base text-[var(--ink)]">Learn SQL Curriculum</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Follow structured lessons covering relational concepts, joins, aggregations, subqueries, and window functions.
          </p>
        </Link>

        <Link
          href="/challenges"
          className="group rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 hover:border-[var(--accent)] transition-colors space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-amber-100 dark:bg-amber-950/60 p-2 text-amber-600 dark:text-amber-300">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              Practice &rarr;
            </span>
          </div>
          <h3 className="font-bold text-base text-[var(--ink)]">Practice Challenges</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Solve graded coding challenges with automated multiset verification, test cases, and progressive AI hints.
          </p>
        </Link>
      </div>

      {/* Sample Databases Section */}
      <section className="section">
        <div className="section-head">
          <h2 className="text-lg font-bold text-[var(--ink)]">Predefined Synthetic Datasets</h2>
          <span className="text-xs text-[var(--muted)]">
            {datasets.length} datasets <i>·</i> {count} relational tables
          </span>
        </div>
        <Catalog />
      </section>

      {/* Developer API & Webhooks Section */}
      <section className="section">
        <div className="section-head">
          <h2 className="text-lg font-bold text-[var(--ink)]">Developer Platform & APIs</h2>
        </div>
        <div className="resources">
          <Link href="/api-keys">
            <div className="resource-icon">
              <KeyRound size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <h3>Developer API Keys</h3>
              <p>Generate cryptographically secure scoped bearer keys</p>
            </div>
          </Link>
          <Link href="/webhooks">
            <div className="resource-icon">
              <Code2 size={20} className="text-sky-500" />
            </div>
            <div>
              <h3>Webhook Subscriptions</h3>
              <p>HMAC-SHA256 signed event notifications</p>
            </div>
          </Link>
          <Link href="/docs">
            <div className="resource-icon">
              <BookOpen size={20} className="text-amber-500" />
            </div>
            <div>
              <h3>API Documentation</h3>
              <p>Worked cURL, Python, and JavaScript integration examples</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
