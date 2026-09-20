# NULL CASE

> データに存在しない事件を追え。

複数のデータベースに残された矛盾を横断し、証拠を組み立てるWebミステリーゲームです。このリポジトリには、CASE 001「存在しない404号室」の Milestone 01 プロトタイプが入っています。

## 現在できること

- HOTEL DB のテーブルをSQL風クエリで検索
- `rooms` に404号室が存在しないことを確認
- `room_notes` から404号室の矛盾した記録を発見
- 結果行を証拠として保存
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

## 検証

```bash
npm test
npm run typecheck
npm run build
```

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
