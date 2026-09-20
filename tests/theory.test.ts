import { describe, it, expect } from "vitest";
import { emptyTheory, theoryFields, submissionIssues, submitTheory, validateTheory } from "../src/game/theory/caseTheory";
import { emptySave, migrateSave } from "../src/game/save/investigationSave";
import { evidenceCatalog } from "../src/game/evidence/catalog";
const [id] = evidenceCatalog.keys();
const complete = () => {
  const theory = emptyTheory();
  for (const { id: field } of theoryFields) theory.draft[field] = { statement: `仮説 ${field}`, reasoning: "この記録を根拠とする", evidenceIds: [id] };
  return theory;
};
const date = "2026-09-20T00:00:00.000Z";

describe("case theory", () => {
  it("allows partial drafts but requires a claim, explanation and evidence for all four conclusions", () => {
    expect(validateTheory(emptyTheory(), [])).toEqual(emptyTheory());
    expect(submissionIssues(emptyTheory().draft)).toHaveLength(12);
    expect(() => submitTheory(emptyTheory(), [], date)).toThrow();
    const theory = complete(); theory.draft.motive.statement = "  ";
    expect(submissionIssues(theory.draft)).toEqual(["動機の推理を入力してください。"]);
  });
  it("snapshots submissions independently of further draft edits", () => {
    const theory = complete();
    const next = submitTheory(theory, [id], date);
    next.draft.culprit.statement = "別の仮説";
    next.draft.culprit.evidenceIds.length = 0;
    expect(next.submissions[0].draft.culprit.statement).toBe("仮説 culprit");
    expect(next.submissions[0].draft.culprit.evidenceIds).toEqual([id]);
    expect(theory.submissions).toEqual([]);
    expect(next.submissions[0].id).toBe(1);
  });
  it("rejects immediate duplicate submissions and caps history without deleting it", () => {
    let state = submitTheory(complete(), [id], date);
    expect(() => submitTheory(state, [id], date)).toThrow("提出済み");
    for (let n = 1; n < 20; n++) { state.draft.culprit.statement = `仮説 ${n}`; state = submitTheory(state, [id], date); }
    state.draft.culprit.statement = "追加";
    expect(() => submitTheory(state, [id], date)).toThrow("20件");
    expect(state.submissions).toHaveLength(20);
  });
  it("accepts player text literally without deciding correctness", () => {
    const state = complete(); state.draft.motive.statement = "<script>alert(1)</script>";
    expect(submitTheory(state, [id], date).submissions[0].draft.motive.statement).toBe("<script>alert(1)</script>");
  });
  it("rejects unknown evidence, duplicate IDs, overlong text and malformed dates", () => {
    const state = complete();
    expect(() => validateTheory(state, [])).toThrow();
    state.draft.method.evidenceIds = [id, id];
    expect(() => validateTheory(state, [id])).toThrow();
    state.draft.method.evidenceIds = [id]; state.draft.method.reasoning = "a".repeat(1001);
    expect(() => validateTheory(state, [id])).toThrow();
    expect(() => submitTheory(complete(), [id], "2026-02-30T00:00:00.000Z")).toThrow();
  });
  it("rejects invalid snapshots even when the draft itself is valid", () => {
    const state = submitTheory(complete(), [id], date);
    state.submissions[0].draft.time.evidenceIds = [];
    expect(() => validateTheory(state, [id])).toThrow();
    expect(() => validateTheory({ ...emptyTheory(), submissions: [{ id: 5 }] }, [id])).toThrow();
  });
});

describe("save v4", () => {
  it.each([1, 2, 3])("migrates v%s progress with an empty draft", (version) => {
    const old = { ...emptySave(), schemaVersion: version, discoveredIds: [id], evidenceIds: [id] };
    const save = migrateSave(old);
    expect(save.schemaVersion).toBe(5);
    expect(save.evidenceIds).toEqual([id]);
    expect(save.theory).toEqual(emptyTheory());
    expect(save.board).toEqual(old.board);
    expect(save.story).toEqual(old.story);
  });
  it("round trips submissions and rejects missing or invalid v4 theory", () => {
    const save = { ...emptySave(), discoveredIds: [id], evidenceIds: [id], theory: submitTheory(complete(), [id], date) };
    expect(migrateSave(save)).toEqual(save);
    expect(() => migrateSave({ ...save, theory: undefined })).toThrow();
    expect(() => migrateSave({ ...save, evidenceIds: [] })).toThrow();
  });
});
