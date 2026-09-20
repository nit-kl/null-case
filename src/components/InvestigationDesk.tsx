"use client";

import { useState } from "react";
import { createEvidence } from "@/game/evidence/createEvidence";
import { discoverEvidence, evidenceCatalog, registerEvidence } from "@/game/evidence/catalog";
import { recordSearch } from "@/game/save/investigationSave";
import { useInvestigationSave } from "@/game/save/useInvestigationSave";
import { HotelAdapter } from "@/game/data-sources/HotelAdapter";
import { AccessAdapter } from "@/game/data-sources/AccessAdapter";
import { FacilityAdapter } from "@/game/data-sources/FacilityAdapter";
import type { DataSourceAdapter, EvidenceCandidate, SourceId, SourceResult } from "@/game/data-sources/DataSourceAdapter";
import { PowerChart } from "./PowerChart";
import { CameraAdapter } from "@/game/data-sources/CameraAdapter";
import { PaymentAdapter } from "@/game/data-sources/PaymentAdapter";
import { StaffAdapter } from "@/game/data-sources/StaffAdapter";
import { SourceFilters } from "./SourceFilters";
import { SourceViews } from "./SourceViews";
import { CaseBoard } from "./CaseBoard";

const adapters: Record<SourceId, DataSourceAdapter> = { hotel: new HotelAdapter(), access: new AccessAdapter(), camera: new CameraAdapter(), payment: new PaymentAdapter(), facility: new FacilityAdapter(), staff: new StaffAdapter() };

export function InvestigationDesk() {
  const [sourceId, setSourceId] = useState<SourceId>("hotel");
  const adapter = adapters[sourceId];
  const [query, setQuery] = useState(adapter.presets[0]);
  const [result, setResult] = useState<SourceResult | null>(null);
  const [room, setRoom] = useState("404");
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("23:00");
  const [error, setError] = useState("");
  const { save, setSave, ready, status: saveStatus } = useInvestigationSave();
  const evidence = save.evidenceIds.map((id) => evidenceCatalog.get(id)!);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const switchSource = (id: SourceId) => {
    setSourceId(id);
    setQuery(adapters[id].presets[0]);
    setResult(null);
    setError("");
  };

  const run = () => {
    if (!ready) return;
    try {
      const input = sourceId === "facility" ? `room:${room} AND metric:power_kw AND timestamp:[${startTime} TO ${endTime}]` : query;
      const next = adapter.execute(input);
      setResult(next);
      setSave((current) => recordSearch(current, sourceId, input, discoverEvidence(next)));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "クエリを実行できませんでした。");
    }
  };

  const register = (candidate: EvidenceCandidate) => {
    const item = createEvidence(candidate);
    setSave((current) => ({ ...current, evidenceIds: registerEvidence(item.id, current.discoveredIds, current.evidenceIds) }));
  };

  const exploreStaff = (id: string) => {
    const next = JSON.stringify({ node_id: id });
    setQuery(next);
    try {
      const found = adapters.staff.execute(next);
      setResult(found);
      setSave((current) => recordSearch(current, "staff", next, discoverEvidence(found)));
      setError("");
    }
    catch (caught) { setResult(null); setError(caught instanceof Error ? caught.message : "探索できませんでした。"); }
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
          <div className="sourceList">{Object.values(adapters).map((source) => <button key={source.id} aria-pressed={sourceId === source.id} onClick={() => switchSource(source.id)} className={`source ${sourceId === source.id ? "active" : ""}`}><span>{source.label[0]}</span><div>{source.label}<small>CONNECTED</small></div></button>)}
          </div>
          <div className="schema">
            <p>SCHEMA</p>
            {adapter.schema.map((table) => <button key={table.name} onClick={() => {
              setQuery(table.query);
              if (sourceId === "facility") { setRoom("404"); setStartTime("22:00"); setEndTime("23:00"); }
            }} title={table.columns.join(", ")}>▸ {table.name}<small>{table.columns.join(", ")}</small></button>)}
          </div>
        </aside>

        <section className="consoleColumn">
          <div className="panel console">
            <div className="panelTitle"><span>{adapter.label}</span><span className="status">● SECURE SESSION</span></div>
            {sourceId === "facility" ? <div className="facilityControls">
              <p>電力使用量（kW） · 2026-10-14 / UTC+09:00 · 両端の分を含む</p>
              <label>部屋番号<input type="number" min="1" value={room} onChange={(event) => setRoom(event.target.value)} /></label>
              <label>開始時刻<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
              <label>終了時刻<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
            </div> : adapter.controls ? <SourceFilters adapter={adapter} query={query} onChange={setQuery} /> : <>
              <div className="presets">{adapter.presets.map((preset, index) => <button key={preset} title={preset} aria-label={`Q${index + 1}: ${preset}`} onClick={() => setQuery(preset)}>Q{index + 1}</button>)}</div>
              <div className="editor"><span className="lineNo">1</span><textarea aria-label={sourceId === "hotel" ? "SQL query" : "ACCESS検索式"} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); run(); } }} spellCheck={false} /></div>
              {sourceId === "access" && <p className="queryHelp">room:404 AND timestamp:[22:00 TO 23:00]<br />2026-10-14 / UTC+09:00 · 両端の分を含む</p>}
            </>}
            <button className="run" disabled={!ready} onClick={run}>RUN QUERY {(sourceId === "hotel" || sourceId === "access") && <kbd>CTRL ↵</kbd>}</button>
          </div>

          <div className={`panel results ${result && ["facility", "camera", "staff"].includes(result.sourceId) ? "facilityResults" : ""}`}>
            <div className="panelTitle"><span>RESULTS</span><span>{result ? `${result.message} ${result.elapsedMs}ms` : "AWAITING QUERY"}</span></div>
            {error && <div className="error" role="alert">{error}</div>}
            {!result && !error && <div className="empty"><b>NO RESULT SET</b><span>クエリを実行して事件記録へアクセスしてください。</span></div>}
            {result && result.rows.length === 0 && <div className="zero"><strong>0 rows returned.</strong><p>この検索条件に一致する記録はありません。他の条件やデータソースと照合してください。</p></div>}
            {result?.sourceId === "facility" && <PowerChart result={result} />}
            {result && <SourceViews result={result} onExplore={exploreStaff} />}
            {result && result.rows.length > 0 && (
              <div className="tableWrap" tabIndex={0} aria-label="検索結果"><table><thead><tr>{result.columns.map((column) => <th key={column}>{column}</th>)}<th>action</th></tr></thead><tbody>{result.rows.map((row, index) => {
                const candidate = result.candidates[index];
                const saved = evidence.some((item) => item.id === createEvidence(candidate).id);
                const discovered = save.discoveredIds.includes(createEvidence(candidate).id);
                return <tr key={candidate.recordId}>{result.columns.map((column) => <td key={column}>{String(row[column] ?? "NULL")}</td>)}<td><button className="pin" disabled={saved || !discovered} onClick={() => register(candidate)}>{saved ? "登録済み" : "＋ 証拠化"}</button></td></tr>;
              })}</tbody></table></div>
            )}
          </div>
        </section>

        <aside className="evidence panel">
          <div className="panelTitle"><span>EVIDENCE</span><span aria-live="polite">{evidence.length} 件</span></div>
          <p className="saveStatus" role="status">{saveStatus}</p>
          {evidence.length === 0 ? <div className="empty compact"><b>EMPTY</b><span>結果行から証拠を登録</span></div> : evidence.map((item) => (
            <article className="evidenceCard" key={item.id}><small>{item.id} · {item.source}</small><h3>{item.title}</h3><p>{item.summary}</p>
              <details><summary>証拠の詳細</summary>
                {item.tags && item.tags.length > 0 && <p className="evidenceTags">{item.tags.join(" / ")}</p>}
                <dl>{Object.entries(item.row).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value ?? "NULL")}</dd></div>)}</dl>
              </details>
            </article>
          ))}
          <details className="queryHistory"><summary>検索履歴（{save.history.length}件／最新100件）</summary>
            <ol>{[...save.history].reverse().map((entry, index) => <li key={index}><strong>{adapters[entry.sourceId].label}</strong><pre>{entry.query}</pre></li>)}</ol>
          </details>
          <div className="objective"><small>CURRENT OBJECTIVE</small><p>404号室が部屋マスタに存在しないことを確認し、矛盾する記録を探せ。</p></div>
        </aside>
      </section>

      {ready && <CaseBoard board={save.board} evidence={evidence} onChange={(board) => setSave((current) => ({ ...current, board }))} />}
      <footer><span>SYSTEM ONLINE</span><span>HOTEL ARGOS / 2026.10.14 / 23:41</span><button onClick={() => setBriefingOpen(true)}>事件概要</button></footer>

      {briefingOpen && <div className="modalBackdrop"><section className="briefing"><small>INVESTIGATION BRIEF / 001</small><h1>存在しない404号室</h1><p>高級ホテル「ARGOS」の404号室で男性の遺体が発見された。しかし部屋マスタには404号室が存在しない。</p><p className="quote">「データがないことは、何も起きなかった証明ではない。」</p><button onClick={() => setBriefingOpen(false)}>捜査を開始する</button></section></div>}
    </main>
  );
}
