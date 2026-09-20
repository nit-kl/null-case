"use client";

import { useMemo, useState } from "react";
import hotelData from "@/data/cases/case-001/hotel.json";
import { createEvidence } from "@/game/evidence/createEvidence";
import { executeQuery } from "@/game/query-engine/queryEngine";
import type { DataRow, DataTable, Evidence, QueryResult } from "@/types/game";

const presets = [
  "SELECT * FROM rooms WHERE room_number = 404;",
  "SELECT * FROM rooms;",
  "SELECT * FROM room_notes WHERE room_number = 404;",
  "SELECT guest_name, room_number FROM reservations;",
];

export function InvestigationDesk() {
  const tables = hotelData.tables as DataTable[];
  const [query, setQuery] = useState(presets[0]);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const tableNames = useMemo(() => tables.map((table) => table.name), [tables]);

  const run = () => {
    try {
      setResult(executeQuery(query, tables));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "クエリを実行できませんでした。");
    }
  };

  const register = (row: DataRow) => {
    if (evidence.some((item) => JSON.stringify(item.row) === JSON.stringify(row))) return;
    setEvidence((items) => [...items, createEvidence(row, "HOTEL DB", items.length + 1)]);
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brandMark">Ø</span><div><strong>NULL CASE</strong><small>INTEGRATED INVESTIGATION SYSTEM</small></div></div>
        <div className="caseMeta"><span className="pulse" /> CASE 001 <b>存在しない404号室</b></div>
        <div className="clearance">CLEARANCE 04</div>
      </header>

      <section className="workspace">
        <aside className="sources panel">
          <p className="eyebrow">DATA SOURCES</p>
          <button className="source active"><span>H</span><div>HOTEL DB<small>CONNECTED</small></div></button>
          {["ACCESS DB", "CAMERA DB", "PAYMENT DB", "FACILITY DB", "STAFF DB"].map((name) => (
            <button className="source locked" key={name} disabled><span>×</span><div>{name}<small>LOCKED / M02</small></div></button>
          ))}
          <div className="schema">
            <p>SCHEMA</p>
            {tableNames.map((name) => <button key={name} onClick={() => setQuery(`SELECT * FROM ${name};`)}>▸ {name}</button>)}
          </div>
        </aside>

        <section className="consoleColumn">
          <div className="panel console">
            <div className="panelTitle"><span>QUERY CONSOLE</span><span className="status">● SECURE SESSION</span></div>
            <div className="presets">{presets.map((preset, index) => <button key={preset} onClick={() => setQuery(preset)}>Q{index + 1}</button>)}</div>
            <div className="editor"><span className="lineNo">1</span><textarea aria-label="SQL query" value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false} /></div>
            <button className="run" onClick={run}>RUN QUERY <kbd>CTRL ↵</kbd></button>
          </div>

          <div className="panel results">
            <div className="panelTitle"><span>RESULTS</span><span>{result ? `${result.message} ${result.elapsedMs}ms` : "AWAITING QUERY"}</span></div>
            {error && <div className="error">{error}</div>}
            {!result && !error && <div className="empty"><b>NO RESULT SET</b><span>クエリを実行して事件記録へアクセスしてください。</span></div>}
            {result && result.rows.length === 0 && <div className="zero"><strong>0 rows returned.</strong><p>記録上、その部屋は存在しません。しかし事件現場は確かに404号室でした。</p></div>}
            {result && result.rows.length > 0 && (
              <div className="tableWrap"><table><thead><tr>{result.columns.map((column) => <th key={column}>{column}</th>)}<th>action</th></tr></thead><tbody>{result.rows.map((row, index) => <tr key={index}>{result.columns.map((column) => <td key={column}>{String(row[column] ?? "NULL")}</td>)}<td><button className="pin" onClick={() => register(row)}>＋ 証拠化</button></td></tr>)}</tbody></table></div>
            )}
          </div>
        </section>

        <aside className="evidence panel">
          <div className="panelTitle"><span>EVIDENCE</span><span>{evidence.length}/12</span></div>
          {evidence.length === 0 ? <div className="empty compact"><b>EMPTY</b><span>結果行から証拠を登録</span></div> : evidence.map((item) => (
            <article className="evidenceCard" key={item.id}><small>{item.id} · {item.source}</small><h3>{item.title}</h3><p>{item.summary}</p></article>
          ))}
          <div className="objective"><small>CURRENT OBJECTIVE</small><p>404号室が部屋マスタに存在しないことを確認し、矛盾する記録を探せ。</p></div>
        </aside>
      </section>

      <footer><span>SYSTEM ONLINE</span><span>HOTEL ARGOS / 2026.10.14 / 23:41</span><button onClick={() => setBriefingOpen(true)}>事件概要</button></footer>

      {briefingOpen && <div className="modalBackdrop"><section className="briefing"><small>INVESTIGATION BRIEF / 001</small><h1>存在しない404号室</h1><p>高級ホテル「ARGOS」の404号室で男性の遺体が発見された。しかし部屋マスタには404号室が存在しない。</p><p className="quote">「データがないことは、何も起きなかった証明ではない。」</p><button onClick={() => setBriefingOpen(false)}>捜査を開始する</button></section></div>}
    </main>
  );
}
