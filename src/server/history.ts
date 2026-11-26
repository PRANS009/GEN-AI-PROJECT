export interface HistoryEntry {
  id: string;
  sql: string;
  database: string;
  status: "success" | "error";
  durationMs: number;
  rowCount: number;
  affectedRows: number;
  timestamp: string;
  error?: string;
}

export interface SavedQuery {
  id: string;
  title: string;
  database: string;
  sql: string;
  createdAt: string;
}

const historyStore: HistoryEntry[] = [];
const savedQueriesStore: SavedQuery[] = [
  {
    id: "sq_1",
    title: "Top 5 Students by Marks",
    database: "student_management",
    sql: "SELECT name, marks FROM students ORDER BY marks DESC LIMIT 5;",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sq_2",
    title: "Department Salaries Overview",
    database: "employee_management",
    sql: "SELECT d.name, AVG(e.salary) as avg_salary, COUNT(e.id) as emp_count FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id;",
    createdAt: new Date().toISOString(),
  },
];

export function recordHistory(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
  const item: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  historyStore.unshift(item);
  if (historyStore.length > 200) historyStore.pop();
  return item;
}

export function listHistory(limit = 50): HistoryEntry[] {
  return historyStore.slice(0, limit);
}

export function listSavedQueries(): SavedQuery[] {
  return savedQueriesStore;
}

export function createSavedQuery(title: string, database: string, sql: string): SavedQuery {
  const item: SavedQuery = {
    id: crypto.randomUUID(),
    title,
    database,
    sql,
    createdAt: new Date().toISOString(),
  };
  savedQueriesStore.unshift(item);
  return item;
}

export function deleteSavedQuery(id: string): boolean {
  const idx = savedQueriesStore.findIndex((s) => s.id === id);
  if (idx >= 0) {
    savedQueriesStore.splice(idx, 1);
    return true;
  }
  return false;
}
