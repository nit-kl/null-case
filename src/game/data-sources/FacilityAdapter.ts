import data from "../../data/cases/case-001/facility.json";
import type { DataRow } from "../../types/game";
import { withCandidates, type DataSourceAdapter } from "./DataSourceAdapter";
import { filterQuery, recordResult } from "./filterQuery";

export class FacilityAdapter implements DataSourceAdapter {
  readonly id = "facility";
  readonly label = "FACILITY DB";
  readonly presets = ["room:404 AND metric:power_kw AND timestamp:[22:00 TO 23:00]"];
  readonly schema = [{ name: "power_readings", columns: ["room", "timestamp", "metric", "value", "unit"], query: this.presets[0] }];
  constructor(private readonly records: DataRow[] = data.records) {}
  execute(query: string) {
    const started = performance.now();
    const rows = filterQuery(query, this.records, ["room", "metric"])
      .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    return withCandidates(this.id, recordResult("power_readings", rows, this.records, started), (row) => String(row._recordId));
  }
}
