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
  "id": "E-004",
  "title": "404号室の運用メモ",
  "source": "hotel.room_notes.N-882",
  "unlockWhen": {
    "query": "room_number = 404"
  },
  "tags": ["room-404", "hidden-room"],
  "supports": ["THEORY-ROOM-EXISTS"]
}
```

## solution.json の扱い

製品版では答え合わせロジックをサーバー側へ置く。静的デモでは難読化を「秘匿」と見なさず、ネタバレされても問題ない試遊版だけを配信する。
