"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Table2, KeyRound, RotateCw } from "lucide-react";
import type { SampleResult } from "../../workers/preview.mjs";
import datasets from "../../content/datasets.json";

export function Explorer({ id }: { id: string }) {
  const db = datasets.find((d) => d.id === id) || datasets[0];
  const [table, setTable] = useState(db.tables[0].name);
  const [attempt, setAttempt] = useState(0);
  const [sample, setSample] = useState<SampleResult | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("rows");
  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api/preview?database=${db.id}&table=${table}`, {
      signal: abort.signal,
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then((result) => {
        if (!abort.signal.aborted) setSample(result);
      })
      .catch((cause) => {
        if (!abort.signal.aborted)
          setError(cause.message || "Could not load sample");
      });
    return () => abort.abort();
  }, [db.id, table, attempt]);
  function select(name: string) {
    if (name === table) return;
    setSample(null);
    setError("");
    setTable(name);
  }
  return (
    <div className="page">
      <div className="heading">
        <h1>Database explorer</h1>
        <p>Inspect a practice schema and its synthetic records.</p>
      </div>
      <div className="database-switch">
        {datasets.map((d) => (
          <Link
            key={d.id}
            href={`/workspace?database=${d.id}`}
            aria-current={d.id === db.id ? "page" : undefined}
          >
            <Database size={15} />
            {d.title}
          </Link>
        ))}
      </div>
      <div className="explorer">
        <div className="explorer-list">
          <h2>Tables</h2>
          {db.tables.map((t) => (
            <button
              key={t.name}
              aria-pressed={t.name === table}
              onClick={() => select(t.name)}
            >
              <Table2 size={16} />
              {t.name}
            </button>
          ))}
        </div>
        <section className="data-panel">
          <div className="section-head">
            <h2>{table}</h2>
            <span>SQLite</span>
          </div>
          <div className="view-tabs">
            {["rows", "schema"].map((v) => (
              <button
                key={v}
                aria-pressed={v === view}
                onClick={() => setView(v)}
              >
                {v === "rows" ? "Sample records" : "Schema"}
              </button>
            ))}
          </div>
          {error ? (
            <div role="alert">
              {error}{" "}
              <button
                className="button outline"
                onClick={() => {
                  setError("");
                  setAttempt((n) => n + 1);
                }}
              >
                <RotateCw size={14} />
                Retry
              </button>
            </div>
          ) : !sample ? (
            <div role="status" className="loading">
              Loading table…
            </div>
          ) : view === "rows" ? (
            <>
              <pre>{sample.sql}</pre>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {sample.columns.map((c) => (
                        <th key={c.name}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sample.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((c, j) => (
                          <td key={j}>{c === null ? <em>NULL</em> : c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="meta">
                {sample.rows.length} rows <i>·</i> {sample.durationMs} ms at
                execution
              </p>
            </>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Constraint</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.columns.map((c) => (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td>{c.type}</td>
                      <td>
                        {c.pk && (
                          <span>
                            <KeyRound size={12} /> Primary key{" "}
                          </span>
                        )}
                        {sample.foreignKeys
                          .filter((k) => k.column === c.name)
                          .map((k) => (
                            <span key={k.table + k.target}>
                              References {k.table}.{k.target}
                            </span>
                          ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
