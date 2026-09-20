"use client";
import { useState } from "react";
import type { Evidence } from "@/types/game";
import { submitTheory, submissionIssues, textLimit, theoryFields, type TheoryState, type TheoryDraft, type TheoryField, type TheoryClaim } from "@/game/theory/caseTheory";

export function CaseTheory({ theory, evidence, onChange }: { theory: TheoryState; evidence: Evidence[]; onChange: (theory: TheoryState) => void }) {
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const titles = new Map(evidence.map((item) => [item.id, `${item.title} (${item.source})`]));
  const edit = (id: TheoryField, patch: Partial<TheoryClaim>) => {
    onChange({ ...theory, draft: { ...theory.draft, [id]: { ...theory.draft[id], ...patch } } });
    setErrors([]); setMessage("");
  };
  const summary = (draft: TheoryDraft) => <dl className="theorySummary">{theoryFields.map(({ id, label }) => <div key={id}>
    <dt>{label}</dt><dd><p>{draft[id].statement}</p><p>根拠：{draft[id].reasoning}</p><ul>{draft[id].evidenceIds.map((evidenceId) => <li key={evidenceId}>{titles.get(evidenceId)}</li>)}</ul></dd>
  </div>)}</dl>;
  return <section className="caseTheory panel" aria-label="事件モデル">
    <div className="panelTitle"><span>CASE THEORY</span><span>{theory.submissions.length} 件提出</span></div>
    <p className="theoryHelp">4項目の推理と根拠説明を記入し、それぞれに登録済み証拠を1件以上割り当ててください。下書きは自動保存します。</p>
    <p className="theoryHelp">提出はこのブラウザの履歴に記録します。現在は記入・証拠割当の確認まで対応し、真相の正誤判定とエンディングは未実装です。</p>
    {!review ? <form onSubmit={(event) => { event.preventDefault(); const issues = submissionIssues(theory.draft); setErrors(issues); if (!issues.length) { setReview(true); setMessage(""); } }}>
      <div className="theoryFields">{theoryFields.map(({ id, label, prompt }) => <fieldset key={id}>
        <legend>{label}</legend><p>{prompt}</p>
        <label>{label}の推理<textarea aria-label={`${label}の推理`} value={theory.draft[id].statement} maxLength={textLimit} onChange={(event) => edit(id, { statement: event.target.value })} /></label>
        <label>{label}の根拠説明<textarea aria-label={`${label}の根拠説明`} value={theory.draft[id].reasoning} maxLength={textLimit} onChange={(event) => edit(id, { reasoning: event.target.value })} /></label>
        <div className="theoryEvidence" role="group" aria-label={`${label}の証拠`}>
          {evidence.length === 0 && <p>検索結果から証拠を登録してください。</p>}
          {evidence.map((item) => <label key={item.id}><input type="checkbox" checked={theory.draft[id].evidenceIds.includes(item.id)} onChange={(event) => edit(id, { evidenceIds: event.target.checked ? [...theory.draft[id].evidenceIds, item.id] : theory.draft[id].evidenceIds.filter((evidenceId) => evidenceId !== item.id) })} /><span>{titles.get(item.id)}</span></label>)}
        </div>
      </fieldset>)}</div>
      <button className="theoryAction" type="submit">提出内容を確認</button>
    </form> : <div className="theoryReview">
      <h3>提出内容の確認</h3>{summary(theory.draft)}
      <button onClick={() => { setReview(false); setErrors([]); }}>編集に戻る</button>
      <button onClick={() => {
        try {
          const next = submitTheory(theory, evidence.map((item) => item.id), new Date().toISOString());
          onChange(next); setReview(false); setErrors([]); setMessage(`提出 #${next.submissions.length} を記録しました。真相の判定は行っていません。`);
        } catch (error) { setErrors([error instanceof Error ? error.message : "提出できませんでした。"]); }
      }}>提出を確定</button>
    </div>}
    {errors.length > 0 && <ul className="error" role="alert">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
    <p className="theoryHelp" role="status">{message}</p>
    <div className="theoryHistory"><h3>提出履歴</h3>{[...theory.submissions].reverse().map((entry) => <details key={entry.id}>
      <summary>提出 #{entry.id} · {entry.submittedAt.replace("T", " ").replace(".000Z", "Z")}（UTC）</summary>
      <p>記録済み・真相未判定</p>{summary(entry.draft)}
    </details>)}</div>
  </section>;
}
