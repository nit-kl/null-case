import { describe, expect, it } from "vitest";
import { evaluateCaseModel, evaluationFields, validateEvaluationRules, type EvaluationRules } from "../src/server/evaluation/evaluateCaseModel";

// Synthetic fixtures: no CASE 001 truth or draft plot is wired into the application.
const evidence = new Set(["record-a", "record-b", "record-c", "unrelated"]);
const rule = () => ({ allowedChoices: ["option-a", "option-b"], correctChoices: ["option-a"], evidenceGroups: [["record-a"], ["record-b", "record-c"]] });
const rules: EvaluationRules = { culprit: rule(), motive: rule(), method: rule(), time: rule() };
const input = () => Object.fromEntries(evaluationFields.map((field) => [field, { choiceId: "option-a", evidenceIds: ["record-a", "record-b"] }]));

describe("server evaluation core", () => {
  it("requires every claim and every evidence group, allowing alternative evidence", () => {
    const draft = input();
    draft.time.evidenceIds = ["record-a", "record-c"];
    expect(evaluateCaseModel(draft, rules, evidence, evidence)).toEqual({ outcome: "supported", fields: { culprit: "supported", motive: "supported", method: "supported", time: "supported" } });
  });
  it("does not accept a correct answer with missing or unrelated evidence", () => {
    const draft = input();
    draft.motive.evidenceIds = ["unrelated"];
    expect(evaluateCaseModel(draft, rules, evidence, evidence).fields.motive).toBe("insufficient_evidence");
    draft.motive.evidenceIds = [];
    expect(evaluateCaseModel(draft, rules, evidence, evidence).outcome).toBe("incomplete");
  });
  it("does not accept a wrong claim with all the correct evidence", () => {
    const draft = input(); draft.method.choiceId = "option-b";
    expect(evaluateCaseModel(draft, rules, evidence, evidence)).toMatchObject({ outcome: "revise", fields: { method: "revise_claim" } });
  });
  it("does not leak correct choice IDs, missing evidence IDs or rules in the response", () => {
    const draft = input(); draft.culprit.evidenceIds = [];
    const serialized = JSON.stringify(evaluateCaseModel(draft, rules, evidence, evidence));
    expect(serialized).not.toMatch(/option-a|record-a|record-b|evidenceGroups|correctChoices/);
  });
  it("does not mutate the submitted model or rubric", () => {
    const draft = input(); const before = JSON.stringify({ draft, rules });
    evaluateCaseModel(draft, rules, evidence, evidence);
    expect(JSON.stringify({ draft, rules })).toBe(before);
  });
  it.each([null, [], {}, { ...input(), extra: true }, { ...input(), time: { choiceId: "option-a", evidenceIds: ["unknown"] } },
    { ...input(), time: { choiceId: "option-a", evidenceIds: ["record-a", "record-a"] } },
    { ...input(), time: { choiceId: "option-a OR true", evidenceIds: [] } },
    { ...input(), time: { choiceId: "option-a", evidenceIds: [], injected: true } },
  ])("rejects malformed input %j", (draft) => expect(() => evaluateCaseModel(draft, rules, evidence, evidence)).toThrow());
  it("rejects evidence that is known but not registered", () => {
    expect(() => evaluateCaseModel(input(), rules, evidence, new Set(["record-a"]))).toThrow();
  });
  it("rejects rubrics that would permit a solution without evidence or reference missing records", () => {
    expect(() => validateEvaluationRules({ ...rules, time: { ...rules.time, evidenceGroups: [] } }, evidence)).toThrow();
    expect(() => validateEvaluationRules({ ...rules, time: { ...rules.time, evidenceGroups: [["missing"]] } }, evidence)).toThrow();
    expect(() => validateEvaluationRules({ ...rules, time: { ...rules.time, correctChoices: ["undefined-choice"] } }, evidence)).toThrow();
  });
});
