import { parentPort, workerData } from "node:worker_threads";
import { runSqliteTask } from "./engine.mjs";

const result = await runSqliteTask(workerData);
parentPort.postMessage(result);
