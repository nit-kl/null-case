import data from "../../data/cases/case-001/staff.json";
import extra from "../../data/cases/case-001/supplemental.json";
import type { DataRow } from "../../types/game";
import { withCandidates, type DataSourceAdapter, type SourceControl } from "./DataSourceAdapter";
import { recordResult } from "./filterQuery";
import { readFilters } from "./structuredQuery";

export class StaffAdapter implements DataSourceAdapter {
  readonly id = "staff";
  readonly label = "STAFF DB";
  readonly presets = [JSON.stringify({ node_id: "S-01" })];
  readonly schema = [{ name: "staff_relations", columns: ["person_id", "person_name", "relation", "target_id", "target_label"], query: this.presets[0] }];
  constructor(private readonly records: DataRow[] = [...data.records, ...extra.staffRecords]) {}
  get controls(): SourceControl[] {
    const nodes = new Map<string, string>();
    for (const row of this.records) {
      nodes.set(String(row.person_id), String(row.person_name));
      nodes.set(String(row.target_id), String(row.target_label));
    }
    return [{ key: "node_id", label: "人物・部署・権限", type: "select", options: [...nodes].map(([value, label]) => ({ value, label })) }];
  }
  execute(query: string) {
    const started = performance.now();
    const { node_id } = readFilters(query, ["node_id"]);
    if (!/^[A-Z0-9-]+$/.test(node_id)) throw new Error("探索するノードを選択してください。");
    const rows = this.records.filter((row) => row.person_id === node_id || row.target_id === node_id);
    return withCandidates(this.id, recordResult("staff_relations", rows, this.records, started), (row) => String(row._recordId));
  }
}
