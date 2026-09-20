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

## onboarding.json

導入会話と最初の操作案内を管理する公開データ。`title`、`intro`（speaker/text/scene）、`noteEvidenceId`、`roomQuery`、`noteQuery`、`steps`を持つ。sceneはホテル／通信端末の背景演出に使い、正解情報を含めない。クエリ例は入力欄にセットするだけで、実行にはプレイヤーの操作と既存アダプターの検証を必要とする。

部屋確認は404号室の指定検索が実際に0件で返った場合、発見・登録段階は既存の証拠IDで判定する。別の部屋の0件やエラーでは進行しない。通信の会話表示は既存story.jsonの受信済みイベントだけを使用し、本文を句点単位でページ表示する。最後まで読んだときだけ既読とし、途中で閉じても捜査進行には影響しない。

## conversations.json

人物会話の公開シナリオ。`characters`は表示名・役割・画像パス、`scenes`は不変id・章・題名・接続先・人物・調査先source・解放条件・台詞配列を持つ。台詞には話者と本文、任意の質問選択肢（id/label/reply）を定義する。

解放条件は`start`、登録済み証拠の`allEvidence`／`anyEvidence`、提出済みの`submitted`、支持判定と解決文が存在する`solved`だけを扱う。未解放の本文・題名を画面に出さない。質問は採点や事件記録の変更を行わず、聞き取りの返答を切り替える。

`ending: true`の台詞は公開JSONに解決文を持たず、評価APIの検証済み返却値を表示する。人物画像は演出で、画像の外見を証拠に利用しない。

## solution.json の扱い

M06の公開`theory.json`は4項目のID・表示ラベル・入力案内、文字数上限、提出件数上限のみを持つ。正解や採点基準は含めない。提出の必須条件は、各項目の推理・根拠説明・登録済み証拠1件以上。自由記述は文字列として保存・表示し、コードやHTMLとして実行しない。

M07では承認済みの追加記録を`supplemental.json`へ分離し、既存6ソースのJSONを変更せずアダプターに合流する。正解表は`src/server/evaluation/case-001.solution.json`で管理し、`server-only`の読込モジュールから評価APIへ接続する。公開の`theory-choices.json`には候補と開示条件のみを含め、正解印・必須証拠群・解決文は含めない。

評価用結論を未選択の旧提出は未評価として保持する。新しい結論を選んで再提出するまで正誤判定を行わない。自由記述は自然言語として自動採点せず、結論IDと証拠割当を判定する。

製品版では答え合わせロジックをサーバー側へ置く。静的デモでは難読化を「秘匿」と見なさず、ネタバレされても問題ない試遊版だけを配信する。
