# CASE FORMAT

## 推奨ディレクトリ

```text
src/data/cases/case-001/
├─ manifest.json
├─ hotel.json
├─ access.json
├─ camera.json
├─ payment.json
├─ facility.json
├─ staff.json
├─ evidence.json
├─ story.json
└─ solution.json
```

## manifest.json

```json
{
  "schemaVersion": 1,
  "id": "case-001",
  "title": "存在しない404号室",
  "subtitle": "The Room That Does Not Exist",
  "estimatedMinutes": 60,
  "sources": ["hotel", "access", "camera", "payment", "facility", "staff"],
  "initialObjectiveId": "OBJ-001"
}
```

## レコード規約

- 重要レコードは `_recordId` を必須とする
- 日時はISO 8601とし、作中タイムゾーンを固定する
- 欠損と意図的なNULLを区別するため `_nullReason` を持てる
- UI表示ラベルと内部キーを分離する
- 真相を直接露出するフィールドはクライアント配信しない

## evidence.json

```json
{
  "schemaVersion": 1,
  "caseId": "case-001",
  "defaultUnlockWhen": "recordReturned",
  "definitions": [
    {
      "source": "hotel.room_notes.N-882",
      "title": "404号室の運用メモ",
      "unlockWhen": "recordReturned",
      "tags": ["404号室", "運用記録"]
    }
  ]
}
```

M03では`recordReturned`（検索結果に元レコードが含まれた）だけを許可する。クエリ文字列そのものを条件式として実行しない。列の選択や結果順が変わっても元レコードIDで判定する。定義のないレコードにも既定の発見条件を適用し、従来どおり全ソースの行を登録可能にする。未発見の名称やタグを一覧表示しない。

証拠IDはM02からの`E-case-001-{sourceId}-{table}-{recordId}`を維持する。既存HOTELは部屋番号・予約ID・メモID、新規ソースは`_recordId`を使用する。登録には発見済みIDが必要。真相や推理の正誤を表す`supports`は現段階のクライアント用定義に含めない。

## solution.json の扱い

製品版では答え合わせロジックをサーバー側へ置く。静的デモでは難読化を「秘匿」と見なさず、ネタバレされても問題ない試遊版だけを配信する。
