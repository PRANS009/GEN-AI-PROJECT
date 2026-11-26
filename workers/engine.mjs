import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import catalog from "../content/datasets.json" with { type: "json" };

function seedDatabase(targetDb, dataset) {
  targetDb.exec("PRAGMA foreign_keys=ON;");
  for (const seed of dataset.tables) {
    targetDb.exec(`CREATE TABLE "${seed.name}" (${seed.definition});`);
    for (const row of seed.rows) {
      targetDb.exec({
        sql: `INSERT INTO "${seed.name}" VALUES (${row.map(() => "?").join(",")});`,
        bind: row,
      });
    }
  }
}

export async function runSqliteTask(workerData) {
  const memory = new WebAssembly.Memory({ initial: 128, maximum: 1024 });
  const sqlite = await sqlite3InitModule({ wasmMemory: memory });
  if (sqlite.wasm.memory !== memory)
    throw new Error("SQLite did not attach the bounded memory");
  const db = new sqlite.oo1.DB(":memory:");

  try {
    const dataset = catalog.find((item) => item.id === workerData.dataset);
    if (!dataset) throw new Error("Unknown sample table");

    seedDatabase(db, dataset);

    const mode = workerData.mode || (workerData.table ? "preview" : "execute");

    if (mode === "preview") {
      const table = dataset.tables.find((item) => item.name === workerData.table);
      if (!table) throw new Error("Unknown sample table");
      const sql = `SELECT * FROM "${table.name}" LIMIT 20;`;
      const columns = db.selectObjects(`PRAGMA table_info("${table.name}")`);
      const foreignKeys = db.selectObjects(
        `PRAGMA foreign_key_list("${table.name}")`,
      );
      const start = performance.now();
      const rows = db.selectArrays(sql);
      return {
        sql,
        columns: columns.map((c) => ({ name: c.name, type: c.type, pk: c.pk > 0 })),
        foreignKeys: foreignKeys.map((f) => ({
          column: f.from,
          table: f.table,
          target: f.to,
        })),
        rows,
        durationMs: Math.max(
          0.01,
          Math.round((performance.now() - start) * 100) / 100,
        ),
      };
    }

    if (mode === "execute") {
      const sql = workerData.sql?.trim() || "";
      if (!sql) throw new Error("No SQL query provided");
      const start = performance.now();
      const columns = [];
      const rows = [];
      db.exec({
        sql,
        rowMode: "array",
        columnNames: columns,
        resultRows: rows,
      });
      const durationMs = Math.max(
        0.01,
        Math.round((performance.now() - start) * 100) / 100,
      );
      const changes = db.changes();
      return {
        success: true,
        columns,
        rows: rows.slice(0, 100),
        totalRows: rows.length,
        affectedRows: changes,
        durationMs,
      };
    }

    if (mode === "challenge") {
      const studentSql = workerData.studentSql?.trim() || "";
      const expectedSql = workerData.expectedSql?.trim() || "";
      if (!studentSql) throw new Error("No SQL submitted");

      const studentCols = [];
      const studentRows = [];
      db.exec({
        sql: studentSql,
        rowMode: "array",
        columnNames: studentCols,
        resultRows: studentRows,
      });

      const dbExpected = new sqlite.oo1.DB(":memory:");
      try {
        seedDatabase(dbExpected, dataset);
        const expectedCols = [];
        const expectedRows = [];
        dbExpected.exec({
          sql: expectedSql,
          rowMode: "array",
          columnNames: expectedCols,
          resultRows: expectedRows,
        });

        const hasOrderBy = expectedSql.toUpperCase().includes("ORDER BY");
        let passed = false;
        let feedback = "";

        if (studentCols.length !== expectedCols.length) {
          feedback = `Expected ${expectedCols.length} columns (${expectedCols.join(", ")}), but got ${studentCols.length} columns (${studentCols.join(", ")}).`;
        } else if (studentRows.length !== expectedRows.length) {
          feedback = `Expected ${expectedRows.length} rows, but got ${studentRows.length} rows.`;
        } else if (hasOrderBy) {
          const matches = studentRows.every(
            (row, i) => JSON.stringify(row) === JSON.stringify(expectedRows[i]),
          );
          passed = matches;
          feedback = matches
            ? "All test cases passed! Rows and ordering match the solution."
            : "Row values or sort ordering did not match expected solution.";
        } else {
          const sortedStudent = [...studentRows].map((r) => JSON.stringify(r)).sort();
          const sortedExpected = [...expectedRows].map((r) => JSON.stringify(r)).sort();
          const matches = sortedStudent.every((s, i) => s === sortedExpected[i]);
          passed = matches;
          feedback = matches
            ? "All test cases passed! Result records match the expected multiset."
            : "Values returned did not match expected solution records.";
        }

        return {
          passed,
          feedback,
          studentResult: {
            columns: studentCols,
            rows: studentRows.slice(0, 10),
            count: studentRows.length,
          },
          expectedResult: {
            columns: expectedCols,
            rows: expectedRows.slice(0, 10),
            count: expectedRows.length,
          },
        };
      } finally {
        dbExpected.close();
      }
    }

    throw new Error("Unsupported execution mode");
  } finally {
    db.close();
  }
}
