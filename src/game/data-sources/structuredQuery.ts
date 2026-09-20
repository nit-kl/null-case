import type { DataRow } from "../../types/game";
import { filterQuery } from "./filterQuery";

export function readFilters(query: string, keys: readonly string[]): Record<string, string> {
  if (query.length > 2000) throw new Error("検索条件が長すぎます。");
  let value: unknown;
  try { value = JSON.parse(query); } catch { throw new Error("検索条件の形式が不正です。"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("検索条件はオブジェクトで指定してください。");
  const entries = Object.entries(value);
  if (entries.length !== keys.length || entries.some(([key, item]) => !keys.includes(key) || typeof item !== "string")) throw new Error("未対応または不足している検索条件があります。");
  return value as Record<string, string>;
}

export function timeWindow(rows: DataRow[], start: string, end: string): DataRow[] {
  return filterQuery(`timestamp:[${start} TO ${end}]`, rows, []);
}

export function choices(rows: DataRow[], key: string) {
  return [{ value: "", label: "すべて" }, ...Array.from(new Set(rows.map((row) => String(row[key])))).map((value) => ({ value, label: value }))];
}
