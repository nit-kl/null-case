# Codexへ渡す次工程の指示

以下をそのままCodexへ貼り付けてください。

```text
このリポジトリはWebミステリーゲーム「NULL CASE」です。
docs/GAME_DESIGN.md、docs/DATABASE_DESIGN.md、docs/CASE_FORMAT.md、
docs/DEVELOPMENT_PLAN.mdを先に読み、既存のM01を壊さずM02へ進めてください。

今回のスコープ：
1. DataSourceAdapterの共通インターフェースを作る
2. 現在のHOTEL DBをHotelAdapterへ移す
3. ACCESS DBを追加し、room:404 AND timestamp:[22:00 TO 23:00] のような検索を扱う
4. FACILITY DBを追加し、404号室の電力使用量を時系列で表示する
5. 全ソースの結果行を既存Evidenceへ登録できるようにする
6. モバイル表示を維持する
7. 単体テストを追加し、npm test と npm run build を成功させる

制約：
- evalを使わない
- 任意コードや任意SQLを実行しない
- 真相をUIコードへ直書きしない
- 既存の事件データを勝手に変更しない
- 変更後にREADMEとDEVELOPMENT_PLANを更新する

完了時は、変更ファイル、遊べる内容、テスト結果、次の課題を報告してください。
```
