export type Scalar = string | number | boolean | null;
export type DataRow = Record<string, Scalar>;

export interface DataTable {
  name: string;
  label: string;
  rows: DataRow[];
}

export interface QueryResult {
  columns: string[];
  rows: DataRow[];
  elapsedMs: number;
  message: string;
}

export interface Evidence {
  id: string;
  title: string;
  source: string;
  summary: string;
  row: DataRow;
}
