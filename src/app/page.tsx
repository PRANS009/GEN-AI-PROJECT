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
        <h1 className="text-2xl font-bold tracking-tight">SQL Studio AI Dashboard</h1>
        <p className="text-neutral-400 text-sm">
          Intelligent AI Database Query Assistant and SQL Learning Platform.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Queries Executed</span>
            <Code2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100">
            {history.length}
          </div>
          <span className="text-[11px] text-neutral-500">
            {successfulQueries} success · {failedQueries} failed
          </span>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Lessons Completed</span>
            <GraduationCap className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100">
            {stats.completedLessons} <span className="text-sm font-normal text-neutral-500">/ {stats.totalLessons}</span>
          </div>
          <span className="text-[11px] text-sky-400">
            Beginner & Intermediate
          </span>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Challenges Solved</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100">
            {stats.solvedChallenges} <span className="text-sm font-normal text-neutral-500">/ {stats.totalChallenges}</span>
          </div>
          <span className="text-[11px] text-amber-400">
            Multiset Automated Grading
          </span>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Curriculum Progress</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100">
            {stats.progressPercentage}%
          </div>
          <span className="text-[11px] text-neutral-500">Overall Mastery</span>
        </div>
      </div>

      {/* Hero / Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/playground"
          className="group rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-5 hover:bg-emerald-950/40 transition-colors space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-emerald-900/60 p-2 text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              Launch &rarr;
            </span>
          </div>
          <h3 className="font-bold text-base text-neutral-100">SQL Playground & AI</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Generate SQL from natural language, execute in sandboxed SQLite, explain clauses, and fix errors.
          </p>
        </Link>

        <Link
          href="/learn"
          className="group rounded-lg border border-sky-900/60 bg-sky-950/20 p-5 hover:bg-sky-950/40 transition-colors space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-sky-900/60 p-2 text-sky-300">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-sky-400 group-hover:translate-x-1 transition-transform">
              Start &rarr;
            </span>
          </div>
          <h3 className="font-bold text-base text-neutral-100">Learn SQL Curriculum</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Follow structured lessons covering relational concepts, joins, aggregations, subqueries, and window functions.
          </p>
        </Link>

        <Link
          href="/challenges"
          className="group rounded-lg border border-amber-900/60 bg-amber-950/20 p-5 hover:bg-amber-950/40 transition-colors space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-amber-900/60 p-2 text-amber-300">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              Practice &rarr;
            </span>
          </div>
          <h3 className="font-bold text-base text-neutral-100">Practice Challenges</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Solve graded coding challenges with automated multiset verification, test cases, and progressive AI hints.
          </p>
        </Link>
      </div>

      {/* Sample Databases Section */}
      <section className="section">
        <div className="section-head">
          <h2 className="text-lg font-bold">Predefined Synthetic Datasets</h2>
          <span className="text-xs text-neutral-400">
            {datasets.length} datasets <i>·</i> {count} relational tables
          </span>
        </div>
        <Catalog />
      </section>

      {/* Developer API & Webhooks Section */}
      <section className="section">
        <div className="section-head">
          <h2 className="text-lg font-bold">Developer Platform & APIs</h2>
        </div>
        <div className="resources">
          <Link href="/api-keys">
            <div className="resource-icon">
              <KeyRound size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3>Developer API Keys</h3>
              <p>Generate cryptographically secure scoped bearer keys</p>
            </div>
          </Link>
          <Link href="/webhooks">
            <div className="resource-icon">
              <Code2 size={20} className="text-sky-400" />
            </div>
            <div>
              <h3>Webhook Subscriptions</h3>
              <p>HMAC-SHA256 signed event notifications</p>
            </div>
          </Link>
          <Link href="/docs">
            <div className="resource-icon">
              <BookOpen size={20} className="text-amber-400" />
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
