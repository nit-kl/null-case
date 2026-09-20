import type { DataRow, QueryResult } from "../../types/game";

const clock = "(?:[01]\\d|2[0-3]):[0-5]\\d";
const rangePattern = new RegExp(`^(timestamp|time):\\[(${clock}) TO (${clock})\\]$`, "i");

/** Literal-only filter language; never executes expressions. */
export function filterQuery(query: string, records: DataRow[], fields: readonly string[]): DataRow[] {
  if (!query.trim() || query.length > 1000) throw new Error("検索条件を1〜1000文字で入力してください。");
  const seen = new Set<string>();
  const predicates = query.trim().split(/\s+AND\s+/i).map((clause) => {
    const range = clause.match(rangePattern);
    if (range) {
      if (seen.has("timestamp")) throw new Error("時刻条件は1つだけ指定してください。");
      seen.add("timestamp");
      const [, , start, end] = range;
      if (start > end) throw new Error("開始時刻は終了時刻以前にしてください（日付をまたぐ範囲は未対応）。");
      return (row: DataRow) => {
        // Fixed story timezone (+09:00), independent of browser timezone.
        const time = String(row.timestamp).slice(11, 16);
        return time >= start && time <= end;
      };
    }
    const term = clause.match(/^([a-z_]+):([a-z0-9_-]+)$/i);
    if (!term || !fields.includes(term[1].toLowerCase())) throw new Error("未対応の検索条件です。例: room:404 AND timestamp:[22:00 TO 23:00]");
    const [, rawField, value] = term;
    const field = rawField.toLowerCase();
    if (seen.has(field)) throw new Error(`条件 '${field}' が重複しています。`);
    seen.add(field);
    if (field === "room" && !/^\d+$/.test(value)) throw new Error("roomには部屋番号を指定してください。");
    return (row: DataRow) => String(row[field]) === value;
  });
  return records.filter((row) => predicates.every((predicate) => predicate(row)));
}
export function recordResult(table: string, records: DataRow[], allRecords: DataRow[], started: number): QueryResult {
  return { table, records, rows: records.map((row) => ({ ...row })), columns: Object.keys(allRecords[0] ?? {}).filter((key) => !key.startsWith("_")), elapsedMs: Math.max(1, Math.round(performance.now() - started)), message: `${records.length} rows returned.` };
}
