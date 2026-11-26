"use client";

import { useState } from "react";
import datasets from "../../content/datasets.json";
import {
  Play,
  Sparkles,
  Download,
  Copy,
  Check,
  Wand2,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  Database,
} from "lucide-react";

interface QueryResult {
  columns: string[];
  rows: (number | string | null)[][];
  totalRows: number;
  affectedRows: number;
  durationMs: number;
}

export function SqlPlayground({ defaultDb = "student_management" }: { defaultDb?: string }) {
  const [dbId, setDbId] = useState(defaultDb);
  const [sql, setSql] = useState("SELECT * FROM students WHERE marks > 80 ORDER BY marks DESC;");
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<{
    explanation?: string;
    warnings?: string[];
    suggestions?: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "history" | "schema">("results");
  const [historyList, setHistoryList] = useState<
    Array<{ sql: string; time: string; status: "success" | "error"; rows: number }>
  >([]);

  const currentDataset = datasets.find((d) => d.id === dbId) || datasets[0];

  async function handleRun(customSql?: string) {
    const query = customSql || sql;
    if (!query.trim()) return;
    setIsRunning(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database: dbId, sql: query }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Execution failed");
      }
      setResult(data.data);
      setActiveTab("results");
      setHistoryList((prev) => [
        { sql: query, time: new Date().toLocaleTimeString(), status: "success", rows: data.data.totalRows },
        ...prev.slice(0, 20),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error running SQL";
      setError(msg);
      setResult(null);
      setHistoryList((prev) => [
        { sql: query, time: new Date().toLocaleTimeString(), status: "error", rows: 0 },
        ...prev.slice(0, 20),
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  async function handleAiGenerate() {
    if (!prompt.trim()) return;
    setIsAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, database: dbId }),
      });
      const data = await res.json();
      if (data.success) {
        setSql(data.data.sql);
        setAiMessage({
          explanation: data.data.explanation,
          warnings: data.data.warnings,
          suggestions: data.data.suggestions,
        });
      }
    } catch {
      setError("AI generation failed");
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleAiExplain() {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/v1/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, database: dbId }),
      });
      const data = await res.json();
      if (data.success) {
        setAiMessage({
          explanation: data.data.explanation,
          suggestions: data.data.suggestions,
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleAiFix() {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/v1/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, database: dbId, error: error || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSql(data.data.sql);
        setError(null);
        setAiMessage({
          explanation: data.data.explanation,
          warnings: data.data.warnings,
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleAiOptimize() {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/v1/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, database: dbId }),
      });
      const data = await res.json();
      if (data.success) {
        setAiMessage({
          explanation: data.data.explanation,
          suggestions: data.data.suggestions,
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportCsv() {
    if (!result) return;
    const header = result.columns.join(",");
    const rows = result.rows.map((r) => r.map((c) => `"${String(c ?? "")}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${dbId}_query_result.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportJson() {
    if (!result) return;
    const formatted = result.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      result.columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    const blob = new Blob([JSON.stringify(formatted, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${dbId}_query_result.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="page space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Interactive SQL Playground</h1>
          <p className="text-sm text-[var(--muted)]">
            Write, execute, optimize and debug SQL with isolated sandboxed SQLite execution.
          </p>
        </div>

        {/* Database selector */}
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[var(--accent)]" />
          <select
            value={dbId}
            onChange={(e) => setDbId(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Assistant natural language bar */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent)] mb-2">
          <Sparkles className="h-4 w-4" />
          <span>Natural Language to SQL Assistant</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
            placeholder="e.g. Find students scoring above 80 marks or Top 5 employees by salary..."
            className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            onClick={handleAiGenerate}
            disabled={isAiLoading || !prompt.trim()}
            className="flex items-center gap-2 rounded-lg bg-[#09664f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#07523f] disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {isAiLoading ? "Generating..." : "Generate SQL"}
          </button>
        </div>
      </div>

      {/* Main editor & action toolbar */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-xs text-[var(--ink)]">
          <div className="flex items-center gap-2 font-mono font-medium">
            <span>SQL Editor ({currentDataset.title})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAiExplain}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 rounded border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs hover:bg-[var(--tint)] text-[var(--ink)]"
              title="Explain query line by line"
            >
              <HelpCircle className="h-3.5 w-3.5 text-sky-500" />
              Explain
            </button>
            <button
              onClick={handleAiOptimize}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 rounded border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs hover:bg-[var(--tint)] text-[var(--ink)]"
              title="Suggest optimizations"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Optimize
            </button>
            {error && (
              <button
                onClick={handleAiFix}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 rounded border border-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-xs text-amber-800 dark:text-amber-200 hover:bg-amber-100"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Fix with AI
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs hover:bg-[var(--tint)] text-[var(--ink)]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => handleRun()}
              disabled={isRunning}
              className="flex items-center gap-1.5 rounded bg-[#09664f] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#07523f] disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isRunning ? "Running..." : "Run Query"}
            </button>
          </div>
        </div>

        {/* Code textarea */}
        <div className="relative font-mono text-sm bg-[var(--surface)] p-4">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full resize-y bg-transparent font-mono text-[var(--ink)] focus:outline-none leading-relaxed"
          />
        </div>
      </div>

      {/* AI explanation and suggestions banner if active */}
      {aiMessage && (
        <div className="rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-4 text-sm text-sky-950 dark:text-sky-200 space-y-2">
          {aiMessage.explanation && (
            <div>
              <span className="font-semibold text-sky-700 dark:text-sky-300">Explanation: </span>
              {aiMessage.explanation}
            </div>
          )}
          {aiMessage.warnings && aiMessage.warnings.length > 0 && (
            <div className="text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Warnings: {aiMessage.warnings.join(", ")}</span>
            </div>
          )}
          {aiMessage.suggestions && aiMessage.suggestions.length > 0 && (
            <div className="text-xs text-sky-800 dark:text-sky-300">
              <span className="font-medium">Suggestions: </span>
              {aiMessage.suggestions.join("; ")}
            </div>
          )}
        </div>
      )}

      {/* Output tabs and execution results */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-4 py-2">
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab("results")}
              className={`pb-1 border-b-2 ${
                activeTab === "results"
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Results {result && `(${result.totalRows} rows)`}
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`pb-1 border-b-2 ${
                activeTab === "schema"
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Schema Tree
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-1 border-b-2 ${
                activeTab === "history"
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Query History ({historyList.length})
            </button>
          </div>

          {result && (
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {result.durationMs}ms
              </span>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1 text-[var(--ink)] hover:text-[var(--accent)]"
                title="Download CSV"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                onClick={exportJson}
                className="flex items-center gap-1 text-[var(--ink)] hover:text-[var(--accent)]"
                title="Download JSON"
              >
                <Download className="h-3.5 w-3.5" /> JSON
              </button>
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {error && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-800 dark:text-red-300 flex items-start justify-between">
              <div>
                <p className="font-semibold">Execution Error</p>
                <p className="font-mono text-xs mt-1">{error}</p>
              </div>
              <button
                onClick={handleAiFix}
                className="rounded bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-500"
              >
                Fix with AI
              </button>
            </div>
          )}

          {activeTab === "results" && result && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                    {result.columns.map((col) => (
                      <th key={col} className="pb-2 pr-4 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--ink)]">
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[var(--bg)]">
                      {row.map((val, cIdx) => (
                        <td key={cIdx} className="py-1.5 pr-4">
                          {val === null ? <span className="text-[var(--muted)] italic">NULL</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "results" && !result && !error && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">
              No query executed yet. Enter SQL or generate one with AI, then click Run Query.
            </div>
          )}

          {activeTab === "schema" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDataset.tables.map((tbl) => (
                <div key={tbl.name} className="rounded-lg border border-[var(--line)] p-3 bg-[var(--bg)]">
                  <h4 className="font-semibold text-sm text-[var(--accent)] font-mono mb-1">{tbl.name}</h4>
                  <p className="text-xs text-[var(--muted)] font-mono mb-2">{tbl.definition}</p>
                  <button
                    onClick={() => {
                      setSql(`SELECT * FROM "${tbl.name}" LIMIT 20;`);
                      void handleRun(`SELECT * FROM "${tbl.name}" LIMIT 20;`);
                    }}
                    className="text-xs text-[var(--accent)] hover:underline font-medium"
                  >
                    Quick Query &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2">
              {historyList.length === 0 ? (
                <p className="text-sm text-[var(--muted)] py-4 text-center">No history recorded in this session.</p>
              ) : (
                historyList.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[var(--line)] p-2 text-xs font-mono bg-[var(--bg)]"
                  >
                    <span className="truncate max-w-md text-[var(--ink)]">{h.sql}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--muted)]">{h.time}</span>
                      <span className={h.status === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                        {h.status === "success" ? `${h.rows} rows` : "error"}
                      </span>
                      <button
                        onClick={() => {
                          setSql(h.sql);
                          void handleRun(h.sql);
                        }}
                        className="text-[var(--accent)] hover:underline font-medium"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
