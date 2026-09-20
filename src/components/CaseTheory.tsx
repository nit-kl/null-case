"use client";
import { useState } from "react";
import { useRef } from "react";
import { choicesUnlocked, publicChoices, validateReceipt, type EvaluationReceipt } from "@/game/theory/evaluationReceipt";
import type { Evidence } from "@/types/game";
import { submitTheory, submissionIssues, textLimit, theoryFields, type TheoryState, type TheoryDraft, type TheoryField, type TheoryClaim } from "@/game/theory/caseTheory";

export function CaseTheory({ theory, evidence, onChange, onEvaluation }: { theory: TheoryState; evidence: Evidence[]; onChange: (theory: TheoryState) => void; onEvaluation: (id: number, result: EvaluationReceipt) => void }) {
  const [pending, setPending] = useState<number | null>(null);
  const busy = useRef(false);
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const titles = new Map(evidence.map((item) => [item.id, `${item.title} (${item.source})`]));
  const edit = (id: TheoryField, patch: Partial<TheoryClaim>) => {
    onChange({ ...theory, draft: { ...theory.draft, [id]: { ...theory.draft[id], ...patch } } });
    setErrors([]); setMessage("");
  };
  const summary = (draft: TheoryDraft) => <dl className="theorySummary">{theoryFields.map(({ id, label }) => <div key={id}>
    <dt>{label}</dt><dd><p>{draft[id].statement}</p><p>評価用結論：{publicChoices[id].options.find((option) => option.id === draft[id].choiceId)?.label ?? "未選択"}</p><p>根拠：{draft[id].reasoning}</p><ul>{draft[id].evidenceIds.map((evidenceId) => <li key={evidenceId}>{titles.get(evidenceId)}</li>)}</ul></dd>
  </div>)}</dl>;
  return <section className="caseTheory panel" id="case-theory" tabIndex={-1} aria-label="事件モデル">
    <div className="panelTitle"><span>CASE THEORY</span><span>{theory.submissions.length} 件提出</span></div>
    <p className="theoryHelp">4項目の推理と根拠説明を記入し、それぞれに登録済み証拠を1件以上割り当ててください。下書きは自動保存します。</p>
    <p className="theoryHelp">提出はこのブラウザに保存します。提出履歴の「判定を依頼」で、選んだ結論と証拠をサーバーへ送信します。自由記述は自動採点せず、評価用結論と証拠の組合せを判定します。方法の評価対象は侵入・偽装方法です。</p>
    <p className="theoryHelp">追加資料はHOTELのcase_documents、ACCESSのcontroller_logs・admin_audit、CAMERAの管理通路、STAFFの本人用資格情報から調査できます。資料には翌朝の追補を含みます。</p>
    {!review ? <form onSubmit={(event) => { event.preventDefault(); const issues = submissionIssues(theory.draft); setErrors(issues); if (!issues.length) { setReview(true); setMessage(""); } }}>
      <div className="theoryFields">{theoryFields.map(({ id, label, prompt }) => <fieldset key={id}>
        <legend>{label}</legend><p>{prompt}</p>
        {choicesUnlocked(id, evidence.map((item) => item.id)) ? <label>{label}の評価用結論<select aria-label={`${label}の評価用結論`} value={theory.draft[id].choiceId ?? ""} onChange={(event) => edit(id, { choiceId: event.target.value })}><option value="">未選択</option>{publicChoices[id].options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label> : <p>関連する追加資料を証拠登録すると、評価用の結論を選べます。</p>}
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
          onChange(next); setReview(false); setErrors([]); setMessage(`提出 #${next.submissions.length} を記録しました。提出履歴から判定を依頼できます。`);
        } catch (error) { setErrors([error instanceof Error ? error.message : "提出できませんでした。"]); }
      }}>提出を確定</button>
    </div>}
    {errors.length > 0 && <ul className="error" role="alert">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
    <p className="theoryHelp" role="status">{message}</p>
    <div className="theoryHistory"><h3>提出履歴</h3>{[...theory.submissions].reverse().map((entry) => <details key={entry.id}>
      <summary>提出 #{entry.id} · {entry.submittedAt.replace("T", " ").replace(".000Z", "Z")}（UTC）</summary>
      <p>{entry.evaluation ? `評価済み · ${entry.evaluation.version}` : "記録済み・真相未判定"}</p>{summary(entry.draft)}
      {entry.evaluation && <div className="evaluationResult" role="status">
        <h3>{entry.evaluation.outcome === "supported" ? "CASE 001 解決" : entry.evaluation.outcome === "incomplete" ? "根拠を補って捜査を継続" : "結論を再検討"}</h3>
        <ul>{theoryFields.map(({ id, label }) => <li key={id}>{label}：{entry.evaluation!.fields[id] === "supported" ? "結論と根拠が対応しています" : entry.evaluation!.fields[id] === "insufficient_evidence" ? "この結論を裏付ける証拠が不足しています" : "割り当てた記録と結論を再検討してください"}</li>)}</ul>
        {entry.evaluation.ending && <><h4>{entry.evaluation.ending.title}</h4><p>{entry.evaluation.ending.body}</p></>}
      </div>}
      {theoryFields.some(({ id }) => !entry.draft[id].choiceId) && <p>評価用結論が未選択です。下書きに結論を設定して再提出してください。旧提出の内容は保持します。</p>}
      <button disabled={pending !== null || theoryFields.some(({ id }) => !entry.draft[id].choiceId)} onClick={async () => {
        if (busy.current) return;
        busy.current = true; setPending(entry.id); setErrors([]);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch("/api/cases/case-001/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: entry.draft, registeredEvidence: evidence.map((item) => item.id) }), signal: controller.signal });
          if (!response.ok) throw new Error("判定できませんでした。接続と提出内容を確認して再試行してください。");
          onEvaluation(entry.id, validateReceipt(await response.json()));
          setMessage(`提出 #${entry.id} の評価を保存しました。`);
        } catch (error) { setErrors([error instanceof Error && error.name !== "AbortError" ? error.message : "通信が完了しませんでした。提出は保持しています。再試行してください。"]); }
        finally { clearTimeout(timeout); busy.current = false; setPending(null); }
      }}>{pending === entry.id ? "判定中…" : entry.evaluation ? "再判定を依頼" : "判定を依頼"}</button>
    </details>)}</div>
  </section>;
}
