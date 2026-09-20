import "server-only";
import solution from "./case-001.solution.json";
import { evaluateCaseModel } from "./evaluateCaseModel";
import { evidenceCatalog } from "../../game/evidence/catalog";
import { submissionIssues, theoryFields, validateDraft } from "../../game/theory/caseTheory";
import { choicesUnlocked, type EvaluationReceipt } from "../../game/theory/evaluationReceipt";

export function evaluateCase001(body: unknown): EvaluationReceipt {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("入力が不正です。");
  const input = body as Record<string, unknown>;
  if (Object.keys(input).length !== 2 || !Array.isArray(input.registeredEvidence) || input.registeredEvidence.length > evidenceCatalog.size || input.registeredEvidence.some((id) => typeof id !== "string" || !evidenceCatalog.has(id)) || new Set(input.registeredEvidence).size !== input.registeredEvidence.length) throw new Error("登録証拠が不正です。");
  const registered = input.registeredEvidence as string[];
  const draft = validateDraft(input.draft, registered);
  if (submissionIssues(draft).length || theoryFields.some(({ id }) => !draft[id].choiceId || !choicesUnlocked(id, registered))) throw new Error("結論と根拠を記入し、評価用の資料を登録してください。");
  const model = Object.fromEntries(theoryFields.map(({ id }) => [id, { choiceId: draft[id].choiceId, evidenceIds: draft[id].evidenceIds }]));
  const result = evaluateCaseModel(model, solution.rules, new Set(evidenceCatalog.keys()), new Set(registered));
  return { ...result, version: solution.version, ...(result.outcome === "supported" ? { ending: solution.ending } : {}) };
}
