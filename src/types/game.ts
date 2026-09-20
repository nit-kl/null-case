export type Scalar = string | number | boolean | null;
export type DataRow = Record<string, Scalar>;

export interface DataTable {
  name: string;
  label: string;
  rows: DataRow[];
}

export interface QueryResult {
  table: string;
  records: DataRow[];
  columns: string[];
  rows: DataRow[];
  elapsedMs: number;
  message: string;
}

export interface Evidence {
  tags?: string[];
  id: string;
  title: string;
  source: string;
  summary: string;
  row: DataRow;
}
