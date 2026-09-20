/** Pure server-side evaluation core. Case-specific answers are injected by the server,
 * never imported from a client component. Free text is retained by the editor, not
 * interpreted as code or matched with ambiguous keywords here. */
export const evaluationFields = ["culprit", "motive", "method", "time"] as const;
export type EvaluationField = typeof evaluationFields[number];
export interface EvaluationRule {
  allowedChoices: readonly string[];
  correctChoices: readonly string[];
  // Every group is required; any one ID in each group is sufficient.
  evidenceGroups: readonly (readonly string[])[];
}
export type EvaluationRules = Record<EvaluationField, EvaluationRule>;
export type ClaimStatus = "supported" | "revise_claim" | "insufficient_evidence";
export interface EvaluationResult {
  outcome: "supported" | "incomplete" | "revise";
  fields: Record<EvaluationField, ClaimStatus>;
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const token = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(value);

export function validateEvaluationRules(rules: EvaluationRules, caseEvidence: ReadonlySet<string>): void {
  for (const field of evaluationFields) {
    const rule = rules[field];
    if (!rule || !rule.allowedChoices.length || !rule.correctChoices.length || !rule.evidenceGroups.length ||
      rule.allowedChoices.some((id) => !token(id)) || new Set(rule.allowedChoices).size !== rule.allowedChoices.length ||
      new Set(rule.correctChoices).size !== rule.correctChoices.length || rule.correctChoices.some((id) => !rule.allowedChoices.includes(id)) ||
      rule.evidenceGroups.some((group) => !group.length || new Set(group).size !== group.length || group.some((id) => !caseEvidence.has(id)))) {
      throw new Error("Invalid server evaluation rules.");
    }
  }
}

export function evaluateCaseModel(input: unknown, rules: EvaluationRules, caseEvidence: ReadonlySet<string>, registeredEvidence: ReadonlySet<string>): EvaluationResult {
  validateEvaluationRules(rules, caseEvidence);
  if (!object(input) || Object.keys(input).length !== evaluationFields.length || Object.keys(input).some((key) => !evaluationFields.includes(key as EvaluationField))) throw new Error("Invalid case model.");
  const fields = {} as Record<EvaluationField, ClaimStatus>;
  for (const field of evaluationFields) {
    const claim = input[field];
    if (!object(claim) || Object.keys(claim).length !== 2 || !token(claim.choiceId) || !rules[field].allowedChoices.includes(claim.choiceId) ||
      !Array.isArray(claim.evidenceIds) || claim.evidenceIds.length > caseEvidence.size || new Set(claim.evidenceIds).size !== claim.evidenceIds.length ||
      claim.evidenceIds.some((id) => typeof id !== "string" || !caseEvidence.has(id) || !registeredEvidence.has(id))) throw new Error("Invalid claim or evidence reference.");
    const cited = new Set(claim.evidenceIds as string[]);
    fields[field] = !rules[field].correctChoices.includes(claim.choiceId) ? "revise_claim" :
      rules[field].evidenceGroups.every((group) => group.some((id) => cited.has(id))) ? "supported" : "insufficient_evidence";
  }
  const statuses = Object.values(fields);
  return { outcome: statuses.every((status) => status === "supported") ? "supported" : statuses.includes("revise_claim") ? "revise" : "incomplete", fields };
}
