import { describe, expect, it } from "vitest";
import { HotelAdapter } from "../src/game/data-sources/HotelAdapter";
import { discoverEvidence, evidenceCatalog, registerEvidence } from "../src/game/evidence/catalog";
import { decodeSave, emptySave, migrateSave, recordSearch } from "../src/game/save/investigationSave";
import rules from "../src/data/cases/case-001/evidence.json";

const hotel = new HotelAdapter();
const query = "SELECT note_id FROM room_notes WHERE room_number = 404";
const result = hotel.execute(query);
const [id] = discoverEvidence(result);

describe("evidence discovery", () => {
  it("unlocks the returned record even after projection, never before discovery", () => {
    expect(() => registerEvidence(id, [], [])).toThrow();
    expect(discoverEvidence(hotel.execute(hotel.presets[0]))).toEqual([]);
    expect(discoverEvidence(result)).toHaveLength(1);
    expect(registerEvidence(id, [id], [])).toEqual([id]);
    expect(registerEvidence(id, [id], [id])).toEqual([id]);
    expect(evidenceCatalog.get(id)?.row.note).toBe("長期停止区画。支配人承認なしで入室禁止");
    expect(evidenceCatalog.get(id)?.title).toBe("404号室の運用メモ");
  });
  it("uses valid, unique case rule references", () => {
    const items = [...evidenceCatalog.values()];
    expect(new Set(rules.definitions.map((definition) => definition.source)).size).toBe(rules.definitions.length);
    for (const definition of rules.definitions) expect(items.some((item) => item.source === definition.source)).toBe(true);
    expect(() => registerEvidence("unknown", ["unknown"], [])).toThrow();
  });
});

describe("versioned investigation saves", () => {
  it("round trips IDs and history without storing raw evidence", () => {
    const save = recordSearch(emptySave(), "hotel", query, [id]);
    save.evidenceIds = registerEvidence(id, save.discoveredIds, []);
    expect(decodeSave(JSON.stringify(save))).toEqual(save);
    expect(JSON.stringify(save)).not.toContain("入室禁止");
    expect(migrateSave(save)).not.toBe(save);
  });
  it("keeps discovery unique and only the latest 100 successful searches", () => {
    let save = emptySave();
    for (let i = 0; i < 105; i++) save = recordSearch(save, "hotel", `query-${i}`, [id]);
    expect(save.history).toHaveLength(100);
    expect(save.history[0].query).toBe("query-5");
    expect(save.discoveredIds).toEqual([id]);
    expect(emptySave().discoveredIds).toEqual([]);
  });
  it.each([null, [], {}, { ...emptySave(), schemaVersion: 999 }, { ...emptySave(), caseId: "case-002" },
    { ...emptySave(), caseSchemaVersion: 2 }, { ...emptySave(), evidenceIds: [id] },
    { ...emptySave(), discoveredIds: ["unknown"] }, { ...emptySave(), history: [{ sourceId: "bad", query: "x" }] },
    { ...emptySave(), history: [{ sourceId: "hotel", query: 5 }] },
  ])("rejects incompatible or malformed saves: %j", (value) => {
    expect(() => migrateSave(value)).toThrow();
  });
  it("rejects corrupt and oversized JSON", () => {
    expect(() => decodeSave("{" )).toThrow();
    expect(() => decodeSave(" ".repeat(1100001))).toThrow();
  });
  it("ignores injected display fields and normalizes duplicates", () => {
    const save = decodeSave(JSON.stringify({ ...emptySave(), discoveredIds: [id, id], evidenceIds: [id, id], row: { note: "forged" } }));
    expect(save.discoveredIds).toEqual([id]);
    expect(save.evidenceIds).toEqual([id]);
    expect(save).not.toHaveProperty("row");
  });
});
