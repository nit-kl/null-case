import hotel from "../../data/cases/case-001/hotel.json";
import access from "../../data/cases/case-001/access.json";
import camera from "../../data/cases/case-001/camera.json";
import payment from "../../data/cases/case-001/payment.json";
import facility from "../../data/cases/case-001/facility.json";
import staff from "../../data/cases/case-001/staff.json";
import rules from "../../data/cases/case-001/evidence.json";
import type { DataRow, Evidence } from "../../types/game";
import type { EvidenceCandidate, SourceResult } from "../data-sources/DataSourceAdapter";
import { createEvidence } from "./createEvidence";

const candidates: EvidenceCandidate[] = [];
const keys: Record<string, string> = { rooms: "room_number", reservations: "reservation_id", room_notes: "note_id" };
for (const table of hotel.tables) {
  for (const row of table.rows as DataRow[]) candidates.push({ sourceId: "hotel", table: table.name, recordId: String(row[keys[table.name]]), row });
}
for (const [sourceId, table, records] of [
  ["access", "access_logs", access.records], ["camera", "camera_events", camera.records],
  ["payment", "transactions", payment.records], ["facility", "power_readings", facility.records],
  ["staff", "staff_relations", staff.records],
] as const) {
  for (const row of records) candidates.push({ sourceId, table, recordId: row._recordId, row });
}

// Save only stable IDs; always rebuild displayed evidence from the current case records.
export const evidenceCatalog = new Map<string, Evidence>(candidates.map((candidate) => {
  const item = createEvidence(candidate);
  const definition = rules.definitions.find((rule) => rule.source === item.source);
  return [item.id, { ...item, title: definition?.title ?? item.title, tags: definition?.tags ?? [] }];
}));

export function discoverEvidence(result: SourceResult): string[] {
  return result.candidates.flatMap((candidate) => {
    const item = createEvidence(candidate);
    const definition = rules.definitions.find((rule) => rule.source === item.source);
    const condition = definition?.unlockWhen ?? rules.defaultUnlockWhen;
    return condition === "recordReturned" && evidenceCatalog.has(item.id) ? [item.id] : [];
  });
}

export function registerEvidence(id: string, discoveredIds: readonly string[], evidenceIds: readonly string[]): string[] {
  if (!evidenceCatalog.has(id) || !discoveredIds.includes(id)) throw new Error("検索で発見した記録だけを証拠に登録できます。");
  return evidenceIds.includes(id) ? [...evidenceIds] : [...evidenceIds, id];
}
