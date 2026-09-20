import type { SourceResult } from "@/game/data-sources/DataSourceAdapter";

export function SourceViews({ result, onExplore }: { result: SourceResult; onExplore: (id: string) => void }) {
  if (!result.rows.length) return null;
  if (result.sourceId === "camera") return <ol className="cameraTimeline" aria-label="映像タイムライン">
    {result.rows.map((row, i) => <li key={result.candidates[i].recordId}>
      <time dateTime={String(row.timestamp)}>{String(row.timestamp).slice(11, 16)}</time>
      <div><strong>{String(row.camera_id)} · {String(row.person_tag)}</strong><p>{String(row.note)}</p></div>
    </li>)}
  </ol>;
  if (result.sourceId === "staff") return <div className="staffGraph" aria-label="人物・部署・権限の関係">
    {result.rows.map((row, i) => <div className="staffEdge" key={result.candidates[i].recordId}>
      <button onClick={() => onExplore(String(row.person_id))}>{String(row.person_name)}</button>
      <span>─ {String(row.relation)} →</span>
      <button onClick={() => onExplore(String(row.target_id))}>{String(row.target_label)}</button>
    </div>)}
  </div>;
  return null;
}
