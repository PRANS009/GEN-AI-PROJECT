import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TableColumn {
  name: string;
  type: string;
  pk: boolean;
}

export interface DatasetTable {
  name: string;
  definition: string;
  rows: (number | string | null)[][];
}

export interface Dataset {
  id: string;
  title: string;
  description: string;
  tables: DatasetTable[];
}

const raw = JSON.parse(
  readFileSync(resolve(process.cwd(), "content/datasets.json"), "utf8"),
) as Dataset[];

export default raw;
export const datasets = raw;
