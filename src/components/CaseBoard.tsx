"use client";
import { useState } from "react";
import type { Evidence } from "@/types/game";
import { addNode, connectNodes, disconnectNodes, moveNode, pairKey, removeNode, type BoardLink, type CaseBoard as Board } from "@/game/board/caseBoard";

export function CaseBoard({ board, evidence, onChange }: { board: Board; evidence: Evidence[]; onChange: (board: Board) => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState<BoardLink["kind"]>("relation");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const items = new Map(evidence.map((item) => [item.id, item]));
  const height = Math.max(440, (Math.max(0, ...board.nodes.map((node) => node.y)) + 1) * 220);
  const change = (operation: () => Board, message: string) => {
    try { onChange(operation()); setError(""); setMessage(message); }
    catch (error) { setError(error instanceof Error ? error.message : "ボードを更新できませんでした。"); }
  };
  const selected = (id: string) => board.nodes.some((node) => node.evidenceId === id) ? id : "";
  return <section className="caseBoard panel" id="case-board" tabIndex={-1} aria-label="ケースボード">
    <div className="panelTitle"><span>CASE BOARD</span><span>{board.nodes.length} 証拠 / {board.links.length} 接続</span></div>
    <p className="boardHelp">登録した証拠を配置し、あなたの推理を接続してください。移動ボタンで配置を変更できます。同じ位置にある証拠とは場所を交換します。</p>
    {evidence.length === 0 ? <p className="boardHelp">検索結果から証拠を登録すると、ここに配置できます。</p> : <details className="boardPalette" open>
      <summary>配置する証拠</summary>
      <div>{evidence.map((item) => <button key={item.id} disabled={board.nodes.some((node) => node.evidenceId === item.id)} onClick={() => change(() => addNode(board, item.id, evidence.map((item) => item.id)), "証拠を配置しました。")}>{item.title} を配置</button>)}</div>
    </details>}
    <div className="boardViewport" tabIndex={0} aria-label="証拠の配置図（横・縦スクロール可能）">
      <div className="boardCanvas" style={{ height }}>
        <svg width="840" height={height} aria-hidden="true">
          {board.links.map((link) => {
            const a = board.nodes.find((node) => node.evidenceId === link.from)!;
            const b = board.nodes.find((node) => node.evidenceId === link.to)!;
            return <line key={pairKey(link.from, link.to)} x1={a.x * 280 + 140} y1={a.y * 220 + 100} x2={b.x * 280 + 140} y2={b.y * 220 + 100} stroke={link.kind === "contradiction" ? "#ff756f" : "#6df6dc"} strokeWidth="3" strokeDasharray={link.kind === "contradiction" ? "8 5" : undefined} />;
          })}
        </svg>
        {board.nodes.map((node) => <article className="boardNode" key={node.evidenceId} style={{ left: node.x * 280 + 20, top: node.y * 220 + 20 }} aria-label={items.get(node.evidenceId)!.title}>
          <h3>{items.get(node.evidenceId)!.title}</h3><small>{items.get(node.evidenceId)!.source}</small>
          <p>列 {node.x + 1} / 行 {node.y + 1}</p>
          <div className="boardMove">{[
            { label: "左へ", dx: -1, dy: 0, disabled: node.x === 0 }, { label: "右へ", dx: 1, dy: 0, disabled: node.x === 2 },
            { label: "上へ", dx: 0, dy: -1, disabled: node.y === 0 }, { label: "下へ", dx: 0, dy: 1, disabled: node.y === 19 },
          ].map((direction) => <button key={direction.label} disabled={direction.disabled} onClick={() => change(() => moveNode(board, node.evidenceId, direction.dx, direction.dy), "配置を変更しました。")}>{direction.label}</button>)}</div>
          <button onClick={() => change(() => removeNode(board, node.evidenceId), "配置と接続を外しました。証拠登録は保持しています。")}>ボードから外す</button>
        </article>)}
      </div>
    </div>
    <form className="boardConnect" onSubmit={(event) => { event.preventDefault(); change(() => connectNodes(board, { from: selected(from), to: selected(to), kind, note }), "接続を保存しました。"); }}>
      <p>接続はあなたの仮説です。実線は「関係」、破線は「矛盾」。同じ2件を選んで保存すると接続を更新します。</p>
      <label>証拠A<select aria-label="証拠A" value={selected(from)} onChange={(event) => setFrom(event.target.value)} required><option value="">選択してください</option>{board.nodes.map((node) => <option key={node.evidenceId} value={node.evidenceId}>{items.get(node.evidenceId)!.title}</option>)}</select></label>
      <label>証拠B<select aria-label="証拠B" value={selected(to)} onChange={(event) => setTo(event.target.value)} required><option value="">選択してください</option>{board.nodes.map((node) => <option key={node.evidenceId} value={node.evidenceId}>{items.get(node.evidenceId)!.title}</option>)}</select></label>
      <label>接続の種類<select aria-label="接続の種類" value={kind} onChange={(event) => setKind(event.target.value as BoardLink["kind"])}><option value="relation">関係</option><option value="contradiction">矛盾</option></select></label>
      <label>接続メモ<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} /></label>
      <button disabled={board.nodes.length < 2} type="submit">接続を保存</button>
    </form>
    {error && <p className="error" role="alert">{error}</p>}
    <p className="boardHelp" role="status">{message}</p>
    <ul className="boardLinks" aria-label="接続一覧">{board.links.map((link) => <li key={pairKey(link.from, link.to)}>
      <p><b>{link.kind === "contradiction" ? "矛盾" : "関係"}</b> · {items.get(link.from)!.title} ↔ {items.get(link.to)!.title}</p>
      <p>{link.note}</p>
      <button onClick={() => { setFrom(link.from); setTo(link.to); setKind(link.kind); setNote(link.note); setMessage("接続をフォームに読み込みました。"); }}>接続を編集</button>
      <button onClick={() => change(() => disconnectNodes(board, link.from, link.to), "接続を解除しました。")}>接続を解除</button>
    </li>)}</ul>
  </section>;
}
