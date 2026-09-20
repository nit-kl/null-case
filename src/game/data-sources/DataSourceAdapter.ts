import type { DataRow, QueryResult } from "../../types/game";

export type SourceId = "hotel" | "access" | "facility" | "camera" | "payment" | "staff";
export interface SourceControl {
  key: string;
  label: string;
  type: "select" | "number" | "time";
  options?: readonly { value: string; label: string }[];
}
export interface EvidenceCandidate {
  sourceId: SourceId;
  table: string;
  recordId: string;
  row: DataRow;
}
export interface SourceResult extends QueryResult {
  sourceId: SourceId;
  candidates: EvidenceCandidate[];
}
export interface DataSourceAdapter {
  readonly controls?: readonly SourceControl[];
  readonly id: SourceId;
  readonly label: string;
  readonly presets: readonly string[];
  readonly schema: readonly { name: string; columns: readonly string[]; query: string }[];
  execute(query: string): SourceResult;
}
export function withCandidates(sourceId: SourceId, result: QueryResult, identify: (row: DataRow) => string): SourceResult {
  return { ...result, sourceId, candidates: result.records.map((row) => ({ sourceId, table: result.table, recordId: identify(row), row: { ...row } })) };
}
