import type { Evidence } from "../../types/game";
import type { EvidenceCandidate } from "../data-sources/DataSourceAdapter";

export function createEvidence(candidate: EvidenceCandidate): Evidence {
  const { row, sourceId, table, recordId } = candidate;
  const number = row.room_number ?? row.room;
  const room = number !== undefined ? `ROOM ${number}` : String(row.person_name ?? row.camera_id ?? recordId);
  const notable = row.note ?? (row.amount !== undefined ? `${row.item} · ${row.amount} ${row.currency} · ${row.status}` : undefined) ?? (row.relation ? `${row.relation}: ${row.target_label}` : undefined) ?? row.status ?? row.event ?? (row.value !== undefined ? `${row.value} ${row.unit ?? ""}` : recordId);
  return {
    id: `E-case-001-${sourceId}-${table}-${recordId}`,
    title: `${room} の記録`,
    source: `${sourceId}.${table}.${recordId}`,
    summary: `${row.timestamp ? `${row.timestamp} · ` : ""}${notable}`,
    row: { ...row },
  };
}
