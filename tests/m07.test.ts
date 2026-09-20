import { describe, expect, it } from "vitest";
import solution from "../src/server/evaluation/case-001.solution.json";
import { evaluateCaseModel, validateEvaluationRules } from "../src/server/evaluation/evaluateCaseModel";
import { evidenceCatalog } from "../src/game/evidence/catalog";
import { HotelAdapter } from "../src/game/data-sources/HotelAdapter";
import { AccessAdapter } from "../src/game/data-sources/AccessAdapter";
import { CameraAdapter } from "../src/game/data-sources/CameraAdapter";
import { StaffAdapter } from "../src/game/data-sources/StaffAdapter";
import { choicesUnlocked, publicChoices, validateReceipt } from "../src/game/theory/evaluationReceipt";
import { theoryFields, emptyTheory, submitTheory } from "../src/game/theory/caseTheory";
import { emptySave, migrateSave } from "../src/game/save/investigationSave";

describe("CASE 001 resolution", () => {
  const known = new Set(evidenceCatalog.keys());
  const ids = [...new Set(Object.values(solution.rules).flatMap((rule) => rule.evidenceGroups.flat()))];
  const model = () => Object.fromEntries(theoryFields.map(({ id }) => [id, { choiceId: solution.rules[id].correctChoices[0], evidenceIds: solution.rules[id].evidenceGroups.flat() }]));
  it("has eight discoverable supplemental records and valid rule references", () => {
    const hotel = new HotelAdapter(), access = new AccessAdapter(), camera = new CameraAdapter(), staff = new StaffAdapter();
    const results = [hotel.execute("SELECT * FROM case_documents"), access.execute("table:controller_logs AND room:404"), access.execute("table:admin_audit AND actor:S-01"), camera.execute(JSON.stringify({ camera_id: "", person_tag: "S-01", start: "22:00", end: "23:00" })), staff.execute(JSON.stringify({ node_id: "K-MANAGER-01" }))];
    const found = results.flatMap((result) => result.candidates.map((candidate) => `E-case-001-${candidate.sourceId}-${candidate.table}-${candidate.recordId}`));
    expect(found).toHaveLength(8);
    expect(found.sort()).toEqual([...ids].sort());
    expect(() => validateEvaluationRules(solution.rules, known)).not.toThrow();
    expect(hotel.execute(hotel.presets[0]).rows).toHaveLength(0);
    expect(access.execute(access.presets[0]).rows).toHaveLength(1);
  });
  it("only supports every conclusion with its assigned evidence", () => {
    expect(evaluateCaseModel(model(), solution.rules, known, new Set(ids)).outcome).toBe("supported");
    for (const { id } of theoryFields) {
      const draft = model(); draft[id].evidenceIds = [];
      expect(evaluateCaseModel(draft, solution.rules, known, new Set(ids)).fields[id]).toBe("insufficient_evidence");
    }
  });
  it("keeps public choices gated and separate from the server answer key", () => {
    for (const { id } of theoryFields) {
      expect(choicesUnlocked(id, [])).toBe(false);
      expect(choicesUnlocked(id, ids)).toBe(true);
      expect(publicChoices[id].options.map((option) => option.id)).toEqual(solution.rules[id].allowedChoices);
    }
    expect(JSON.stringify(publicChoices)).not.toMatch(/correctChoices|evidenceGroups|ending/);
  });
  it("persists evaluated snapshots and migrates v4 without choosing answers", () => {
    const state = emptyTheory();
    for (const { id } of theoryFields) state.draft[id] = { choiceId: solution.rules[id].correctChoices[0], statement: "仮説", reasoning: "記録の照合", evidenceIds: solution.rules[id].evidenceGroups.flat() };
    const next = submitTheory(state, ids, "2026-09-20T00:00:00.000Z");
    next.submissions[0].evaluation = validateReceipt({ ...evaluateCaseModel(model(), solution.rules, known, new Set(ids)), version: solution.version, ending: solution.ending });
    const save = { ...emptySave(), discoveredIds: ids, evidenceIds: ids, theory: next };
    expect(migrateSave(save)).toEqual(save);
    const legacy = { ...emptySave(), schemaVersion: 4 };
    expect(migrateSave(legacy).theory.draft.culprit.choiceId).toBeUndefined();
    expect(() => validateReceipt({ outcome: "supported", fields: {}, version: "future" })).toThrow();
    expect(() => validateReceipt({ outcome: "revise", fields: { culprit: "supported", motive: "supported", method: "supported", time: "supported" }, version: solution.version })).toThrow();
  });
});
