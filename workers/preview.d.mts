export interface SampleResult {
  sql: string;
  columns: { name: string; type: string; pk: boolean }[];
  foreignKeys: { column: string; table: string; target: string }[];
  rows: (number | string | null)[][];
  durationMs: number;
}

export interface ExecuteResult {
  success: boolean;
  columns: string[];
  rows: (number | string | null)[][];
  totalRows: number;
  affectedRows: number;
  durationMs: number;
}

export interface ChallengeEvaluation {
  passed: boolean;
  feedback: string;
  studentResult: {
    columns: string[];
    rows: (number | string | null)[][];
    count: number;
  };
  expectedResult: {
    columns: string[];
    rows: (number | string | null)[][];
    count: number;
  };
}

export function runPreview(
  dataset: string,
  table: string,
  deadlineMs?: number,
): Promise<SampleResult>;

export function executeSql(
  dataset: string,
  sql: string,
  deadlineMs?: number,
): Promise<ExecuteResult>;

export function evaluateChallenge(
  dataset: string,
  studentSql: string,
  expectedSql: string,
  deadlineMs?: number,
): Promise<ChallengeEvaluation>;
