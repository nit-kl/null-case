import data from "../../data/cases/case-001/access.json";
import extra from "../../data/cases/case-001/supplemental.json";
import type { DataRow } from "../../types/game";
import { withCandidates, type DataSourceAdapter } from "./DataSourceAdapter";
import { filterQuery, recordResult } from "./filterQuery";

export class AccessAdapter implements DataSourceAdapter {
  readonly id = "access";
  readonly label = "ACCESS DB";
  readonly presets = ["room:404 AND timestamp:[22:00 TO 23:00]", "timestamp:[22:00 TO 23:00]", "room:405", "event:denied"];
  readonly schema = [{ name: "access_logs", columns: ["room", "timestamp", "card_id", "event"], query: this.presets[0] }, ...extra.accessTables.map((table) => ({ name: table.name, columns: Object.keys(table.rows[0]), query: `table:${table.name} AND room:404` }))];
  constructor(private readonly records: DataRow[] = data.records) {}
  execute(query: string) {
    const started = performance.now();
    const selector = query.trim().match(/^table:([a-z_]+)\s+AND\s+(.+)$/i);
    const table = selector ? extra.accessTables.find((table) => table.name === selector[1]) : undefined;
    if (selector && !table) throw new Error("指定した監査テーブルは存在しません。");
    const records: DataRow[] = table ? table.rows : this.records;
    const rows = filterQuery(selector ? selector[2] : query, records, table?.name === "admin_audit" ? ["room", "actor", "event"] : ["room", "card_id", "event"]);
    return withCandidates(this.id, recordResult(table?.name ?? "access_logs", rows, records, started), (row) => String(row._recordId));
  }
}
