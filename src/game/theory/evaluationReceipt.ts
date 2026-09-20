import choices from "../../data/cases/case-001/theory-choices.json";
import type { TheoryField } from "./caseTheory";
export const publicChoices = choices;
export interface EvaluationReceipt {
  version: string;
  outcome: "supported" | "incomplete" | "revise";
  fields: Record<TheoryField, "supported" | "insufficient_evidence" | "revise_claim">;
  ending?: { title: string; body: string };
}
export function choicesUnlocked(field: TheoryField, registered: readonly string[]) {
  return publicChoices[field].unlockAny.some((id) => registered.includes(id));
}
export function validateReceipt(value: unknown): EvaluationReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("評価結果の形式が不正です。");
  const item = value as Record<string, unknown>;
  if (item.version !== "case-001-r1" || !item.fields || typeof item.fields !== "object" || Array.isArray(item.fields)) throw new Error("評価結果のバージョンまたは項目が不正です。");
  const fields = item.fields as Record<string, unknown>;
  if (Object.keys(fields).length !== 4 || ["culprit", "motive", "method", "time"].some((field) => !["supported", "insufficient_evidence", "revise_claim"].includes(String(fields[field])))) throw new Error("評価結果の項目が不正です。");
  const values = Object.values(fields);
  const expected = values.every((status) => status === "supported") ? "supported" : values.includes("revise_claim") ? "revise" : "incomplete";
  if (item.outcome !== expected) throw new Error("評価結果が一致しません。");
  const result: EvaluationReceipt = { version: item.version, outcome: expected, fields: { ...fields } as EvaluationReceipt["fields"] };
  if (expected === "supported") {
    const ending = item.ending as Record<string, unknown> | undefined;
    if (!ending || typeof ending.title !== "string" || typeof ending.body !== "string" || ending.title.length > 200 || ending.body.length > 4000) throw new Error("解決結果が不正です。");
    result.ending = { title: ending.title, body: ending.body };
  } else if (item.ending !== undefined) throw new Error("未解決の評価に解決文が含まれています。");
  return result;
}
