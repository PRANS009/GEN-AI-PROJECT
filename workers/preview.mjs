import { Worker } from "node:worker_threads";
import { resolve } from "node:path";

function launchWorker(workerData, deadlineMs = 3000) {
  return new Promise((resolveResult, reject) => {
    const worker = new Worker(resolve(process.cwd(), "workers/sqlite.mjs"), {
      workerData,
      env: {},
      resourceLimits: { maxOldGenerationSizeMb: 48 },
    });
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error("Query execution timed out"));
    }, deadlineMs);
    worker.once("error", reject);
    worker.once("message", (msg) => {
      clearTimeout(timer);
      resolveResult(msg);
    });
    worker.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error("SQLite worker exited with error"));
      }
    });
  });
}

export function runPreview(dataset, table, deadlineMs = 3000) {
  return launchWorker({ mode: "preview", dataset, table }, deadlineMs);
}

export function executeSql(dataset, sql, deadlineMs = 4000) {
  return launchWorker({ mode: "execute", dataset, sql }, deadlineMs);
}

export function evaluateChallenge(dataset, studentSql, expectedSql, deadlineMs = 4000) {
  return launchWorker({ mode: "challenge", dataset, studentSql, expectedSql }, deadlineMs);
}
