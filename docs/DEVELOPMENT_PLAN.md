# DEVELOPMENT PLAN

## 開発原則

各マイルストーンは、独立して起動・テストできる状態で完了させる。UI追加より先に事件データと判定条件を固定し、証拠なしに解ける抜け道がないか確認する。

## ロードマップ

| Milestone | ゴール | 完了条件 |
| --- | --- | --- |
| M01 | Playable Investigation Prototype | HOTEL DB検索、0件表示、結果の証拠化 |
| M02 | Multiple Data Sources | 6ソースの操作差と共通結果型 |
| M03 | Evidence System | 発見条件、詳細表示、永続化 |
| M04 | Case Board | 証拠ノード接続、矛盾・関係のラベル |
| M05 | Story Layer | 導入、通信、節目イベント、ログ |
| M06 | Case Theory | 事件モデル編集、証拠割当、提出 |
| M07 | CASE 001 Complete | 真相まで通しプレイ、難易度調整 |
| M08 | Presentation | 音響、画面演出、アクセシビリティ |
| M09 | CASE 002 Pipeline | データ差し替えで章追加可能 |

## M01 現在地

- [x] Next.js / TypeScript 雛形
- [x] 捜査端末のレスポンシブUI
- [x] CASE 001 HOTEL DB サンプル
- [x] 限定SQL風クエリエンジン
- [x] 0件を手掛かりとして表示
- [x] 行から証拠を登録
- [x] クエリエンジン単体テスト
- [ ] 実ブラウザでの操作確認
- [ ] GitHubリポジトリ作成とCI

## M02 実装順

1. `DataSourceAdapter` インターフェースを定義
2. HOTEL DBをアダプターへ移行
3. ACCESS DBとFACILITY DBの事件データを追加
4. ログ検索式と時系列UIを実装
5. CAMERA / PAYMENT / STAFFを追加
6. すべての結果を共通の証拠候補形式へ変換
7. Playwrightで主要導線を自動化

## GitHub Actions

最初のCIは `npm ci`、`npm test`、`npm run build` の3つだけにする。CASE 001完成後にPlaywrightとアクセシビリティ検査を追加する。

## リリース判定

- 初見プレイヤー3人がヒント込みで完走できる
- 重要証拠の発見率が80%以上
- 主要画面が幅390pxと1440pxで破綻しない
- キーボードだけで検索・証拠化・提出ができる
- 推理の正誤理由をプレイヤーが説明できる
