# NULL CASE

> データに存在しない事件を追え。

複数のデータベースに残された矛盾を横断し、証拠を組み立てるWebミステリーゲームです。このリポジトリには、CASE 001「存在しない404号室」の M03（6ソース・証拠詳細・保存復元）プロトタイプが入っています。

## 現在できること

- HOTEL DB のテーブルをSQL風クエリで検索
- `rooms` に404号室が存在しないことを確認
- `room_notes` から404号室の矛盾した記録を発見
- ACCESS DB の入退室ログを部屋・時刻・カード・イベントで検索
- FACILITY DB の404号室の電力使用量を時系列グラフと測定値一覧で確認
- CAMERA DB のカメラ・人物タグ・時間帯を指定して映像タイムラインを確認
- PAYMENT DB の金額・端末・決済手段で取引記録を絞り込み
- STAFF DB の人物・部署・権限の関係を辿る
- 6ソースすべての結果行を共通のEvidenceへ登録（同じ記録の重複登録を防止）
- 証拠カードの「証拠の詳細」から元レコード全体とタグを確認
- 発見・登録した証拠と最新100件の成功した検索履歴をブラウザに自動保存し、リロード後に復元
- PC・タブレット・スマートフォン向けレスポンシブ表示

## 起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 最初に試すクエリ

```sql
SELECT * FROM rooms WHERE room_number = 404;
```

次に、次のクエリで矛盾を探します。

```sql
SELECT * FROM room_notes WHERE room_number = 404;
```

ソース一覧から **ACCESS DB** を選び、次の検索を実行します。プリセットQ1からも入力できます。

```text
room:404 AND timestamp:[22:00 TO 23:00]
```

対応条件は `room`、`card_id`、`event` の完全一致と `timestamp` の時刻範囲で、`AND`で結合できます。`time`は`timestamp`の別名です。時刻は事件当日2026-10-14のUTC+09:00で、開始・終了の分を含みます。日付をまたぐ範囲、OR、重複条件、未定義フィールドはエラーになります。

**FACILITY DB** では部屋番号404、開始22:00、終了23:00で「RUN QUERY」を押してください。電力（kW）の推移と各測定値を表示し、表の「＋ 証拠化」から登録できます。0件や1件の範囲にも対応しています。モバイルではソース一覧と結果表を横スクロールできます。

**CAMERA DB** は人物タグ`dark_coat`、22:00〜23:00で映像の記録を時系列に比較できます。タグは人物の外見分類で、同一人物であることを保証しません。

**PAYMENT DB** は最小・最大金額を2400円、決済手段を`room_charge`にすると該当取引を確認できます。金額は0以上の整数、両端を含む範囲です。空欄は下限／上限を指定しません。

**STAFF DB** は「佐伯美咲」を選んで実行し、関係図の「サービス区画への入室」を選ぶと同じ権限を持つ人物へ辿れます。各関係も結果表から証拠に登録できます。

検索で返った行が「発見済み」になり、その行から証拠を登録できます。0件の検索も履歴に残りますが、現時点では0件自体の証拠化には対応していません。証拠の名称・タグ・発見条件は`evidence.json`で定義しています。

登録した証拠は、同じブラウザ・同じサイトで再度開くと復元されます。検索履歴はEvidence欄で確認できます。入力途中のフォームや選択中のソースは復元対象外です。保存不能時は状態を画面に表示し、画面内の捜査を継続できます。破損・未対応の保存は自動上書きしません。端末間同期・複数タブ同時編集には未対応なので、捜査は1つのタブで行ってください。

ケースボード、推理提出は未実装です。

## データソース構成

- `src/game/data-sources/`: 共通`DataSourceAdapter`、6アダプター、限定検索式・構造化フィルターのパーサー
- `src/data/cases/case-001/`: ソースごとのサンプル記録。M02後半では`camera.json` / `payment.json` / `staff.json`を追加し、既存のHOTEL / ACCESS / FACILITYデータは変更していません。
- 共通結果は表示列・行に加え、ソース・テーブル・不変レコードID・元レコードを持つ証拠候補を返します。HOTELは既存の部屋番号／予約ID／メモID、新規ソースは`_recordId`を使用します。
- UIには犯人・真相・判定条件を埋め込まず、JSONの記録を表示します。`eval`、任意コード実行、実DBへの任意SQL送信は使用しません。
- `src/game/evidence/catalog.ts`: 証拠カタログと発見・登録判定。`src/game/save/`: バージョン付き保存形式、検証、保存・復元。保存された本文ではなく事件データから証拠を再構築します。

## 検証

```bash
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

単体テストはM01の検索、時刻境界と不正入力、金額範囲、人物関係の探索、全ソースの証拠IDを検証します。E2Eはビルド済みのアプリを専用ポート3100で起動し、390px・1440pxのChromiumで6ソースの操作と証拠登録を検証します。先に`npm run build`を実行してください。

## ドキュメント

- `docs/GAME_DESIGN.md` — ゲーム全体の設計
- `docs/STORY.md` — CASE 001と全体ストーリー
- `docs/DATABASE_DESIGN.md` — データソースとクエリ層
- `docs/CASE_FORMAT.md` — 事件追加フォーマット
- `docs/DEVELOPMENT_PLAN.md` — マイルストーン
- `docs/CODEX_NEXT_PROMPT.md` — 次工程をCodexへ依頼するための指示

## 開発方針

各データソースは実在サービスへ接続せず、事件ファイル内のJSONをゲーム専用クエリエンジンで検索します。SQLをブラウザ上で直接評価せず、対応構文を明示的に解析するため、安全で配布しやすい構成です。

## GitHubへ登録

```bash
git init
git add .
git commit -m "feat: add NULL CASE milestone 01 prototype"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/null-case.git
git push -u origin main
```

## License

公開範囲を決めるまでは `UNLICENSED` として扱ってください。
