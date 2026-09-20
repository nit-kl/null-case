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

## story.json

M05の`story.json`は`schemaVersion`、`caseId`、`briefing`（title/body/quote）、`events`を持つ。各イベントは不変`id`、`sender`、`title`、`body`、`when`、任意の`objective`を定義する。

- `when.type: start`：開始時
- `when.type: discovered`と`ids`：指定した証拠IDをすべて検索で発見
- `when.type: registered`と`ids`：指定した証拠IDをすべて登録
- `when.type: boardLinks`と`minimum`：ボードの接続数が閾値以上

条件は列挙した型だけを解釈し、任意式・SQLは実行しない。同時成立した通信はJSONの配列順で受信する。目標は受信済みイベントのうち配列上で最後の`objective`を使用し、過去の手掛かりを後から発見しても後退しない。既読は進行条件にしない。通信データに真相の答え合わせ情報を含めない。

## solution.json の扱い

M06の公開`theory.json`は4項目のID・表示ラベル・入力案内、文字数上限、提出件数上限のみを持つ。正解や採点基準は含めない。提出の必須条件は、各項目の推理・根拠説明・登録済み証拠1件以上。自由記述は文字列として保存・表示し、コードやHTMLとして実行しない。

現在は`solution.json`が存在せず、詳細な動機・侵入／犯行方法・死亡時刻と、その結論を支える十分な記録は未確定。M07で事件設定と証拠対応・採点基準を確定してから、サーバー側の正誤判定に接続する。M06の提出履歴を「正解」「解決済み」と扱わない。

製品版では答え合わせロジックをサーバー側へ置く。静的デモでは難読化を「秘匿」と見なさず、ネタバレされても問題ない試遊版だけを配信する。
