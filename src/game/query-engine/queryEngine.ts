import type { DataRow, DataTable, QueryResult, Scalar } from "@/types/game";

const normalize = (query: string) => query.trim().replace(/;$/, "").replace(/\s+/g, " ");

function parseValue(raw: string): Scalar {
  const value = raw.trim();
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.toLowerCase() === "null") return null;
  return value;
}

export function executeQuery(query: string, tables: DataTable[]): QueryResult {
  const started = performance.now();
  const sql = normalize(query);
  const match = sql.match(/^select (\*|[a-z0-9_, ]+) from ([a-z0-9_]+)(?: where ([a-z0-9_]+)\s*=\s*(.+))?$/i);

  if (!match) {
    throw new Error("この端末では SELECT ... FROM ... [WHERE 列 = 値] の形式だけ実行できます。");
  }

  const [, rawColumns, tableName, whereColumn, whereRawValue] = match;
  const table = tables.find((item) => item.name.toLowerCase() === tableName.toLowerCase());
  if (!table) throw new Error(`テーブル '${tableName}' は HOTEL DB に存在しません。`);

  let rows = [...table.rows];
  if (whereColumn && whereRawValue !== undefined) {
    const expected = parseValue(whereRawValue);
    rows = rows.filter((row) => String(row[whereColumn] ?? "") === String(expected ?? ""));
  }

  const selectedColumns = rawColumns === "*"
    ? Object.keys(table.rows[0] ?? {})
    : rawColumns.split(",").map((column) => column.trim());

  for (const column of selectedColumns) {
    if (table.rows[0] && !(column in table.rows[0])) throw new Error(`列 '${column}' は存在しません。`);
  }

  const projected = rows.map((row) => Object.fromEntries(selectedColumns.map((column) => [column, row[column]])) as DataRow);
  const elapsedMs = Math.max(1, Math.round(performance.now() - started));
  return { columns: selectedColumns, rows: projected, elapsedMs, message: `${projected.length} rows returned.` };
}
