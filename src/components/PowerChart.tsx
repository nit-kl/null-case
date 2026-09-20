import type { SourceResult } from "@/game/data-sources/DataSourceAdapter";

export function PowerChart({ result }: { result: SourceResult }) {
  const rows = result.rows;
  if (!rows.length) return null;
  const times = rows.map((row) => Date.parse(String(row.timestamp)));
  const min = Math.min(...times);
  const max = Math.max(...times);
  const peak = Math.max(0.1, ...rows.map((row) => Number(row.value)));
  const points = rows.map((row, i) => ({
    x: max === min ? 300 : 55 + (times[i] - min) / (max - min) * 490,
    y: 150 - Number(row.value) / peak * 120,
    row,
  }));
  return <figure className="powerChart">
    <figcaption>ROOM {String(rows[0].room)} · 電力使用量（kW）</figcaption>
    <svg viewBox="0 0 600 190" role="img" aria-label="電力使用量の時系列グラフ。各測定値は下の表で確認・証拠化できます。">
      <path d="M55 25 V150 H545" fill="none" stroke="currentColor" />
      <text x="5" y="34">{peak.toFixed(2)}</text><text x="25" y="153">0</text>
      <text x="55" y="177">{String(rows[0].timestamp).slice(11, 16)}</text>
      {max !== min && <text x="545" y="177" textAnchor="end">{String(rows[rows.length - 1].timestamp).slice(11, 16)}</text>}
      <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} fill="none" stroke="var(--cyan)" strokeWidth="2" />
      {points.map(({ x, y, row }, i) => <circle key={result.candidates[i].recordId} cx={x} cy={y} r="4" fill="var(--cyan)"><title>{String(row.timestamp)}: {String(row.value)} kW</title></circle>)}
    </svg>
  </figure>;
}
