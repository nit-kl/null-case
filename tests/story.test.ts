import { describe, expect, it } from "vitest";
import { advanceStory, currentObjective, emptyStory, markStoryRead, storyEvents, validateStory } from "../src/game/story/storyEngine";
import { emptySave, migrateSave } from "../src/game/save/investigationSave";
import { evidenceCatalog } from "../src/game/evidence/catalog";
const note = "E-case-001-hotel-room_notes-N-882";
const access = "E-case-001-access-access_logs-A-002";
const base = { discoveredIds: [] as string[], evidenceIds: [] as string[], board: { links: [] as unknown[] } };

describe("story progression", () => {
  it("starts with only the connection message and unlocks discovery separately from registration", () => {
    const initial = advanceStory(emptyStory(), base);
    expect(initial.deliveredIds).toEqual(["ST-001"]);
    const found = advanceStory(initial, { ...base, discoveredIds: [note, access] });
    expect(found.deliveredIds).toEqual(["ST-001", "ST-002"]);
    expect(advanceStory(found, { ...base, evidenceIds: [note] }).deliveredIds).not.toContain("ST-003");
    const registered = advanceStory(found, { ...base, discoveredIds: [note, access], evidenceIds: [note, access] });
    expect(registered.deliveredIds).toContain("ST-003");
    expect(currentObjective(registered)).toContain("設備・映像・取引");
    expect(advanceStory(registered, base)).toEqual(registered);
  });
  it("retains a board milestone after removing links and never delivers twice", () => {
    const delivered = advanceStory(emptyStory(), { ...base, board: { links: [{}] } });
    expect(delivered.deliveredIds).toEqual(["ST-001", "ST-005"]);
    expect(advanceStory(delivered, base)).toEqual(delivered);
    expect(advanceStory(delivered, { ...base, board: { links: [{}] } })).toEqual(delivered);
  });
  it("marks only delivered messages read without changing their order", () => {
    const initial = advanceStory(emptyStory(), base);
    expect(markStoryRead(initial, "ST-002")).toBe(initial);
    const read = markStoryRead(initial, "ST-001");
    expect(read.readIds).toEqual(["ST-001"]);
    expect(markStoryRead(read, "ST-001")).toBe(read);
    expect(initial.readIds).toEqual([]);
  });
  it("uses valid unique event IDs and existing evidence references", () => {
    expect(new Set(storyEvents.map((event) => event.id)).size).toBe(storyEvents.length);
    for (const event of storyEvents) if (event.when.type === "registered" || event.when.type === "discovered") {
      for (const id of event.when.ids) expect(evidenceCatalog.has(id)).toBe(true);
    }
  });
  it.each([null, {}, { deliveredIds: ["unknown"], readIds: [] }, { deliveredIds: ["ST-001", "ST-001"], readIds: [] }, { deliveredIds: [], readIds: ["ST-001"] }])("rejects malformed story state %j", (value) => expect(() => validateStory(value)).toThrow());
});

describe("v3 migration", () => {
  it.each([1, 2])("derives unread messages from v%s evidence without losing history or board", (version) => {
    const old = { ...emptySave(), schemaVersion: version, discoveredIds: [note, access], evidenceIds: [note, access], history: [{ sourceId: "hotel", query: "SELECT * FROM rooms" }] };
    const migrated = migrateSave(old);
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.story.deliveredIds).toEqual(["ST-001", "ST-002", "ST-003"]);
    expect(migrated.story.readIds).toEqual([]);
    expect(migrated.history).toEqual(old.history);
    expect(migrated.board).toEqual(old.board);
  });
  it("preserves read state and rejects a missing v3 story", () => {
    const save = emptySave();
    save.story = markStoryRead(save.story, "ST-001");
    expect(migrateSave(save)).toEqual(save);
    expect(() => migrateSave({ ...save, story: undefined })).toThrow();
  });
});
