import data from "../../data/cases/case-001/access.json";
import type { DataRow } from "../../types/game";
import { withCandidates, type DataSourceAdapter } from "./DataSourceAdapter";
import { filterQuery, recordResult } from "./filterQuery";

export class AccessAdapter implements DataSourceAdapter {
  readonly id = "access";
  readonly label = "ACCESS DB";
  readonly presets = ["room:404 AND timestamp:[22:00 TO 23:00]", "timestamp:[22:00 TO 23:00]", "room:405", "event:denied"];
  readonly schema = [{ name: "access_logs", columns: ["room", "timestamp", "card_id", "event"], query: this.presets[0] }];
  constructor(private readonly records: DataRow[] = data.records) {}
  execute(query: string) {
    const started = performance.now();
    const rows = filterQuery(query, this.records, ["room", "card_id", "event"]);
    return withCandidates(this.id, recordResult("access_logs", rows, this.records, started), (row) => String(row._recordId));
  }
}
