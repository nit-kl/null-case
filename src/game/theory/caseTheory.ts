import config from "../../data/cases/case-001/theory.json";
export type TheoryField = "culprit" | "motive" | "method" | "time";
export interface TheoryClaim { statement: string; reasoning: string; evidenceIds: string[]; }
export type TheoryDraft = Record<TheoryField, TheoryClaim>;
export interface TheorySubmission { id: number; submittedAt: string; draft: TheoryDraft; }
export interface TheoryState { draft: TheoryDraft; submissions: TheorySubmission[]; }
export const theoryFields = config.fields as { id: TheoryField; label: string; prompt: string }[];
export const textLimit = config.maxTextLength;
export const submissionLimit = config.maxSubmissions;
const emptyClaim = (): TheoryClaim => ({ statement: "", reasoning: "", evidenceIds: [] });
export const emptyTheory = (): TheoryState => ({ draft: { culprit: emptyClaim(), motive: emptyClaim(), method: emptyClaim(), time: emptyClaim() }, submissions: [] });
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function validateDraft(value: unknown, registered: readonly string[]): TheoryDraft {
  if (!object(value)) throw new Error("事件モデルの形式が不正です。");
  const entries = theoryFields.map(({ id }) => {
    const claim = value[id];
    if (!object(claim) || typeof claim.statement !== "string" || typeof claim.reasoning !== "string" || claim.statement.length > textLimit || claim.reasoning.length > textLimit || !Array.isArray(claim.evidenceIds) || claim.evidenceIds.length > registered.length || claim.evidenceIds.some((id) => typeof id !== "string" || !registered.includes(id)) || new Set(claim.evidenceIds).size !== claim.evidenceIds.length) throw new Error("事件モデルの文章または根拠の証拠IDが不正です。");
    return [id, { statement: claim.statement, reasoning: claim.reasoning, evidenceIds: [...claim.evidenceIds] }];
  });
  return Object.fromEntries(entries) as TheoryDraft;
}
export function submissionIssues(draft: TheoryDraft): string[] {
  return theoryFields.flatMap(({ id, label }) => {
    const claim = draft[id];
    return [!claim.statement.trim() && `${label}の推理を入力してください。`, !claim.reasoning.trim() && `${label}の根拠説明を入力してください。`, claim.evidenceIds.length === 0 && `${label}に根拠の証拠を1件以上割り当ててください。`].filter((item): item is string => typeof item === "string");
  });
}
export function validateTheory(value: unknown, registered: readonly string[]): TheoryState {
  if (!object(value) || !Array.isArray(value.submissions) || value.submissions.length > submissionLimit) throw new Error("提出履歴の形式が不正です。");
  const draft = validateDraft(value.draft, registered);
  const submissions = value.submissions.map((entry, index): TheorySubmission => {
    if (!object(entry) || entry.id !== index + 1 || typeof entry.submittedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(entry.submittedAt) || !Number.isFinite(Date.parse(entry.submittedAt)) || new Date(entry.submittedAt).toISOString() !== entry.submittedAt) throw new Error("提出履歴の番号または日時が不正です。");
    const draft = validateDraft(entry.draft, registered);
    if (submissionIssues(draft).length) throw new Error("提出履歴に未完成の事件モデルが含まれています。");
    return { id: index + 1, submittedAt: entry.submittedAt, draft };
  });
  return { draft, submissions };
}
export function submitTheory(state: TheoryState, registered: readonly string[], submittedAt: string): TheoryState {
  const draft = validateDraft(state.draft, registered);
  const issues = submissionIssues(draft);
  if (issues.length) throw new Error(issues.join("\n"));
  if (state.submissions.length >= submissionLimit) throw new Error(`提出は${submissionLimit}件までです。下書きの編集は続けられます。`);
  const previous = state.submissions.at(-1)?.draft;
  if (previous && theoryFields.every(({ id }) => previous[id].statement === draft[id].statement && previous[id].reasoning === draft[id].reasoning && [...previous[id].evidenceIds].sort().join("|") === [...draft[id].evidenceIds].sort().join("|"))) throw new Error("直前と同じ内容は提出済みです。推理を更新してから再提出してください。");
  return validateTheory({ draft, submissions: [...state.submissions, { id: state.submissions.length + 1, submittedAt, draft }] }, registered);
}
