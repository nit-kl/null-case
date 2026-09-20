import type { DataSourceAdapter } from "@/game/data-sources/DataSourceAdapter";

export function SourceFilters({ adapter, query, onChange }: { adapter: DataSourceAdapter; query: string; onChange: (query: string) => void }) {
  const values = JSON.parse(query) as Record<string, string>;
  const change = (key: string, value: string) => onChange(JSON.stringify({ ...values, [key]: value }));
  return <div className="sourceFilters">
    <p>{adapter.id === "camera" ? "映像メタデータ · 2026-10-14 / UTC+09:00 · 両端の分を含む" : adapter.id === "payment" ? "取引記録 · 金額範囲は両端を含む／空欄は制限なし" : "人物の所属・権限を検索。結果のノードを選ぶと関連人物へ辿れます。"}</p>
    {adapter.controls?.map((control) => <label key={control.key}>{control.label}
      {control.type === "select" ? <select aria-label={control.label} value={values[control.key]} onChange={(event) => change(control.key, event.target.value)}>
        {control.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select> : <input type={control.type} min={control.type === "number" ? "0" : undefined} step={control.type === "number" ? "1" : undefined} value={values[control.key]} onChange={(event) => change(control.key, event.target.value)} />}
    </label>)}
  </div>;
}
