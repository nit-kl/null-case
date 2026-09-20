import type { DataRow, Evidence } from "@/types/game";

export function createEvidence(row: DataRow, source: string, index: number): Evidence {
  const room = row.room_number ? `ROOM ${row.room_number}` : "不明レコード";
  const notable = row.note ?? row.status ?? Object.values(row).find(Boolean) ?? "データ断片";
  return {
    id: `E-${String(index).padStart(3, "0")}`,
    title: `${room} の記録`,
    source,
    summary: String(notable),
    row,
  };
}
