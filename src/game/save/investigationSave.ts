import { evidenceCatalog } from "../evidence/catalog";
import type { SourceId } from "../data-sources/DataSourceAdapter";

export const SAVE_KEY = "null-case:case-001:investigation";
export interface QueryHistoryEntry { sourceId: SourceId; query: string; }
export interface InvestigationSave {
  schemaVersion: 1;
  caseId: "case-001";
  caseSchemaVersion: 1;
  discoveredIds: string[];
  evidenceIds: string[];
  history: QueryHistoryEntry[];
}
export const emptySave = (): InvestigationSave => ({ schemaVersion: 1, caseId: "case-001", caseSchemaVersion: 1, discoveredIds: [], evidenceIds: [], history: [] });
const sources = ["hotel", "access", "camera", "payment", "facility", "staff"];
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/** Version boundary: there was no persisted format before M03. Never guess at future formats. */
export function migrateSave(value: unknown): InvestigationSave {
  if (!object(value) || value.schemaVersion !== 1 || value.caseId !== "case-001" || value.caseSchemaVersion !== 1) throw new Error("この保存データの事件またはバージョンには対応していません。");
  const readIds = (value: unknown): string[] => {
    if (!Array.isArray(value) || value.length > evidenceCatalog.size || value.some((id) => typeof id !== "string" || !evidenceCatalog.has(id))) throw new Error("保存された証拠IDが不正です。");
    return [...new Set(value as string[])];
  };
  const discoveredIds = readIds(value.discoveredIds);
  const evidenceIds = readIds(value.evidenceIds);
  if (evidenceIds.some((id) => !discoveredIds.includes(id))) throw new Error("未発見の証拠を含む保存データです。");
  if (!Array.isArray(value.history) || value.history.length > 100 || value.history.some((entry) => !object(entry) || !sources.includes(String(entry.sourceId)) || typeof entry.query !== "string" || entry.query.length > 10000)) throw new Error("保存された検索履歴が不正です。");
  return { ...emptySave(), discoveredIds, evidenceIds, history: value.history.map((entry) => ({ sourceId: entry.sourceId as SourceId, query: entry.query as string })) };
}

export function decodeSave(raw: string): InvestigationSave {
  if (raw.length > 1100000) throw new Error("保存データが大きすぎます。");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("保存データを読み取れませんでした。"); }
  return migrateSave(parsed);
}

export function recordSearch(save: InvestigationSave, sourceId: SourceId, query: string, discovered: string[]): InvestigationSave {
  return { ...save, discoveredIds: [...new Set([...save.discoveredIds, ...discovered])], history: [...save.history, { sourceId, query: query.slice(0, 10000) }].slice(-100) };
}
