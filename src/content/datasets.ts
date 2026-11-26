import raw from "../../content/datasets.json" with { type: "json" };

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

const typed = raw as Dataset[];
export default typed;
export const datasets = typed;
