"use client";

import { useState } from "react";
import { Database, ChevronDown, ChevronRight, Table2 } from "lucide-react";
import datasets from "../../content/datasets.json";

export function SchemaTablesPreview({ databaseId }: { databaseId: string }) {
  const [open, setOpen] = useState(true);
  const dataset = datasets.find((d) => d.id === databaseId) || datasets[0];

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--tint)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-[var(--accent)]" />
          Practice Database Tables: <span className="font-mono text-[var(--accent)]">{dataset.title}</span>
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-[var(--muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--muted)]" />}
      </button>

      {open && (
        <div className="p-3.5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-[var(--line)]">
          {dataset.tables.map((tbl) => {
            const cols = tbl.definition
              .split(",")
              .map((part) => part.trim())
              .filter((part) => !part.toUpperCase().startsWith("PRIMARY KEY"))
              .map((part) => part.split(/\s+/)[0]);

            return (
              <div
                key={tbl.name}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--accent)]">
                    <Table2 className="h-3.5 w-3.5" />
                    {tbl.name}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {tbl.rows.length} rows
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[var(--muted)] leading-snug">
                  {tbl.definition}
                </p>
                <div className="overflow-x-auto max-h-28 rounded border border-[var(--line)] bg-[var(--bg)] p-1.5">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                        {cols.map((c) => (
                          <th key={c} className="pr-2 pb-1 font-semibold">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] text-[var(--ink)]">
                      {tbl.rows.slice(0, 4).map((r, i) => (
                        <tr key={i}>
                          {r.map((cell, ci) => (
                            <td key={ci} className="pr-2 py-0.5 whitespace-nowrap">
                              {cell === null ? "NULL" : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
