import data from "../../data/cases/case-001/payment.json";
import type { DataRow } from "../../types/game";
import { withCandidates, type DataSourceAdapter, type SourceControl } from "./DataSourceAdapter";
import { recordResult } from "./filterQuery";
import { choices, readFilters } from "./structuredQuery";

export class PaymentAdapter implements DataSourceAdapter {
  readonly id = "payment";
  readonly label = "PAYMENT DB";
  readonly presets = [JSON.stringify({ terminal: "", method: "", min: "", max: "" })];
  readonly schema = [{ name: "transactions", columns: ["room", "timestamp", "terminal", "method", "amount", "currency", "item", "status"], query: this.presets[0] }];
  constructor(private readonly records: DataRow[] = data.records) {}
  get controls(): SourceControl[] { return [
    { key: "terminal", label: "端末", type: "select", options: choices(this.records, "terminal") },
    { key: "method", label: "決済手段", type: "select", options: choices(this.records, "method") },
    { key: "min", label: "最小金額（円）", type: "number" }, { key: "max", label: "最大金額（円）", type: "number" },
  ]; }
  execute(query: string) {
    const started = performance.now();
    const f = readFilters(query, ["terminal", "method", "min", "max"]);
    for (const value of [f.min, f.max]) {
      if (value !== "" && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) throw new Error("金額は0以上の整数で指定してください。");
    }
    const min = f.min === "" ? 0 : Number(f.min);
    const max = f.max === "" ? Infinity : Number(f.max);
    if (min > max) throw new Error("最小金額は最大金額以下にしてください。");
    const rows = this.records.filter((row) => (!f.terminal || row.terminal === f.terminal) && (!f.method || row.method === f.method) && Number(row.amount) >= min && Number(row.amount) <= max);
    return withCandidates(this.id, recordResult("transactions", rows, this.records, started), (row) => String(row._recordId));
  }
}
