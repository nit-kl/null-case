import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import { advanceConversation, answerConversation, availableScenes, characters, conversationScenes, decodeConversations, emptyConversations, initialProgress } from "../src/game/story/conversations";
import { evidenceCatalog } from "../src/game/evidence/catalog";

it("all narrative gates reference existing evidence and portraits exist", () => {
  for (const scene of conversationScenes) {
    expect(scene.beats.length).toBeGreaterThanOrEqual(5);
    for (const id of scene.gate.ids ?? []) expect(evidenceCatalog.has(id), id).toBe(true);
    expect(existsSync(`public${characters[scene.character].image}`)).toBe(true);
  }
  expect(new Set(conversationScenes.map((scene) => scene.id)).size).toBe(conversationScenes.length);
});
it("starts with only the initial interview and unlocks by registered evidence", () => {
  expect(availableScenes([], 0).map((s) => s.id)).toEqual(["arrival"]);
  const note = "E-case-001-hotel-room_notes-N-882";
  expect(availableScenes([note], 0).map((s) => s.id)).toEqual(["arrival", "housekeeping"]);
  expect(availableScenes(["E-case-001-hotel-case_documents-H-M701"], 0).some((s) => s.id === "audit")).toBe(false);
  expect(availableScenes(["E-case-001-hotel-case_documents-H-M701", "E-case-001-hotel-case_documents-H-M702"], 0).some((s) => s.id === "audit")).toBe(true);
});
it("any evidence and submission gates work independently", () => {
  expect(availableScenes(["E-case-001-facility-power_readings-F-004"], 0).some((s) => s.id === "facility")).toBe(true);
  expect(availableScenes([], 1).map((s) => s.id)).toEqual(["arrival", "submission"]);
  expect(availableScenes([...evidenceCatalog.keys()], 1)).toHaveLength(conversationScenes.length - 1);
  expect(availableScenes([...evidenceCatalog.keys()], 1, true)).toHaveLength(conversationScenes.length);
});
it("questions require a valid answer and each branch has its own reply", () => {
  const scene = conversationScenes[0];
  const index = scene.beats.findIndex((beat) => beat.choices);
  const progress = { ...initialProgress(), index };
  expect(advanceConversation(scene, progress)).toEqual(progress);
  expect(answerConversation(scene, progress, "invalid")).toEqual(progress);
  const choices = scene.beats[index].choices!;
  expect(choices[0].reply).not.toBe(choices[1].reply);
  const selected = answerConversation(scene, progress, choices[0].id);
  expect(advanceConversation(scene, selected).index).toBe(index + 1);
  expect(progress.answers).toEqual({});
});
it("completion occurs only at the last line and progress round-trips", () => {
  const scene = conversationScenes[0];
  let progress = initialProgress();
  for (const beat of scene.beats) {
    expect(progress.completed).toBe(false);
    if (beat.choices) progress = answerConversation(scene, progress, beat.choices[0].id);
    progress = advanceConversation(scene, progress);
  }
  expect(progress.completed).toBe(true);
  const save = { ...emptyConversations(), progress: { arrival: progress } };
  expect(decodeConversations(JSON.stringify(save))).toEqual(save);
});
it("rejects unsupported saves, unknown scene IDs, impossible indexes and answers", () => {
  const base = emptyConversations();
  for (const value of [null, { ...base, version: 99 }, { ...base, active: "unknown" }, { ...base, progress: { arrival: { ...initialProgress(), index: 900 } } }, { ...base, progress: { arrival: { ...initialProgress(), answers: { 0: "invented" } } } }, { ...base, progress: { arrival: { ...initialProgress(), index: 7 } } }]) {
    expect(() => decodeConversations(JSON.stringify(value))).toThrow();
  }
});
