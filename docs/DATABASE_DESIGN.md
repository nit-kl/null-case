# DATABASE DESIGN

## 方針

ブラウザから実DBへ任意クエリを送らない。事件ごとのJSONを読み込み、各データソース専用アダプターが許可済み構文だけを解釈する。

```mermaid
flowchart TD
  UI[捜査端末 UI] --> Adapter[データソースアダプター]
  Adapter --> Engine[安全なクエリエンジン]
  Engine --> Case[事件JSON]
  Engine --> Result[結果セット]
  Result --> Evidence[証拠化]
```

## M01のSQL風構文

```sql
SELECT * | column[, column]
FROM table
[WHERE column = value];
```

`eval` やブラウザ内SQLiteは使用しない。字句を限定した正規表現パーサーで処理する。将来はPEGパーサーへ置換可能。

## M02のアダプター

| ID | 表現 | 例 |
| --- | --- | --- |
| hotel | SQL | `SELECT * FROM rooms` |
| access | 検索式 | `room:404 AND time:[22:00 TO 23:00]` |
| camera | タイムライン | カメラ・時間帯・人物タグ |
| payment | フィルター | 金額、端末、決済手段 |
| facility | 時系列 | メトリクスと時間範囲 |
| staff | グラフ | 人物から部署・権限を探索 |

CAMERA / PAYMENT / STAFFのフォームは、許可されたキーと文字列値だけのJSONをアダプターへ渡す。CAMERAは`camera_id` / `person_tag` / `start` / `end`、PAYMENTは`terminal` / `method` / `min` / `max`、STAFFは`node_id`を使用する。未知キー・不足キー・不正な型はエラー。値をコードやSQLとして評価しない。

STAFFは人物と部署／権限の間の関係レコードを保持し、選択ノードに接続する関係だけを返す。探索方向が変わっても関係の`_recordId`は変わらないため、同じ関係の証拠を重複登録しない。

## 証拠の安定性

証拠は表示中の行番号ではなく、事件ファイルで定義した不変IDを参照する。データ表示順が変わってもセーブデータを壊さない。

## セーブデータ

初期版は `localStorage` を使用し、次を保存する。

保存キーは`null-case:case-001:investigation`。M05では`schemaVersion: 3`、`caseId: "case-001"`、`caseSchemaVersion: 1`、`discoveredIds`、`evidenceIds`、`history`、`board`、`story`を保持する。履歴はソースIDと実行した検索条件（最新100件、1件最大10,000文字）。登録済みIDは発見済みIDの部分集合であることを検証する。証拠本文は保存せず、復元時に事件データのカタログから再構築する。

`migrateSave`がバージョン境界を担当する。v1は空のボードを追加、v2は既存ボードを保持し、ともに証拠・履歴を保ってv3へ移行する。v1・v2の進捗で条件を満たす通信は未読で追加する。v2以降のボード、v3の通信状態が欠損・不正な場合は初期化せず復元を拒否する。破損、未知ID、異なる事件、未対応バージョンは復元せず、自動保存も停止して元データを保護する。容量不足や保存禁止でもメモリ上の操作は継続する。同時に複数タブからの更新を統合する処理は未対応。

`story.deliveredIds`は受信順のイベントID、`story.readIds`はその部分集合を保持する。重複ID・未知ID・未受信の既読IDを拒否する。本文は保存せずstory.jsonから表示する。受信済み通信は、その後ボードの接続を外しても消えない。保存更新とイベント判定は同じ状態更新内で行い、再実行でも同じ通信を追加しない。

`board.nodes`は`evidenceId`と整数座標`x: 0..2` / `y: 0..19`、`board.links`は`from` / `to` / `kind: relation | contradiction` / `note`を保持する。登録済み証拠だけ配置でき、座標・証拠の重複、存在しない端点、自己接続、同じ組の逆向きを含む重複接続を拒否する。接続は無向で最大100本、メモは200文字まで。メモをHTMLや式として評価しない。

以下は今後を含めた保存対象で、推理下書き・ヒント使用数はそれぞれの機能実装時に追加する。

- caseId / schemaVersion
- 発見済み証拠ID
- 実行済みクエリの履歴
- ケースボードのノード座標と接続
- 推理提出の下書き
- ヒント使用回数

事件ファイルとセーブデータには別のバージョン番号を持たせ、移行関数を用意する。
