import { describe, expect, it } from "vitest";
import { HotelAdapter } from "../src/game/data-sources/HotelAdapter";
import { AccessAdapter } from "../src/game/data-sources/AccessAdapter";
import { FacilityAdapter } from "../src/game/data-sources/FacilityAdapter";
import { createEvidence } from "../src/game/evidence/createEvidence";
import access from "../src/data/cases/case-001/access.json";
import facility from "../src/data/cases/case-001/facility.json";

describe("HotelAdapter / M01 regression", () => {
  const adapter = new HotelAdapter();
  it("keeps the missing room and its contradictory note", () => {
    expect(adapter.execute(adapter.presets[0]).rows).toEqual([]);
    expect(adapter.execute(adapter.presets[2]).rows[0].note_id).toBe("N-882");
  });
  it("preserves record identity and full evidence across projections", () => {
    const full = adapter.execute("SELECT * FROM reservations;");
    const projected = adapter.execute(adapter.presets[3]);
    expect(projected.columns).toEqual(["guest_name", "room_number"]);
    expect(projected.candidates).toEqual(full.candidates);
    expect(createEvidence(projected.candidates[0])).toEqual(createEvidence(full.candidates[0]));
    expect(projected.rows[0]).not.toHaveProperty("reservation_id");
  });
  it.each(["DELETE FROM rooms", "SELECT * FROM rooms; DROP TABLE rooms", "SELECT constructor FROM rooms", "SELECT * FROM rooms WHERE unknown = 1"])("rejects unsupported SQL: %s", (query) => {
    expect(() => adapter.execute(query)).toThrow();
  });
});

describe("AccessAdapter", () => {
  const adapter = new AccessAdapter();
  it("combines room and timestamp filters", () => {
    expect(adapter.execute(adapter.presets[0]).candidates.map((row) => row.recordId)).toEqual(["A-002"]);
  });
  it("includes both boundary minutes and supports the documented time alias", () => {
    const result = adapter.execute("time:[22:00 TO 23:00]");
    expect(result.rows).toHaveLength(5);
    expect(result.candidates.map((row) => row.recordId)).toContain("A-005");
    expect(result.candidates[0].recordId).toBe("A-001");
    expect(adapter.execute("timestamp:[22:00 TO 22:00]").rows).toHaveLength(1);
  });
  it("filters card and event literals; returns an empty set with columns", () => {
    expect(adapter.execute("card_id:K-SERVICE-04 AND event:denied").rows).toHaveLength(1);
    const result = adapter.execute("room:999");
    expect(result.rows).toEqual([]);
    expect(result.candidates).toEqual([]);
    expect(result.columns).toContain("timestamp");
  });
  it.each([
    "", "room:404 OR room:405", "room:404 AND", "timestamp:[24:00 TO 25:00]",
    "timestamp:[22:60 TO 23:00]", "timestamp:[23:00 TO 22:00]", "timestamp:[22:00 TO 23:00] trailing",
    "unknown:404", "__proto__:x", "room:404; DROP TABLE rooms", "room:404 AND eval:alert(1)",
    "room:404 AND room:405", "time:[22:00 TO 23:00] AND timestamp:[22:00 TO 23:00]", "room:abc",
    "a".repeat(1001),
  ])("rejects invalid input: %s", (query) => {
    expect(() => adapter.execute(query)).toThrow();
  });
});

describe("FacilityAdapter", () => {
  it("filters and sorts readings without mutating case data", () => {
    const records = [...facility.records].reverse();
    const original = JSON.stringify(records);
    const result = new FacilityAdapter(records).execute("room:404 AND metric:power_kw AND timestamp:[22:10 TO 22:30]");
    expect(result.rows.map((row) => row.value)).toEqual([0.09, 1.42, 1.65]);
    expect(result.candidates.map((row) => row.recordId)).toEqual(["F-002", "F-003", "F-004"]);
    expect(JSON.stringify(records)).toBe(original);
  });
  it("handles zero or one reading and rejects unsupported fields", () => {
    const adapter = new FacilityAdapter();
    expect(adapter.execute("room:999").rows).toEqual([]);
    expect(adapter.execute("timestamp:[22:20 TO 22:20]").rows).toHaveLength(1);
    expect(() => adapter.execute("card_id:K-404")).toThrow();
  });
});

describe("shared evidence", () => {
  it("registers every result row from all three sources with a stable unique ID", () => {
    const adapters = [new HotelAdapter(), new AccessAdapter(), new FacilityAdapter()];
    const results = [adapters[0].execute("SELECT * FROM rooms"), adapters[1].execute("time:[00:00 TO 23:59]"), adapters[2].execute("room:404")];
    const evidence = results.flatMap((result) => result.candidates.map(createEvidence));
    expect(evidence).toHaveLength(18);
    expect(new Set(evidence.map((item) => item.id)).size).toBe(evidence.length);
    for (const result of results) {
      expect(result.candidates).toHaveLength(result.rows.length);
      for (const candidate of result.candidates) {
        const item = createEvidence(candidate);
        expect(item.source).toBe(`${result.sourceId}.${result.table}.${candidate.recordId}`);
        expect(item.row).toEqual(candidate.row);
        expect(item.row).not.toBe(candidate.row);
      }
    }
  });
  it("uses source and table namespaces even for identical records", () => {
    const base = { sourceId: "access" as const, table: "logs", recordId: "001", row: { room: 404 } };
    expect(createEvidence(base).id).not.toBe(createEvidence({ ...base, sourceId: "facility" }).id);
    expect(createEvidence(base).id).not.toBe(createEvidence({ ...base, table: "other" }).id);
  });
  it("keeps new case IDs unique and timestamps in the fixed timezone", () => {
    for (const data of [access, facility]) {
      expect(new Set(data.records.map((row) => row._recordId)).size).toBe(data.records.length);
      expect(data.records.every((row) => /^2026-10-14T\d{2}:\d{2}:\d{2}\+09:00$/.test(row.timestamp))).toBe(true);
    }
  });
});
