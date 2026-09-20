import hotelData from "../../data/cases/case-001/hotel.json";
import extra from "../../data/cases/case-001/supplemental.json";
import { executeQuery } from "../query-engine/queryEngine";
import type { DataTable } from "../../types/game";
import { withCandidates, type DataSourceAdapter } from "./DataSourceAdapter";

export class HotelAdapter implements DataSourceAdapter {
  readonly id = "hotel";
  readonly label = "HOTEL DB";
  readonly presets = [
    "SELECT * FROM rooms WHERE room_number = 404;",
    "SELECT * FROM rooms;",
    "SELECT * FROM room_notes WHERE room_number = 404;",
    "SELECT guest_name, room_number FROM reservations;",
  ];
  constructor(private readonly tables: DataTable[] = [...hotelData.tables, ...extra.hotelTables]) {}
  get schema() {
    return this.tables.map((table) => ({ name: table.name, columns: Object.keys(table.rows[0] ?? {}), query: `SELECT * FROM ${table.name};` }));
  }
  execute(query: string) {
    const result = executeQuery(query, this.tables);
    // Preserve M01 data; use its existing natural keys across projections.
    const keys: Record<string, string> = { rooms: "room_number", reservations: "reservation_id", room_notes: "note_id" };
    return withCandidates(this.id, result, (row) => {
      const key = row._recordId ?? row[keys[result.table]];
      if (key === undefined || key === null) throw new Error("証拠の識別子がありません。");
      return String(key);
    });
  }
}
