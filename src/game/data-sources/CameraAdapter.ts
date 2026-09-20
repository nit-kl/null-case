import data from "../../data/cases/case-001/camera.json";
import type { DataRow } from "../../types/game";
import { withCandidates, type DataSourceAdapter, type SourceControl } from "./DataSourceAdapter";
import { recordResult } from "./filterQuery";
import { choices, readFilters, timeWindow } from "./structuredQuery";

export class CameraAdapter implements DataSourceAdapter {
  readonly id = "camera";
  readonly label = "CAMERA DB";
  readonly presets = [JSON.stringify({ camera_id: "", person_tag: "", start: "22:00", end: "23:00" })];
  readonly schema = [{ name: "camera_events", columns: ["camera_id", "timestamp", "person_tag", "note"], query: this.presets[0] }];
  constructor(private readonly records: DataRow[] = data.records) {}
  get controls(): SourceControl[] { return [
    { key: "camera_id", label: "カメラ", type: "select", options: choices(this.records, "camera_id") },
    { key: "person_tag", label: "人物タグ", type: "select", options: choices(this.records, "person_tag") },
    { key: "start", label: "開始時刻", type: "time" }, { key: "end", label: "終了時刻", type: "time" },
  ]; }
  execute(query: string) {
    const started = performance.now();
    const f = readFilters(query, ["camera_id", "person_tag", "start", "end"]);
    const rows = timeWindow(this.records, f.start, f.end)
      .filter((row) => (!f.camera_id || row.camera_id === f.camera_id) && (!f.person_tag || row.person_tag === f.person_tag))
      .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    return withCandidates(this.id, recordResult("camera_events", rows, this.records, started), (row) => String(row._recordId));
  }
}
