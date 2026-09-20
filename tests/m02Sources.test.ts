import { describe, expect, it } from "vitest";
import { CameraAdapter } from "../src/game/data-sources/CameraAdapter";
import { PaymentAdapter } from "../src/game/data-sources/PaymentAdapter";
import { StaffAdapter } from "../src/game/data-sources/StaffAdapter";
import { createEvidence } from "../src/game/evidence/createEvidence";
import camera from "../src/data/cases/case-001/camera.json";

const cameraQuery = (filters = {}) => JSON.stringify({ camera_id: "", person_tag: "", start: "22:00", end: "23:00", ...filters });
const paymentQuery = (filters = {}) => JSON.stringify({ terminal: "", method: "", min: "", max: "", ...filters });

describe("CAMERA timeline", () => {
  it("sorts without mutating and combines camera, tag and inclusive time filters", () => {
    const records = [...camera.records].reverse();
    const before = JSON.stringify(records);
    const adapter = new CameraAdapter(records);
    expect(adapter.execute(cameraQuery()).candidates.map((c) => c.recordId)).toEqual(["C-001", "C-002", "C-003", "C-004"]);
    expect(adapter.execute(cameraQuery({ camera_id: "CAM-4F-CORRIDOR", person_tag: "dark_coat", start: "22:19", end: "22:19" })).candidates.map((c) => c.recordId)).toEqual(["C-003"]);
    expect(JSON.stringify(records)).toBe(before);
  });
  it("returns no matches without treating tag values as code", () => {
    const result = new CameraAdapter().execute(cameraQuery({ person_tag: "' OR 1=1;" }));
    expect(result.rows).toEqual([]);
    expect(result.columns).toContain("person_tag");
  });
  it.each([{ start: "24:00" }, { end: "21:00" }, { start: "" }])("rejects invalid time %j", (filters) => {
    expect(() => new CameraAdapter().execute(cameraQuery(filters))).toThrow();
  });
});

describe("PAYMENT filters", () => {
  it("combines terminal, method and inclusive amount range", () => {
    const adapter = new PaymentAdapter();
    expect(adapter.execute(paymentQuery({ min: "2400", max: "2400" })).rows).toHaveLength(2);
    expect(adapter.execute(paymentQuery({ terminal: "ROOM-SERVICE-01", method: "room_charge", min: "2400", max: "2400" })).candidates[0].recordId).toBe("P-002");
    expect(adapter.execute(paymentQuery({ min: "0", max: "0" })).rows).toEqual([]);
    expect(adapter.execute(paymentQuery()).rows).toHaveLength(4);
  });
  it.each([{ min: "-1" }, { min: "1.5" }, { min: "Infinity" }, { min: "1e3" }, { min: "9007199254740992" }, { min: "2", max: "1" }])("rejects invalid amount %j", (filters) => {
    expect(() => new PaymentAdapter().execute(paymentQuery(filters))).toThrow();
  });
});

describe("STAFF graph", () => {
  it("traverses a person to shared permissions and to another person", () => {
    const adapter = new StaffAdapter();
    const first = adapter.execute(JSON.stringify({ node_id: "S-02" }));
    const shared = adapter.execute(JSON.stringify({ node_id: "P-SERVICE" }));
    const next = adapter.execute(JSON.stringify({ node_id: "S-03" }));
    expect(first.rows).toHaveLength(2);
    expect(shared.rows.map((r) => r.person_id)).toEqual(["S-02", "S-03"]);
    expect(next.rows).toHaveLength(3);
    expect(createEvidence(first.candidates[1])).toEqual(createEvidence(shared.candidates[0]));
    expect(adapter.execute(JSON.stringify({ node_id: "UNKNOWN" })).rows).toEqual([]);
  });
});

describe("new source contract and evidence", () => {
  for (const adapter of [new CameraAdapter(), new PaymentAdapter(), new StaffAdapter()]) {
    it(`${adapter.id}: each result row can become evidence`, () => {
      const result = adapter.execute(adapter.presets[0]);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.candidates).toHaveLength(result.rows.length);
      expect(new Set(result.candidates.map((c) => c.recordId)).size).toBe(result.rows.length);
      result.candidates.forEach((candidate, index) => {
        expect(candidate.recordId).not.toBe("undefined");
        const item = createEvidence(candidate);
        expect(item.source).toContain(`${adapter.id}.`);
        expect(item.row).toEqual(result.rows[index]);
        expect(item.row).not.toBe(candidate.row);
      });
    });
    it.each(["null", "[]", "{}", "false", "not json", '{"__proto__":"x"}', '{"node_id":5}', "x".repeat(2001)])(`${adapter.id}: rejects malformed filters %s`, (query) => {
      expect(() => adapter.execute(query)).toThrow();
    });
  }
});
